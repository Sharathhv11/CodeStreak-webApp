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

    if (message.action === "createRepo") {
        chrome.storage.local.get(["authToken", "githubUser"], async ({ authToken, githubUser }) => {
            if (!githubUser) {
                sendResponse({ success: false, error: "User is not connected." });
                return;
            }

            try {
                const backendCall = await fetch("http://localhost:5000/repo/create-repo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken || ''}`,
                        "github_repo_name": `${message.repoName}`,
                        "github_user_id": `${githubUser.github_id || githubUser.id || ''}`,
                        "github_user_name": `${githubUser.name || ''}`,
                        "github_user_login": `${githubUser.github_username || githubUser.login || ''}`,
                        "github_user_avatar": `${githubUser.avatar_url || ''}`,
                    },
                    body: JSON.stringify({
                        repoName: message.repoName
                    })
                });

                const response = await backendCall.json();
                console.log("Response from server:", response);

                if (backendCall.ok && response.success) {
                    // Update local storage so popup knows repo is ready
                    githubUser.github_repo_name = message.repoName;
                    githubUser.is_repo_ready = true;
                    githubUser.github_repo_url = response.user?.github_repo_url || `https://github.com/${githubUser.github_username}/${message.repoName}`;
                    if (response.user) {
                        githubUser.installation_id = response.user.installation_id;
                        githubUser.tier = response.user.tier || "free";
                    }

                    chrome.storage.local.set({ githubUser }, () => {
                        sendResponse({ success: true, message: response.message });
                    });
                } else {
                    // Reset fields on failure as requested
                    githubUser.installation_id = null;
                    githubUser.github_repo_name = null;
                    githubUser.github_repo_url = null;
                    githubUser.is_repo_ready = false;
                    githubUser.tier = "free";

                    chrome.storage.local.set({ githubUser }, () => {
                        let errorMsg = response.message || "Repository creation failed.";
                        if (response.errors && response.errors.length > 0) {
                            errorMsg += " " + response.errors.map(e => e.message).join(", ");
                        }
                        sendResponse({ success: false, error: errorMsg });
                    });
                }

            } catch (err) {
                console.error("Error creating repo on backend:", err);
                
                // Also reset fields on network/unexpected error
                githubUser.installation_id = null;
                githubUser.github_repo_name = null;
                githubUser.github_repo_url = null;
                githubUser.is_repo_ready = false;
                githubUser.tier = "free";

                chrome.storage.local.set({ githubUser }, () => {
                    sendResponse({ success: false, error: err.message });
                });
            }
        });
        return true; // Keep message channel open for async sendResponse
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