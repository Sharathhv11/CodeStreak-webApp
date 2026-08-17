import { asyncController } from "../../utils/asyncController.js";
import AppError from "../../utils/AppError.js";
import Submission from "../../model/submissionModel.js";

// Helper to convert slug to readable title
const slugToTitle = (slug) => {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to get file extension from language string
const getExtension = (language) => {
  const lang = (language || "").toLowerCase();
  if (lang.includes("cpp") || lang.includes("c++")) return "cpp";
  if (lang.includes("python") || lang.includes("py")) return "py";
  if (lang.includes("javascript") || lang.includes("js")) return "js";
  if (lang.includes("typescript") || lang.includes("ts")) return "ts";
  if (lang.includes("java")) return "java";
  if (lang.includes("csharp") || lang.includes("c#")) return "cs";
  if (lang.includes("go") || lang.includes("golang")) return "go";
  if (lang.includes("rust")) return "rs";
  if (lang.includes("c") && !lang.includes("css")) return "c";
  if (lang.includes("ruby")) return "rb";
  if (lang.includes("swift")) return "swift";
  if (lang.includes("kotlin")) return "kt";
  if (lang.includes("php")) return "php";
  if (lang.includes("sql") || lang.includes("mysql") || lang.includes("postgres")) return "sql";
  return "txt";
};

// Smart fallback concept classifier if AI API is unreachable
const deriveConceptFromCode = (code = "", language = "", tags = [], title = "") => {
  const codeLower = (code || "").toLowerCase();
  const langLower = (language || "").toLowerCase();
  const titleLower = (title || "").toLowerCase();

  // 1. Check if SQL / Database query
  if (
    langLower.includes("sql") ||
    langLower.includes("mysql") ||
    langLower.includes("postgres") ||
    /(\bselect\b.*\bfrom\b|\binsert\b|\bupdate\b.*\bset\b|\bdelete\b.*\bfrom\b|\bjoin\b)/i.test(code)
  ) {
    return "SQL";
  }

  // 2. Check tags if present
  if (Array.isArray(tags) && tags.length > 0) {
    const firstTag = typeof tags[0] === "string" ? tags[0] : tags[0]?.name || tags[0]?.slug;
    if (firstTag) return firstTag;
  }

  // 3. Check for Hash Table / Map
  if (
    codeLower.includes("unordered_map") ||
    codeLower.includes("hashmap") ||
    codeLower.includes("dict()") ||
    codeLower.includes("collections.defaultdict") ||
    codeLower.includes("collections.counter") ||
    titleLower.includes("two sum") ||
    titleLower.includes("hash")
  ) {
    return "Hash Table";
  }

  // 4. Check for Two Pointers / Sliding Window
  if (titleLower.includes("two pointer") || (codeLower.includes("left") && codeLower.includes("right") && codeLower.includes("while"))) {
    return "Two Pointers";
  }
  if (titleLower.includes("sliding window")) {
    return "Sliding Window";
  }

  // 5. Check for Binary Search
  if (codeLower.includes("binary search") || titleLower.includes("binary search") || (codeLower.includes("low") && codeLower.includes("high") && codeLower.includes("mid"))) {
    return "Binary Search";
  }

  // 6. Check for Trees / Graphs
  if (codeLower.includes("treenode") || codeLower.includes("left") && codeLower.includes("right") && codeLower.includes("val")) {
    return "Trees";
  }
  if (codeLower.includes("adj") || codeLower.includes("graph") || codeLower.includes("visited")) {
    return "Graph";
  }

  // 7. Check for Dynamic Programming
  if (codeLower.includes("dp =") || codeLower.includes("dp[") || codeLower.includes("memo") || titleLower.includes("dynamic programming")) {
    return "Dynamic Programming";
  }

  // 8. Array / String default
  if (codeLower.includes("arr") || codeLower.includes("nums") || codeLower.includes("array")) {
    return "Arrays";
  }

  return "General";
};

// Helper to derive and slugify concept names (e.g. "Hash Table" -> "hash-table")
const deriveConceptSlug = (rawConcept, tags) => {
  if (rawConcept && typeof rawConcept === "string" && rawConcept.trim()) {
    return rawConcept
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const firstTag = tags[0];
    const tagName = typeof firstTag === "string" ? firstTag : firstTag?.name || firstTag?.slug || "";
    if (tagName) {
      return tagName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
  }

  return "general";
};

// Helper to push a file to GitHub repository (creates or updates)
const pushToGitHub = async (user, filePath, fileContent, commitMessage) => {
  const { github_username, github_repo_name, github_access_token } = user;
  const url = `https://api.github.com/repos/${github_username}/${github_repo_name}/contents/${filePath}`;

  // 1. Check if the file already exists to get its SHA for update
  let sha = null;
  try {
    const checkRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${github_access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (checkRes.ok) {
      const fileData = await checkRes.json();
      sha = fileData.sha;
    }
  } catch (err) {
    console.error(`Error checking file existence for ${filePath}:`, err);
  }

  // 2. Push content to GitHub
  const body = {
    message: commitMessage,
    content: Buffer.from(fileContent).toString("base64"),
  };
  if (sha) {
    body.sha = sha;
  }

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${github_access_token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errorJson = await putRes.json();
    throw new Error(`GitHub upload failed: ${errorJson.message || putRes.statusText}`);
  }

  return await putRes.json();
};

export const submissionControll = asyncController(async function (req, res, next) {
  const { slug, language, code, runtime, memory, tags, platform = "LeetCode" } = req.body;
  const user = req.user;

  if (!slug || !code || !language) {
    return next(new AppError("Missing required submission fields (slug, code, language).", 400));
  }

  // 1. Derive problem title (use provided title or convert from slug)
  const title = req.body.title || slugToTitle(slug);

  // 2. Fetch Time & Space Complexity, Explanation, and Concept classification from AI API
  let timeComplexity = "O(N)";
  let spaceComplexity = "O(N)";
  let explanation = "Explanation could not be generated at this time.";
  let detectedConcept = null;
  let detectedDifficulty = null;

  const prompt = `You are an expert DSA & Competitive Programming AI evaluator. Analyze the following code solution for the problem "${title}" written in "${language}".
Code:
${code}

Perform deep static analysis and return a JSON object with exactly the following keys:
1. "concept": The precise core DSA paradigm, data structure, or domain pattern used in this solution.
   - If this is a database/query problem (SQL, MySQL, PostgreSQL, Pandas): return "SQL" or "Database".
   - If the code uses a hash map, dictionary, or frequency counter: return "Hash Table" or "Hashing".
   - If the problem operates on array manipulation, cyclic index placement, prefix sums: return "Arrays" (or specific pattern like "Two Pointers", "Sliding Window", "Prefix Sum").
   - If graph or tree: return "Graph", "Trees", "Binary Search Tree", "BFS", "DFS", or "Trie".
   - If algorithmic technique: return "Dynamic Programming", "Binary Search", "Greedy", "Backtracking", "Bit Manipulation", "Math", "Stack", "Queue", "Heap", or "Linked List".
   - Return the single most accurate, canonical concept name.
2. "difficulty": Standard algorithmic difficulty classification for this problem: "Easy", "Medium", or "Hard".
3. "timeComplexity": The time complexity of this solution in Big-O notation (e.g., "O(N)", "O(N log N)", "O(1)").
4. "spaceComplexity": The space complexity of this solution in Big-O notation (e.g., "O(N)", "O(1)").
5. "explanation": A concise, high-signal explanation of how the solution works and why it has this complexity (2-3 sentences max).

Output strictly valid JSON with no markdown formatting or backticks outside the JSON object.`;

  if (process.env.GEMINI_API) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const contentStr = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          if (parsed.timeComplexity) timeComplexity = parsed.timeComplexity;
          if (parsed.spaceComplexity) spaceComplexity = parsed.spaceComplexity;
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.concept && typeof parsed.concept === "string" && parsed.concept.trim()) {
            detectedConcept = parsed.concept.trim();
          }
          if (parsed.difficulty && ["Easy", "Medium", "Hard"].includes(parsed.difficulty.trim())) {
            detectedDifficulty = parsed.difficulty.trim();
          }
        }
      } else {
        const errorText = await geminiRes.text();
        console.error(`Gemini API error response status: ${geminiRes.status}, body: ${errorText}`);
      }
    } catch (geminiErr) {
      console.error("Gemini API invocation failed:", geminiErr);
    }
  } else if (process.env.GROK_API) {
    try {
      let grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROK_API}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-2",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (!grokRes.ok && (grokRes.status === 400 || grokRes.status === 404)) {
        grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROK_API}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
      }

      if (grokRes.ok) {
        const grokData = await grokRes.json();
        const contentStr = grokData.choices?.[0]?.message?.content?.trim();
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          if (parsed.timeComplexity) timeComplexity = parsed.timeComplexity;
          if (parsed.spaceComplexity) spaceComplexity = parsed.spaceComplexity;
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.concept && typeof parsed.concept === "string" && parsed.concept.trim()) {
            detectedConcept = parsed.concept.trim();
          }
          if (parsed.difficulty && ["Easy", "Medium", "Hard"].includes(parsed.difficulty.trim())) {
            detectedDifficulty = parsed.difficulty.trim();
          }
        }
      }
    } catch (grokErr) {
      console.error("Grok API invocation failed:", grokErr);
    }
  }

  // Fallback difficulty resolution
  let resolvedDifficulty = detectedDifficulty || req.body.difficulty;
  if (!resolvedDifficulty && Array.isArray(tags)) {
    for (const t of tags) {
      const tagText = typeof t === "string" ? t : t?.name || "";
      const lower = tagText.toLowerCase();
      if (["easy", "school", "basic"].includes(lower)) { resolvedDifficulty = "Easy"; break; }
      if (["medium", "medium-hard"].includes(lower)) { resolvedDifficulty = "Medium"; break; }
      if (["hard", "expert"].includes(lower)) { resolvedDifficulty = "Hard"; break; }
    }
  }
  if (!resolvedDifficulty || !["Easy", "Medium", "Hard"].includes(resolvedDifficulty)) {
    resolvedDifficulty = "Medium";
  }

  // If AI did not return a concept, fallback to smart code analysis and tags
  if (!detectedConcept) {
    detectedConcept = req.body.concept || deriveConceptFromCode(code, language, tags, title);
  }

  // 3. GitHub Hierarchy: /{platform}/{ai_concept}/{problem}
  const platformFolder = (platform || "leetcode").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const conceptFolder = deriveConceptSlug(detectedConcept, tags);
  const problemFolder = slug.toLowerCase().replace(/[^a-z0-9-_.]+/g, "-");

  let githubSolutionUrl = null;
  let githubReadmeUrl = null;

  if (user.is_repo_ready && user.github_repo_name) {
    try {
      const extension = getExtension(language);

      // File 1: Solution Source File -> /{platform}/{concept}/{problem}/Solution.{ext}
      const solutionPath = `${platformFolder}/${conceptFolder}/${problemFolder}/Solution.${extension}`;
      const solutionCommitMsg = `Sync Solution for ${title} [${conceptFolder}] - CodeStreak`;
      const pushSolutionRes = await pushToGitHub(user, solutionPath, code, solutionCommitMsg);
      githubSolutionUrl = pushSolutionRes?.content?.html_url || null;

      // File 2: README.md -> /{platform}/{concept}/{problem}/README.md
      const tagNames = Array.isArray(tags)
        ? tags.map((t) => (typeof t === "string" ? t : t.name)).join(", ")
        : "";

      const readmeContent = `# ${title}

## Problem Information
- **Platform:** ${platform}
- **Concept / Pattern:** ${detectedConcept || conceptFolder}
- **Language:** ${language}
- **Runtime:** ${runtime || "N/A"}
- **Memory:** ${memory || "N/A"}
- **Tags:** ${tagNames || "None"}

## Complexity Analysis
- **Time Complexity:** ${timeComplexity}
- **Space Complexity:** ${spaceComplexity}

## Explanation
${explanation}

---
*Generated automatically by [CodeStreak](https://github.com/Sharathhv11/CodeStreak-webApp).*
`;

      const readmePath = `${platformFolder}/${conceptFolder}/${problemFolder}/README.md`;
      const readmeCommitMsg = `Update analysis for ${title} [${conceptFolder}] - CodeStreak`;
      const pushReadmeRes = await pushToGitHub(user, readmePath, readmeContent, readmeCommitMsg);
      githubReadmeUrl = pushReadmeRes?.content?.html_url || null;
    } catch (gitErr) {
      console.error("GitHub file syncing failed:", gitErr);
    }
  }

  // 4. Save to MongoDB
  const tagList = Array.isArray(tags)
    ? tags.map((t) =>
        typeof t === "string"
          ? { name: t, slug: t.toLowerCase().replace(/\s+/g, "-") }
          : { name: t.name, slug: t.slug }
      )
    : [];

  // Add primary AI-derived concept to tags if not already present
  const primaryConceptName = detectedConcept || conceptFolder;
  if (primaryConceptName && !tagList.some((t) => t.name?.toLowerCase() === primaryConceptName.toLowerCase())) {
    tagList.unshift({ name: primaryConceptName, slug: conceptFolder });
  }

  const newSubmission = await Submission.create({
    user: user._id,
    slug,
    title,
    language,
    code,
    runtime,
    memory,
    concept: primaryConceptName,
    difficulty: resolvedDifficulty,
    tags: tagList,
    platform,
    github_solution_url: githubSolutionUrl,
    github_readme_url: githubReadmeUrl,
    timeComplexity,
    spaceComplexity,
    explanation,
  });

  res.status(201).json({
    success: true,
    message: "Submission processed and saved successfully.",
    data: newSubmission,
    github: {
      solutionUrl: githubSolutionUrl,
      readmeUrl: githubReadmeUrl,
      path: `${platformFolder}/${conceptFolder}/${problemFolder}`,
    },
  });
});

// Retrieves all submissions for the logged-in user
export const getSubmissions = asyncController(async function (req, res, next) {
  const submissions = await Submission.find({ user: req.user._id }).sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

// Aggregates submission count by date for the calendar heatmap
export const getHeatmapData = asyncController(async function (req, res, next) {
  const heatmap = await Submission.aggregate([
    {
      $match: {
        user: req.user._id,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
        },
        count: { $sum: 1 },
        submissions: {
          $push: {
            _id: "$_id",
            title: "$title",
            slug: "$slug",
            language: "$language",
            platform: "$platform",
            concept: "$concept",
            difficulty: "$difficulty",
            timestamp: "$timestamp",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: heatmap,
  });
});