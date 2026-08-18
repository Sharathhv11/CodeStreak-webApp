# CodeStreak

CodeStreak is a developer-focused platform that automatically tracks your DSA (Data Structures & Algorithms) practice across platforms like LeetCode and Codeforces, generates AI summaries and complexity analysis, and commits them directly to your own GitHub repository.

This repository contains:
- `client`: The React/Vite dashboard frontend.
- `server`: The Node/Express API backend.
- `extention`: The Chrome extension code.

---

## Developer Setup: Chrome Extension

To work on the Chrome extension locally, you need to load it as an "unpacked" extension in Chrome Developer Mode. Follow these steps:

### 1. Enable Developer Mode in Chrome
1. Open the Google Chrome browser.
2. In the URL bar, navigate to: `chrome://extensions/`
3. In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### 2. Load the Unpacked Extension
1. Once Developer Mode is enabled, click the **Load unpacked** button in the top-left corner of the page.
2. In the file explorer popup, navigate to the project directory and select the **`extention`** directory:
   `D:\projects\codeStreak\extention`
3. Click **Select Folder** (or **Open**).
4. The **CodeStreak** extension will now appear in your list of active extensions with its icon.

### 3. Reloading the Extension After Changes
When you modify local files in the `extention` directory (such as `manifest.json`, JavaScript files, or popups):
1. Navigate back to `chrome://extensions/`.
2. Find the **CodeStreak** extension card.
3. Click the circular **Reload** (refresh) icon in the bottom-right corner of the card.
4. Any active tabs using the extension's content scripts will need to be refreshed (F5) to apply the updated scripts.

---

## Deploying and Packaging the Extension

To deploy the extension to the local VPS/Vite server:
1. Run the PowerShell deployment script from the root folder:
   ```powershell
   powershell -File .\deploy-extension.ps1
   ```
2. The script will automatically:
   - Check if an existing package is served at `client/public/extension.zip`.
   - Back up the existing package to `client/public/extension.zip.bak` if found.
   - Compress the latest files from the `extention` directory into `client/public/extension.zip`.
