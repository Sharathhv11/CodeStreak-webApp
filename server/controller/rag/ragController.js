import { asyncController } from "../../utils/asyncController.js";
import AppError from "../../utils/AppError.js";
import { ask } from "../../services/ragService.js";
import { getEmbeddingStats } from "../../services/vectorStoreService.js";
import Submission from "../../model/submissionModel.js";

// POST /api/rag/ask
// Accepts a natural-language question and returns a context-aware answer
// grounded in the authenticated user's own coding problems.

export const askQuestion = asyncController(async (req, res, next) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return next(new AppError("Please provide a question.", 400));
  }

  const result = await ask(req.user._id, question);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// GET /api/rag/status
// Returns embedding coverage stats for the authenticated user.
// Useful for the frontend to show "X of Y problems indexed".

export const getStatus = asyncController(async (req, res, next) => {
  const totalSubmissions = await Submission.countDocuments({
    user: req.user._id,
  });
  const embeddedCount = await getEmbeddingStats(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      totalSubmissions,
      embeddedCount,
      coverage:
        totalSubmissions > 0
          ? Math.round((embeddedCount / totalSubmissions) * 100)
          : 0,
    },
  });
});
