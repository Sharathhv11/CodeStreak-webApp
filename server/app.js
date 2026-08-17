import express from "express";
import authRouter from "./route/auth/authRoute.js";
import { protect } from "./middleware/authMiddleware.js";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import gitHubRepoRouter from "./route/githubOps.js";
import submissionRouter from "./route/submission.js";

const app = express();

// Middleware
app.use(express.json());

//^ Auth controller 
app.use("/auth", authRouter);

//^ repo controller
app.use("/repo", protect, gitHubRepoRouter);

//^ submission controller
app.use("/api/submission", protect, submissionRouter);

// Global Error Handler
app.use(globalErrorHandler);

export default app;