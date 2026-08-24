// content.js

// listen for captured submission from inject.js (runs in MAIN world)
window.addEventListener("codestreak:submission", (event) => {
  console.log("submission captured →", event.detail);
  try {
    chrome.runtime.sendMessage({
      type: "SUBMISSION_CAPTURED",
      data: event.detail
    });
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      console.warn("CodeStreak: Extension was updated/reloaded. Please refresh the page.");
    } else {
      console.error("CodeStreak: Error sending message:", error);
    }
  }
});