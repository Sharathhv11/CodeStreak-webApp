import crypto from "crypto";

// ─── Document Preparation ────────────────────────────────────────
// Converts a Submission document into a flat text string suitable for embedding.
// This is the ONLY place that defines what text gets embedded — change it here
// to include/exclude fields or alter formatting.

export function prepareDocument(submission) {
  const parts = [];

  if (submission.title) {
    parts.push(`Title: ${submission.title}`);
  }

  const meta = [];
  if (submission.platform) meta.push(`Platform: ${submission.platform}`);
  if (submission.difficulty) meta.push(`Difficulty: ${submission.difficulty}`);
  if (submission.concept) meta.push(`Concept: ${submission.concept}`);
  if (meta.length > 0) parts.push(meta.join(" | "));

  if (Array.isArray(submission.tags) && submission.tags.length > 0) {
    const tagNames = submission.tags
      .map((t) => (typeof t === "string" ? t : t.name || t.slug))
      .filter(Boolean);
    if (tagNames.length > 0) parts.push(`Tags: ${tagNames.join(", ")}`);
  }

  if (submission.language) {
    parts.push(`Language: ${submission.language}`);
  }

  const complexity = [];
  if (submission.timeComplexity)
    complexity.push(`Time ${submission.timeComplexity}`);
  if (submission.spaceComplexity)
    complexity.push(`Space ${submission.spaceComplexity}`);
  if (complexity.length > 0)
    parts.push(`Complexity: ${complexity.join(", ")}`);

  if (submission.explanation) {
    parts.push(`Explanation: ${submission.explanation}`);
  }

  if (submission.code) {
    // Truncate very large code blocks to keep embedding input reasonable
    const maxCodeLength = 2000;
    const code =
      submission.code.length > maxCodeLength
        ? submission.code.slice(0, maxCodeLength) + "\n... (truncated)"
        : submission.code;
    parts.push(`Code:\n${code}`);
  }

  return parts.join("\n");
}

// ─── Content Hashing ─────────────────────────────────────────────
// SHA-256 hash of document text. Used to detect whether content changed
// since the last embedding, avoiding unnecessary re-embeddings.

export function hashContent(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

// ─── Gemini Embedding API ────────────────────────────────────────
// Calls the Gemini embedding model (gemini-embedding-001). This is the ONLY function
// that knows about the embedding provider. To swap to OpenAI or another
// provider, change only this function.

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_DIMENSIONS =
  parseInt(process.env.EMBEDDING_DIMENSIONS, 10) || 768;
const EMBEDDING_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API environment variable is not set. Cannot generate embeddings."
    );
  }

  const url = `${EMBEDDING_API_BASE}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini Embedding API error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(
      "Gemini Embedding API returned empty or invalid embedding."
    );
  }

  return values;
}

// ─── High-Level Indexing Helper ──────────────────────────────────
// Called from the submission controller after a new submission is created.
// Prepares the document, checks the hash, generates embedding, and upserts.

import { upsertEmbedding } from "./vectorStoreService.js";

export async function indexSubmissionEmbedding(submission, userId) {
  const documentText = prepareDocument(submission);
  const contentHash = hashContent(documentText);

  const embedding = await generateEmbedding(documentText);

  await upsertEmbedding({
    userId,
    submissionId: submission._id,
    embedding,
    contentHash,
    documentText,
  });
}
