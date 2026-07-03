import dotenv from 'dotenv';
import connectDB from './config/mongoDB.js';
import app from './app.js';

// Load environment variables
dotenv.config();





const PORT = process.env.PORT || 5000;

// Connect to the database and start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
