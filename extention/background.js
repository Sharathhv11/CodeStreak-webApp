// background.js
// Chrome MV3 service workers use the native chrome.* API (no polyfill needed)

// ─── 1. RECEIVE JWT FROM WEBSITE ──────────────────────────────────────────────
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (sender.origin !== "http://localhost:5173") return;

    if (message.type === "AUTH_TOKEN") {
        // Store both the token AND the user object
        chrome.storage.local.set({ authToken: message.token, githubUser: message.user }, () => {
            console.log("CodeStreak: auth token saved →", message.token);
            console.log("CodeStreak: user info saved →", message.user);
            sendResponse({ ok: true });
        });
        return true; // keeps port open for async sendResponse
    }

    if (message.type === "LOGOUT") {
        chrome.storage.local.remove(["authToken", "githubUser"], () => {
            sendResponse({ ok: true });
        });
        return true;
    }
});


// ─── 2. HANDLE INTERNAL MESSAGES (content script, popup) ──────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SUBMISSION_CAPTURED") {
        handleSubmission(message.data);
        sendResponse({ ok: true });
    }

    if (message.action === "getStatus") {
        // Read both token and user from storage
        chrome.storage.local.get(["authToken", "githubUser"], ({ authToken, githubUser }) => {
            sendResponse({
                isConnected: !!authToken,
                githubUser: githubUser || null
            });
        });
        return true; // keep port open for async response
    }

    if (message.action === "logout") {
        chrome.storage.local.remove(["authToken", "githubUser"], () => {
            sendResponse({ ok: true });
        });
        return true;
    }
});


// ─── 3. FORWARD SUBMISSION TO BACKEND ─────────────────────────────────────────
async function handleSubmission(submissionData) {
    const { authToken } = await chrome.storage.local.get("authToken");

    if (!authToken) {
        chrome.tabs.create({ url: "http://localhost:5173/login" });
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(submissionData),
        });

        if (res.status === 401) {
            await chrome.storage.local.remove("authToken");
            chrome.tabs.create({ url: "http://localhost:5173/login" });
            return;
        }

        const data = await res.json();
        console.log("CodeStreak: submission saved", data);

    } catch (err) {
        console.error("CodeStreak: failed to send submission", err);
    }
}