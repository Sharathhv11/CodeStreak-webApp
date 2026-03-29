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

      // ── Auto-create codestreak repo & push README ──
      if (data.access_token && user?.login) {
        await setupCodeStreakRepo(data.access_token, user.login);
      }
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

// ── Create codestreak repo & push README ──────────
async function setupCodeStreakRepo(accessToken, username) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const REPO_NAME = 'codestreak';

  try {
    // 1. Create the repo
    console.log('Creating codestreak repo...');
    const createResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: REPO_NAME,
        description: '🔥 Track your daily coding streaks across platforms — powered by CodeStreak',
        private: false,
        auto_init: false,
      }),
    });

    if (createResponse.status === 422) {
      // Repo already exists — that's fine
      console.log('Repo "codestreak" already exists, skipping creation.');
    } else if (!createResponse.ok) {
      const err = await createResponse.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create repo: ${createResponse.status}`);
    } else {
      console.log('Repo "codestreak" created successfully!');
    }

    // 2. Push README.md
    const readmeContent = generateReadme(username);
    const encodedContent = btoa(unescape(encodeURIComponent(readmeContent)));

    console.log('Pushing README.md...');
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${username}/${REPO_NAME}/contents/README.md`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: '🚀 Initial commit: Add README.md',
          content: encodedContent,
        }),
      }
    );

    if (readmeResponse.status === 422) {
      console.log('README.md already exists, skipping.');
    } else if (!readmeResponse.ok) {
      const err = await readmeResponse.json().catch(() => ({}));
      throw new Error(err.message || `Failed to push README: ${readmeResponse.status}`);
    } else {
      console.log('README.md pushed successfully!');
    }

    // Save repo info
    await chrome.storage.local.set({
      repoCreated: true,
      repoUrl: `https://github.com/${username}/${REPO_NAME}`,
    });

  } catch (err) {
    console.error('Repo setup failed:', err.message);
    // Non-fatal — don't break the connection flow
  }
}

// ── Generate README content ───────────────────────
function generateReadme(username) {
  return `# 🔥 CodeStreak

**Track your daily coding streaks across platforms.**

> _Consistency beats intensity. Code every day, build your streak._

---

## 📌 About

**CodeStreak** is a Chrome Extension that monitors your coding activity across platforms and helps you maintain an unbroken daily coding streak — just like GitHub's contribution graph, but smarter.

## ✨ Features

- 🔗 **GitHub Integration** — Connect your GitHub account via OAuth
- 📊 **Activity Tracking** — Monitor your daily coding contributions
- 🏆 **Streak Counter** — Track your longest coding streak
- 🔔 **Reminders** — Never break your streak

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Extension (Manifest V3) |
| Frontend | Vanilla JavaScript, HTML, CSS |
| Backend | Node.js, Express |
| Auth | GitHub OAuth 2.0 |

## 🚀 Getting Started

1. Install the **CodeStreak** Chrome Extension
2. Click **"Connect GitHub"** to link your account
3. Start coding daily and watch your streak grow!

## 👤 Connected As

- **@${username}**

---

Built with 💚 by [${username}](https://github.com/${username})
`;
}
