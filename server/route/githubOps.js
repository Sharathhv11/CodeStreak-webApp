import { Router } from "express";
import {
  createRepo,
  unlinkRepo,
  getRepoStatus,
} from "../controller/githubActions/repoCreationController.js";

const gitHubRepoRouter = Router();

// GitHub Repository Management Routes
gitHubRepoRouter.post("/create-repo", createRepo);
gitHubRepoRouter.post("/unlink-repo", unlinkRepo);
gitHubRepoRouter.get("/status", getRepoStatus);

export default gitHubRepoRouter;