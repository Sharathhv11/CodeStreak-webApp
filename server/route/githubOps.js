import { Router } from "express"
import createRepo from "../controller/githubActions/repoCreationController.js"

const gitHubRepoRouter = Router()



// GitHub OAuth routes
gitHubRepoRouter.post("/create-repo", createRepo);

export default gitHubRepoRouter;