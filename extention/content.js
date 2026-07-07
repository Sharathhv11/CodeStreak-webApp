// content.js

// listen for captured submission from inject.js (runs in MAIN world)
window.addEventListener("codestreak:submission", (event) => {
  console.log("submission captured →", event.detail);
  chrome.runtime.sendMessage({
    type: "SUBMISSION_CAPTURED",
    data: event.detail
  });
});