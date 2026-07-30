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

// Helper to get extension from language string
const getExtension = (language) => {
  const lang = language.toLowerCase();
  if (lang.includes("cpp") || lang.includes("c++")) return "cpp";
  if (lang.includes("python") || lang.includes("py")) return "py";
  if (lang.includes("javascript") || lang.includes("js")) return "js";
  if (lang.includes("typescript") || lang.includes("ts")) return "ts";
  if (lang.includes("java")) return "java";
  if (lang.includes("csharp") || lang.includes("c#")) return "cs";
  if (lang.includes("go") || lang.includes("golang")) return "go";
  if (lang.includes("rust")) return "rs";
  if (lang.includes("c")) return "c";
  if (lang.includes("ruby")) return "rb";
  if (lang.includes("swift")) return "swift";
  if (lang.includes("kotlin")) return "kt";
  if (lang.includes("php")) return "php";
  return "txt";
};

// Helper to push a file to GitHub repository (creates or updates)
const pushToGitHub = async (user, filePath, fileContent, commitMessage) => {
  const { github_username, github_repo_name, github_access_token } = user;
  const url = `https://api.github.com/repos/${github_username}/${github_repo_name}/contents/${filePath}`;

  // 1. Check if the file already exists to get its SHA
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
  const { slug, language, code, runtime, memory, tags } = req.body;
  const user = req.user;

  if (!slug || !code || !language) {
    return next(new AppError("Missing required submission fields (slug, code, language).", 400));
  }

  // 1. Derive problem title from slug
  const title = slugToTitle(slug);

  // 2. Fetch Time & Space Complexity and Explanation from Gemini API (with Grok fallback)
  let timeComplexity = "O(N)";
  let spaceComplexity = "O(N)";
  let explanation = "Explanation could not be generated at this time.";

  const prompt = `Analyze the following DSA code for the problem "${title}" written in "${language}".
Code:
${code}

Return a JSON object containing exactly the following keys:
1. "timeComplexity": The time complexity of this solution (e.g., "O(N)", "O(N log N)", "O(1)").
2. "spaceComplexity": The space complexity of this solution (e.g., "O(N)", "O(1)").
3. "explanation": A brief explanation of how the solution works and why it has this complexity (2-3 sentences max).

Do not include any markdown formatting, backticks, or other text outside the JSON object. Output ONLY valid JSON.`;

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
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      // Fallback: If grok-2 is unavailable, try grok-beta
      if (!grokRes.ok && (grokRes.status === 400 || grokRes.status === 404)) {
        const initialErrorBody = await grokRes.text();
        console.warn(`Grok API returned ${grokRes.status} for model 'grok-2'. Response: ${initialErrorBody}. Retrying with 'grok-beta'...`);
        
        grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROK_API}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
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
        }
      } else {
        const errorText = await grokRes.text();
        console.error(`Grok API error response status: ${grokRes.status}, body: ${errorText}`);
      }
    } catch (grokErr) {
      console.error("Grok API invocation failed:", grokErr);
    }
  } else {
    console.warn("Neither GEMINI_API nor GROK_API is set in environment variables. Falling back to default values.");
  }

  // 3. GitHub Integration
  let githubSolutionUrl = null;
  let githubReadmeUrl = null;

  if (user.is_repo_ready && user.github_repo_name) {
    try {
      const extension = getExtension(language);
      
      // File 1: Solution Source File
      const solutionPath = `LeetCode/${slug}/Solution.${extension}`;
      const solutionCommitMsg = `Sync Solution for ${title} - CodeStreak`;
      const pushSolutionRes = await pushToGitHub(user, solutionPath, code, solutionCommitMsg);
      githubSolutionUrl = pushSolutionRes?.content?.html_url || null;

      // File 2: README.md
      const tagNames = Array.isArray(tags) ? tags.map((t) => typeof t === "string" ? t : t.name).join(", ") : "";
      const readmeContent = `# ${title}

## Problem Information
- **Platform:** LeetCode
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

      const readmePath = `LeetCode/${slug}/README.md`;
      const readmeCommitMsg = `Update analysis for ${title} - CodeStreak`;
      const pushReadmeRes = await pushToGitHub(user, readmePath, readmeContent, readmeCommitMsg);
      githubReadmeUrl = pushReadmeRes?.content?.html_url || null;
    } catch (gitErr) {
      console.error("GitHub file syncing failed:", gitErr);
      // We choose to log and proceed so that MongoDB save and response is still completed.
    }
  } else {
    console.warn(`Skipped pushing to GitHub for user ${user.github_username} because repository setup is not completed.`);
  }

  // 4. Save to MongoDB
  const tagList = Array.isArray(tags)
    ? tags.map((t) => (typeof t === "string" ? { name: t, slug: t.toLowerCase().replace(/\s+/g, "-") } : { name: t.name, slug: t.slug }))
    : [];

  const newSubmission = await Submission.create({
    user: user._id,
    slug,
    title,
    language,
    code,
    runtime,
    memory,
    tags: tagList,
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