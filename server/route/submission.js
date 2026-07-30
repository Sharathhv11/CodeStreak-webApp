import { Router } from "express";
import {
  submissionControll,
  getSubmissions,
  getHeatmapData,
} from "../controller/submission/submissionController.js";

const submissionRouter = Router();

submissionRouter.post("/", submissionControll);
submissionRouter.get("/", getSubmissions);
submissionRouter.get("/heatmap", getHeatmapData);

export default submissionRouter;
