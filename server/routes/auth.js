const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * POST /auth/github/token
 *
 * Receives the GitHub OAuth authorization code from the extension,
 * exchanges it for an access_token with GitHub, and returns it.
 *
 * Request body: { code: string }
 * Response:     { access_token: string, token_type: string, scope: string }
 */
router.post('/github/token', async (req, res) => {
  const { code } = req.body;

  // ── Validate input ──────────────────────────────
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required',
    });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env');
    return res.status(500).json({
      success: false,
      message: 'Server misconfiguration: OAuth credentials missing',
    });
  }

  try {
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
      return res.status(400).json({
        success: false,
        message: data.error_description || data.error,
      });
    }

    // ── Success — return the token ────────────────
    console.log(`✓ GitHub token exchanged successfully (scope: ${data.scope})`);

    return res.json({
      success: true,
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (error) {
    console.error('Token exchange failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to exchange authorization code for token',
    });
  }
});

module.exports = router;
