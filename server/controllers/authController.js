import axios from 'axios';
import { setupCodeStreakRepo } from '../utils/githubUtil.js';
import asyncController from '../utils/asyncController.js';
import AppError from '../utils/AppError.js';

/**
 * POST /auth/github/token
 *
 * Receives the GitHub OAuth authorization code from the extension,
 * exchanges it for an access_token with GitHub, and returns it.
 *
 * Request body: { code: string }
 * Response:     { access_token: string, token_type: string, scope: string }
 */
const githubTokenHandler = asyncController(async (req, res, next) => {
  const { code } = req.body;

  // ── Validate input ──────────────────────────────
  if (!code) {
    return next(new AppError('Authorization code is required', 400));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env');
    return next(new AppError('Server misconfiguration: OAuth credentials missing', 500));
  }

  // ── Exchange code for access token ────────────
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const data = tokenResponse.data;

  // ── Check for GitHub errors ───────────────────
  if (data.error) {
    console.error('GitHub OAuth error:', data.error_description || data.error);
    return next(new AppError(data.error_description || data.error, 400));
  }

  // ── Success — return the token ────────────────
  console.log(`✓ GitHub token exchanged successfully (scope: ${data.scope})`);

  // Asynchronously setup the repo and folders without blocking the response
  setupCodeStreakRepo(data.access_token);

  return res.json({
    success: true,
    access_token: data.access_token,
    token_type: data.token_type,
    scope: data.scope,
  });
});

export { githubTokenHandler };