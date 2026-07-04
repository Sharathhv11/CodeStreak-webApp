import { Router } from "express"
import createRepo from "../middleware/repoCreationController.js"

const gitHubRepoRouter = Router()



// GitHub OAuth routes
gitHubRepoRouter.post("/create-repo", createRepo);

export default gitHubRepoRouter;