import express from "express";
import cors from "cors";
import authRouter from "./route/auth/authRoute.js";
import { protect } from "./middleware/authMiddleware.js";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import gitHubRepoRouter from "./route/githubOps.js";
import submissionRouter from "./route/submission.js";
import ragRouter from "./route/rag.js";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send({
    status: "ok",
    message:"server is working fine."
  })
})

//^ Auth controller 
app.use("/auth", authRouter);

//^ repo controller
app.use("/repo", protect, gitHubRepoRouter);

//^ submission controller
app.use("/api/submission", protect, submissionRouter);

//^ RAG AI assistant
app.use("/api/rag", protect, ragRouter);

// Global Error Handler
app.use(globalErrorHandler);

export default app;