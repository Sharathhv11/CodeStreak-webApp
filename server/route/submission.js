import { Router } from "express"
import submissionControll from "../controller/submission/submissionController.js"

const submissionRouter = Router()

submissionRouter.post("/", submissionControll);

export default submissionRouter;
