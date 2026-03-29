const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

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
