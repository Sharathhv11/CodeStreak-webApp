/**
 * Background service worker — handles the GitHub OAuth flow.
 * Uses chrome.identity.launchWebAuthFlow() for a secure, popup-based OAuth.
 *
 * Fixed Extension ID: mjjdfhcbnneakjanjiokffcgmgjeohcj
 * Redirect URI:       https://mjjdfhcbnneakjanjiokffcgmgjeohcj.chromiumapp.org/
 */

// ── Configuration ─────────────────────────────────
const GITHUB_CLIENT_ID = 'Ov23liQ0pxISITEzJA6b';
const API_BASE_URL     = 'http://localhost:5000';
const REDIRECT_URI     = chrome.identity.getRedirectURL();   // deterministic with "key" in manifest
const SCOPES           = 'repo user';

console.log('[CodeStreak] Service worker loaded');
console.log('[CodeStreak] Redirect URI:', REDIRECT_URI);

// ── Message Listener (from popup) ─────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'startGitHubOAuth') {
    handleGitHubLogin()
      .then((result) => sendResponse({ success: true, user: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep the message channel open for async response
  }

  if (message.action === 'logout') {
    handleLogout()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get(['isConnected', 'githubUser'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

// ── GitHub Login Flow ─────────────────────────────
async function handleGitHubLogin() {
  // 1. Build the GitHub authorization URL
  const authUrl = buildGitHubAuthUrl();

  // 2. Launch the web auth flow (opens a Chrome-managed popup)
  const callbackUrl = await launchAuthFlow(authUrl);

  // 3. Extract the authorization code from the redirect URL
  const code = extractAuthCode(callbackUrl);

  // 4. Exchange the code for an access token via our backend
  const tokenData = await exchangeCodeForToken(code);

  // 5. Fetch the GitHub user profile
  const user = await fetchGitHubUser(tokenData.access_token);

  // 6. Persist connection state
  await chrome.storage.local.set({
    isConnected: true,
    githubUser: user,
    accessToken: tokenData.access_token,
    authError: null,
  });

  console.log('[CodeStreak] GitHub connected:', user.login);
  return user;
}

// ── Build GitHub OAuth URL ────────────────────────
function buildGitHubAuthUrl() {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPES);
  // Add a random state parameter to prevent CSRF
  const state = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  url.searchParams.set('state', state);
  return { url: url.toString(), state };
}

// ── Launch Chrome Identity Auth Flow ──────────────
function launchAuthFlow({ url }) {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url,
        interactive: true,  // show the GitHub login page
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!redirectUrl) {
          reject(new Error('No redirect URL received. User may have closed the popup.'));
          return;
        }
        resolve(redirectUrl);
      }
    );
  });
}

// ── Extract Authorization Code ────────────────────
function extractAuthCode(callbackUrl) {
  const url = new URL(callbackUrl);
  const error = url.searchParams.get('error');
  if (error) {
    const description = url.searchParams.get('error_description') || error;
    throw new Error(`GitHub denied access: ${description}`);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    throw new Error('No authorization code found in the callback URL.');
  }
  return code;
}

// ── Exchange Code for Token (via Backend) ─────────
async function exchangeCodeForToken(code) {
  const response = await fetch(`${API_BASE_URL}/auth/github/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Token exchange failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Backend did not return an access token.');
  }
  return data;
}

// ── Fetch GitHub User Profile ─────────────────────
async function fetchGitHubUser(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub profile (HTTP ${response.status})`);
  }

  const fullUser = await response.json();
  return {
    login: fullUser.login,
    name: fullUser.name,
    avatar_url: fullUser.avatar_url,
    public_repos: fullUser.public_repos,
    followers: fullUser.followers,
    html_url: fullUser.html_url,
  };
}

// ── Logout ────────────────────────────────────────
async function handleLogout() {
  await chrome.storage.local.remove([
    'isConnected',
    'githubUser',
    'accessToken',
    'authError',
  ]);
  console.log('[CodeStreak] Logged out');
}