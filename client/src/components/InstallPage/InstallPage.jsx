import { useState } from 'react';
import './InstallPage.css';
import logoImg from '../../assets/codestreak.png';
import { ChromeIcon, CheckIcon, GithubIcon } from '../icons/index.jsx';

export default function InstallPage({ onBack, onLogin, onGoToDashboard, user }) {
  const [copied, setCopied] = useState(false);

  const copyExtensionsUrl = () => {
    navigator.clipboard.writeText('chrome://extensions/');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="install-wrapper">
      {/* Background Elements */}
      <div className="install-ambient-glow" />
      <div className="install-grid-bg" />

      {/* Navigation Header */}
      <header className="install-navbar">
        <div className="nav-container">
          <div className="landing-logo-wrap" onClick={onBack}>
            <img src={logoImg} alt="CodeStreak" className="landing-nav-logo" />
          </div>

          <div className="landing-nav-actions">
            {user ? (
              <button className="nav-dashboard-btn" onClick={onGoToDashboard}>
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <button className="nav-signin-btn" onClick={onLogin}>
                <span>Sign In</span>
              </button>
            )}
            <button className="nav-back-btn" onClick={onBack}>
              <span>← Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="install-main">
        <div className="install-container">
          
          {/* Hero Section */}
          <div className="install-hero">
            <span className="install-tag">Setup Guide</span>
            <h1 className="install-title">Install CodeStreak Chrome Extension</h1>
            <p className="install-subtitle">
              Since our extension is in early access, you can install it manually in less than a minute. Follow these steps to load it into Chrome.
            </p>
            
            <div className="install-cta-box">
              <a href="/extension.zip" download="codestreak-extension.zip" className="download-btn-primary">
                <ChromeIcon size={20} />
                <span>Download Extension ZIP</span>
              </a>
              <span className="download-meta">Version 1.0.0 • 110 KB • extension.zip</span>
            </div>
          </div>

          {/* Steps Section */}
          <div className="install-steps">
            <h2 className="steps-heading">Installation Steps</h2>
            
            <div className="steps-list">
              {/* Step 1 */}
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Download & Unzip</h3>
                  <p>
                    Click the <strong>Download Extension ZIP</strong> button above to download the archive file. 
                    Locate the downloaded <code>extension.zip</code> file on your computer and extract/unzip it into a folder (e.g. <code>codestreak-extension</code>).
                  </p>
                  <div className="step-tip">
                    <strong>Tip:</strong> Ensure you see files like <code>manifest.json</code> and <code>background.js</code> directly inside the extracted folder.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Open Chrome Extensions</h3>
                  <p>
                    Open a new tab in Google Chrome and navigate to the Extensions page. You can copy the URL below and paste it into your browser's address bar:
                  </p>
                  <div className="copy-url-box">
                    <code>chrome://extensions/</code>
                    <button className="copy-btn" onClick={copyExtensionsUrl}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="subtext">
                    Alternatively, click the puzzle piece icon (Extensions) in the top-right corner of Chrome and select <strong>Manage Extensions</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Enable Developer Mode</h3>
                  <p>
                    In the top-right corner of the Chrome Extensions page, look for the toggle switch labeled <strong>"Developer mode"</strong>.
                  </p>
                  <div className="mode-toggle-visual">
                    <span>Developer mode</span>
                    <div className="toggle-switch active">
                      <div className="toggle-handle" />
                    </div>
                  </div>
                  <p className="subtext">
                    Toggle this switch to the <strong>ON</strong> position. This enables installing unpacked extensions.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Load Unpacked Extension</h3>
                  <p>
                    In the top-left corner of the Extensions page, click the <strong>"Load unpacked"</strong> button.
                  </p>
                  <div className="load-unpacked-btn-mock">
                    Load unpacked
                  </div>
                  <p className="subtext">
                    In the file chooser dialog, navigate to and select the <strong>extracted folder</strong> containing the extension files (the folder containing <code>manifest.json</code>).
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Pin & Log In</h3>
                  <p>
                    The CodeStreak extension is now installed! To make it easily accessible:
                  </p>
                  <ul className="step-bullets">
                    <li>Click the puzzle piece icon (Extensions) in your Chrome toolbar.</li>
                    <li>Click the pin icon next to <strong>CodeStreak</strong>.</li>
                    <li>Click the CodeStreak extension icon, log in using GitHub, and start syncing your DSA progress!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Callout */}
          <div className="install-footer-callout">
            <h3>Need Help?</h3>
            <p>
              If you run into any issues during setup, feel free to check the project repository or reach out.
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="github-link">
              <GithubIcon size={16} />
              <span>Visit CodeStreak GitHub</span>
            </a>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="install-footer">
        <p>© {new Date().getFullYear()} CodeStreak. All rights reserved.</p>
      </footer>
    </div>
  );
}
