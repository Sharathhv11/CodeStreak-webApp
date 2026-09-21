import { Router } from "express";
import { askQuestion, getStatus } from "../controller/rag/ragController.js";

const ragRouter = Router();

ragRouter.post("/ask", askQuestion);
ragRouter.get("/status", getStatus);

export default ragRouter;
