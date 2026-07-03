import express from "express"
import authRouter from "./route/auth/authRoute.js";

const app = express();

// Middleware
app.use(express.json());

//^ Auth controller 
app.use("/auth",authRouter)


export default app;