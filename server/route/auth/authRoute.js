import { Router } from "express"
import { githubLogin, githubCallback } from "../../controller/auth/githubAuth.js"

const authRouter = Router()



// GitHub OAuth routes
authRouter.get("/github", githubLogin);
authRouter.get("/github/callback", githubCallback);

export default authRouter;