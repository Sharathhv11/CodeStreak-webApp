import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    runtime: {
      type: String,
      default: null,
    },
    memory: {
      type: String,
      default: null,
    },
    concept: {
      type: String,
      default: "general",
    },
    tags: [
      {
        name: String,
        slug: String,
      },
    ],
    timeComplexity: {
      type: String,
      default: null,
    },
    spaceComplexity: {
      type: String,
      default: null,
    },
    explanation: {
      type: String,
      default: null,
    },
    platform: {
      type: String,
      default: "LeetCode",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    github_solution_url: {
      type: String,
      default: null,
    },
    github_readme_url: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexing user and timestamp for faster retrieval of heatmap data
submissionSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model("Submission", submissionSchema);
