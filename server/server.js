import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

// ── App Setup ─────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────
app.use('/auth', authRoutes);

// ── Health Check ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CodeStreak API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Start Server ─────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ CodeStreak server running on http://localhost:${PORT}\n`);
});
