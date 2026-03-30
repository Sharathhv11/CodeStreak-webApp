import express from 'express';
import { githubTokenHandler } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /auth/github/token
 */
router.post('/github/token', githubTokenHandler);

export default router;