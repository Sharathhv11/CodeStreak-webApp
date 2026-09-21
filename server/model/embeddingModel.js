import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    contentHash: {
      type: String,
      required: true,
    },
    documentText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for user-scoped queries and lookups
embeddingSchema.index({ user: 1 });
embeddingSchema.index({ submission: 1, user: 1 });

export default mongoose.model("Embedding", embeddingSchema);
