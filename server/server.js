import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/mongoDB.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";



const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
