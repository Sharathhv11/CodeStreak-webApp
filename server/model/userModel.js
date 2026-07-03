import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // from GitHub OAuth
    github_id:        { type: Number, required: true, unique: true },
    github_username:  { type: String, required: true },
    email:            { type: String, default: null },
    name:             { type: String },
    avatar_url:       { type: String },
    github_access_token: { type: String, default: null },

    // GitHub App installation — set after user grants repo access
    installation_id:  { type: Number, default: null },

    // repo info — set after first-time repo setup
    github_repo_name: { type: String, default: null },
    github_repo_url:  { type: String, default: null },
    is_repo_ready:    { type: Boolean, default: false },

    // CodeStreak account
    tier: { type: String, enum: ["free", "premium"], default: "free" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);