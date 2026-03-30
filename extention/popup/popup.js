/**
 * Popup script — handles UI state and user interactions.
 * Reads connection state from chrome.storage (set by background.js).
 */

// ── DOM Elements ──────────────────────────────────
const connectBtn = document.getElementById('connectBtn');
const connectBtnText = document.getElementById('connectBtnText');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusCard = document.getElementById('statusCard');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userLogin = document.getElementById('userLogin');
const userRepos = document.getElementById('userRepos');
const userFollowers = document.getElementById('userFollowers');
const viewProfile = document.getElementById('viewProfile');

// ── Initialize ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConnectionState();
});

// ── Load saved connection state ───────────────────
function loadConnectionState() {
  chrome.storage.local.get(['isConnected', 'githubUser', 'pendingAuthTabId', 'authError'], (result) => {
    if (result.isConnected && result.githubUser) {
      showConnectedState(result.githubUser);
    } else if (result.pendingAuthTabId) {
      // OAuth is in progress — show loading state
      showLoadingState();
      startPolling();
    } else {
      showDisconnectedState();
      if (result.authError) {
        statusText.textContent = result.authError;
        statusText.style.color = '#f85149';
        setTimeout(() => {
          statusText.textContent = 'Not Connected';
          statusText.style.color = '';
        }, 3000);
      }
    }
  });
}

// ── Poll storage until OAuth completes ────────────
function startPolling() {
  const poll = setInterval(() => {
    chrome.storage.local.get(['isConnected', 'githubUser', 'pendingAuthTabId'], (result) => {
      if (result.isConnected && result.githubUser) {
        clearInterval(poll);
        showConnectedState(result.githubUser);
      } else if (!result.pendingAuthTabId) {
        // Auth finished but failed
        clearInterval(poll);
        showDisconnectedState();
      }
    });
  }, 1000);
}

// ── UI State: Connected ───────────────────────────
function showConnectedState(user) {
  // Status card
  statusCard.classList.add('connected');
  statusDot.classList.add('active');
  statusText.classList.add('active');
  statusText.textContent = 'Connected';
  statusText.style.color = '';

  // Buttons
  connectBtn.classList.add('hidden');
  disconnectBtn.classList.remove('hidden');

  // User info
  if (user) {
    userAvatar.src = user.avatar_url || '';
    userName.textContent = user.name || user.login || 'GitHub User';
    userLogin.textContent = `@${user.login || 'user'}`;
    userRepos.textContent = user.public_repos !== undefined ? user.public_repos : '-';
    userFollowers.textContent = user.followers !== undefined ? user.followers : '-';

    if (user.html_url) {
      viewProfile.href = user.html_url;
      viewProfile.classList.remove('hidden');
    } else {
      viewProfile.classList.add('hidden');
    }

    userInfo.classList.remove('hidden');
  }
}

// ── UI State: Disconnected ────────────────────────
function showDisconnectedState() {
  statusCard.classList.remove('connected');
  statusDot.classList.remove('active');
  statusText.classList.remove('active');
  statusText.textContent = 'Not Connected';
  statusText.style.color = '';

  connectBtn.classList.remove('hidden');
  connectBtn.disabled = false;
  connectBtnText.textContent = 'Continue with GitHub';
  disconnectBtn.classList.add('hidden');
  userInfo.classList.add('hidden');
}

// ── UI State: Loading ─────────────────────────────
function showLoadingState() {
  connectBtn.disabled = true;
  connectBtnText.innerHTML = '<span class="spinner"></span> Connecting...';
}

// ── Connect GitHub Button ─────────────────────────
connectBtn.addEventListener('click', () => {
  showLoadingState();

  // Tell background to start OAuth (opens a tab)
  chrome.runtime.sendMessage({ action: 'startGitHubOAuth' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError.message);
      showDisconnectedState();
      return;
    }
    // Start polling for completion (popup may close/reopen)
    startPolling();
  });
});

// ── Disconnect Button ─────────────────────────────
disconnectBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['isConnected', 'githubUser', 'authError'], () => {
    showDisconnectedState();
  });
});
