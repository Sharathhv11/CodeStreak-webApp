/**
 * Popup script — handles UI state and user interactions.
 * Communicates with background.js via chrome.runtime.sendMessage().
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
    chrome.runtime.sendMessage({ action: 'getStatus' }, (result) => {
        if (chrome.runtime.lastError) {
            console.warn('Could not get status:', chrome.runtime.lastError.message);
            showDisconnectedState();
            return;
        }
        if (result?.isConnected) {
            showConnectedState(result.githubUser);
        } else {
            showDisconnectedState();
        }
    });
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
        userName.textContent = user.name || user.github_username || 'GitHub User';
        userLogin.textContent = `@${user.github_username || 'user'}`;
        userRepos.textContent = user.github_repo_name || '-';
        userFollowers.textContent = user.tier || 'free';

        const profileUrl = `https://github.com/${user.github_username}`;
        viewProfile.href = profileUrl;
        viewProfile.classList.remove('hidden');

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

// ── UI State: Error ───────────────────────────────
function showError(errorMessage) {
    showDisconnectedState();
    statusText.textContent = errorMessage;
    statusText.style.color = '#f85149';
    setTimeout(() => {
        statusText.textContent = 'Not Connected';
        statusText.style.color = '';
    }, 4000);
}

// ── Connect GitHub Button ─────────────────────────
connectBtn.addEventListener('click', () => {
    showLoadingState();
    // just open the website login page — website drives the OAuth flow
    chrome.tabs.create({ url: "http://localhost:5173/login" });
    // reset button state after opening tab
    showDisconnectedState();
});

// ── Disconnect Button ─────────────────────────────
disconnectBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Logout error:', chrome.runtime.lastError.message);
        }
        showDisconnectedState();
    });
});

// ── Listen for token from website bridge page ─────
chrome.runtime.onMessageExternal.addListener((message, sender) => {
    if (sender.origin !== "http://localhost:5173") return;

    if (message.type === "AUTH_TOKEN") {
        console.log("CodeStreak popup: token received →", message.token);
        // save token then reload connection state to update UI
        console.log("CodeStreak popup: user info →", message.user);

        chrome.storage.local.set({ authToken: message.token, githubUser: message.user }, () => {
            loadConnectionState(); // refresh UI to show connected state
        });
    }
});