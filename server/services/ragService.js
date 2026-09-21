import { generateEmbedding } from "./embeddingService.js";
import { searchSimilar } from "./vectorStoreService.js";
import Submission from "../model/submissionModel.js";

// ─── Configuration ───────────────────────────────────────────────

const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const MAX_QUESTION_LENGTH = 500;
const DEFAULT_TOP_K = 5;

// ─── RAG Pipeline ────────────────────────────────────────────────
// Orchestrates: embed query → retrieve context → generate answer

export async function ask(userId, question) {
  // 1. Validate input
  if (!question || typeof question !== "string" || !question.trim()) {
    throw Object.assign(new Error("Question cannot be empty."), {
      statusCode: 400,
    });
  }

  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    throw Object.assign(
      new Error(
        `Question is too long (${trimmedQuestion.length} chars). Maximum is ${MAX_QUESTION_LENGTH} characters.`
      ),
      { statusCode: 400 }
    );
  }

  // 2. Generate query embedding
  const queryEmbedding = await generateEmbedding(trimmedQuestion);

  // 3. Retrieve top-K relevant documents (user-scoped)
  const results = await searchSimilar(userId, queryEmbedding, DEFAULT_TOP_K);

  if (!results || results.length === 0) {
    return {
      answer:
        "I couldn't find any relevant coding problems in your collection to answer this question. Try solving more problems first, or rephrase your question.",
      references: [],
    };
  }

  // 4. Fetch full submission documents for context
  const submissionIds = results.map((r) => r.submission);
  const submissions = await Submission.find({
    _id: { $in: submissionIds },
    user: userId,
  }).lean();

  // Build a lookup map for scores
  const scoreMap = new Map();
  for (const r of results) {
    scoreMap.set(r.submission.toString(), r.score);
  }

  // Sort submissions by similarity score (highest first) for the LLM prompt
  submissions.sort((a, b) => {
    const scoreA = scoreMap.get(a._id.toString()) || 0;
    const scoreB = scoreMap.get(b._id.toString()) || 0;
    return scoreB - scoreA;
  });

  console.log(
    `[RAG] 📚 Retrieved ${submissions.length} problems for context: ${submissions
      .map((s) => `"${s.title}" (${((scoreMap.get(s._id.toString()) || 0) * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

// Helper to clean messy or noisy titles that might contain code snippets
function sanitizeTitle(raw) {
  if (!raw) return "Untitled Problem";
  let cleaned = raw.split(/\r?\n/)[0];
  cleaned = cleaned.replace(/class\s+Solution.*$/i, "");
  cleaned = cleaned.replace(/[{};()=].*$/, "");
  cleaned = cleaned.trim();
  return cleaned || raw.slice(0, 40).trim();
}

  // 5. Build context string from retrieved submissions
  const contextParts = submissions.map((sub, i) => {
    const score = scoreMap.get(sub._id.toString()) || 0;
    const cleanTitle = sanitizeTitle(sub.title);
    return [
      `--- Problem ${i + 1} (relevance: ${(score * 100).toFixed(1)}%) ---`,
      `Title: ${cleanTitle}`,
      `Platform: ${sub.platform} | Difficulty: ${sub.difficulty} | Concept: ${sub.concept}`,
      sub.tags?.length > 0
        ? `Tags: ${sub.tags.map((t) => t.name || t.slug).join(", ")}`
        : null,
      `Language: ${sub.language}`,
      sub.timeComplexity
        ? `Time Complexity: ${sub.timeComplexity}`
        : null,
      sub.spaceComplexity
        ? `Space Complexity: ${sub.spaceComplexity}`
        : null,
      sub.explanation ? `Explanation: ${sub.explanation}` : null,
      sub.code ? `Code:\n${sub.code.slice(0, 1500)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const context = contextParts.join("\n\n");

  // 6. Construct grounded prompt
  const systemPrompt = `You are an expert, friendly AI coding mentor for the CodeStreak platform. You help users analyze and understand their own coding practice by answering questions about their saved coding problems and solutions.

CRITICAL PRESENTATION & GROUNDING RULES:
1. Grounding: Answer based ONLY on the user's coding problems provided below in the context. Never fabricate problems they haven't solved.
2. Rich Formatting:
   - Format with clean, readable Markdown using headings (###), bold titles, and structured bullet lists.
   - For every problem you mention, present it prominently, e.g.:
     - **Problem Title** \`[Platform]\` \`[Difficulty]\`
       - **Concept:** ConceptName (e.g. Hash Map, Two Pointers, Stack)
       - **Complexity:** Time O(N), Space O(1) (if available)
       - **Key Takeaway:** A brief 1-sentence note about why it's categorized this way or how the user solved it.
   - When asked for "hardest problems", group them logically by difficulty level and explain what makes them challenging.
   - Use clear paragraphs with good spacing so the answer is effortless to scan.
3. Clean Titles: If a problem title contains code artifacts or noise, use only the clean name.

USER'S CODING PROBLEMS (context):
${context}

USER'S QUESTION:
${trimmedQuestion}`;

  // 7. Call Gemini for grounded answer generation
  const answer = await callGeminiGenerate(systemPrompt);

  // 8. Build references list (deduplicated by submission ID)
  const seenIds = new Set();
  const references = [];
  for (const sub of submissions) {
    const idStr = sub._id.toString();
    if (!seenIds.has(idStr)) {
      seenIds.add(idStr);
      references.push({
        submissionId: sub._id,
        title: sanitizeTitle(sub.title),
        slug: sub.slug,
        platform: sub.platform,
        difficulty: sub.difficulty,
        concept: sub.concept,
        language: sub.language,
        score: scoreMap.get(idStr) || 0,
      });
    }
  }

  // Sort references by score (highest first)
  references.sort((a, b) => b.score - a.score);

  return { answer, references };
}

// ─── Gemini Generate Content ─────────────────────────────────────
// Calls Gemini generateContent API with the grounded prompt.
// Uses the same raw fetch() pattern as the existing submissionController.

async function callGeminiGenerate(prompt) {
  const apiKey = process.env.GEMINI_API;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API environment variable is not set. Cannot generate answers."
    );
  }

  const url = `${GEMINI_GENERATE_URL}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Gemini Generate API error (${response.status}):`, errorBody);
    throw new Error(
      "Failed to generate an answer. The AI service is temporarily unavailable."
    );
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
