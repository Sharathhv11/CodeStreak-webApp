/**
 * Background service worker — handles the GitHub OAuth flow.
 * Uses persistent top-level listeners to survive service worker restarts.
 */

// ── Configuration ─────────────────────────────────
const GITHUB_CLIENT_ID = 'Ov23liQ0pxISITEzJA6b';
const API_BASE_URL = 'http://localhost:5000';
const REDIRECT_URI = chrome.identity.getRedirectURL();

console.log('CodeStreak loaded | Redirect URI:', REDIRECT_URI);

// ── Persistent tab listener (survives SW restarts) ─
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  // Check if this tab is our pending auth tab
  chrome.storage.local.get(['pendingAuthTabId'], async (result) => {
    if (!result.pendingAuthTabId || tabId !== result.pendingAuthTabId) return;

    // Check if this is the redirect back from GitHub
    if (!changeInfo.url.startsWith(REDIRECT_URI)) return;

    console.log('GitHub redirect detected!');

    // Clear the pending state immediately
    await chrome.storage.local.remove('pendingAuthTabId');

    // Close the auth tab
    chrome.tabs.remove(tabId).catch(() => {});

    // Extract the authorization code
    const callbackUrl = new URL(changeInfo.url);
    const code = callbackUrl.searchParams.get('code');
    const error = callbackUrl.searchParams.get('error');

    if (error) {
      console.error('GitHub denied access:', error);
      await chrome.storage.local.set({ isConnected: false, githubUser: null, authError: error });
      return;
    }

    if (!code) {
      console.error('No authorization code in callback');
      await chrome.storage.local.set({ isConnected: false, githubUser: null, authError: 'No code received' });
      return;
    }

    try {
      // Exchange code for token via backend
      console.log('Sending code to backend...');
      const tokenResponse = await fetch(`${API_BASE_URL}/auth/github/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!tokenResponse.ok) {
        const errData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${tokenResponse.status}`);
      }

      const data = await tokenResponse.json();
      console.log('Token received from backend');

      // Fetch GitHub user profile
      let user = null;
      if (data.access_token) {
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (userResponse.ok) {
          const fullUser = await userResponse.json();
          user = {
            login: fullUser.login,
            name: fullUser.name,
            avatar_url: fullUser.avatar_url,
            public_repos: fullUser.public_repos,
            followers: fullUser.followers,
            html_url: fullUser.html_url,
          };
        }
      }

      // Save connection state
      await chrome.storage.local.set({
        isConnected: true,
        githubUser: user,
        authError: null,
      });

      console.log('GitHub connected successfully!', user?.login);
    } catch (err) {
      console.error('Token exchange failed:', err.message);
      await chrome.storage.local.set({
        isConnected: false,
        githubUser: null,
        authError: err.message,
      });
    }
  });
});

// Handle auth tab closed manually by user
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(['pendingAuthTabId'], (result) => {
    if (result.pendingAuthTabId && tabId === result.pendingAuthTabId) {
      chrome.storage.local.remove('pendingAuthTabId');
      console.log('Auth tab closed by user');
    }
  });
});

// ── Message Listener (from popup) ─────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startGitHubOAuth') {
    startOAuth().then(() => sendResponse({ started: true }));
    return true;
  }
});

async function startOAuth() {
  // Build the GitHub authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'repo');

  // Open GitHub auth page in a new tab
  const authTab = await chrome.tabs.create({ url: authUrl.toString() });

  // Store the tab ID so the onUpdated listener can find it
  await chrome.storage.local.set({ pendingAuthTabId: authTab.id });

  console.log('Auth tab opened:', authTab.id);
}