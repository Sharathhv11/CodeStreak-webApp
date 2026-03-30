# CodeStreak Extension Architecture

## Overview
The CodeStreak Chrome Extension serves as the primary entry point for users aiming to track their coding progress automatically. 

## Structure (Manifest V3)
- **Manifest (`manifest.json`)**: Configuration declaring permissions (tabs, storage, activeTab), background scripts, and popup UI.
- **Popup (`extention/popup/`)**: The user interface visible when clicking the extension icon. Contains HTML, CSS, and JS (`popup.js`) to display statistics, login status, and manual sync triggers.
- **Background Scripts / Service Workers**: Handles background tasks, alarms, or tracking ongoing platform sessions.
- **Content Scripts**: Scripts that are manually or automatically injected into competitive programming platforms (LeetCode, GFG, etc.) to extract accepted problem solutions and trigger GitHub pushes.

## Authentication Flow
1. User clicks \"Login with GitHub\" in the popup.
2. The extension initiates the OAuth Web Flow (via `chrome.identity.launchWebAuthFlow`).
3. Upon receiving the OAuth code, it sends it to the backend.
4. The Access Token is securely stored in `chrome.storage.local`.

## Modules & File Responsibilities
- `popup.html` & `popup.js`: Rendering the UI and handling basic clicks.
- Content parsing: Locating algorithm code and problem text from the DOM.
