import { useState } from 'react';
import './SettingsView.css';
import {
  GithubIcon,
  ExternalLinkIcon,
  CheckIcon,
  ChromeIcon,
  TrashIcon,
  RefreshCwIcon,
  SettingsIcon,
  LayersIcon,
} from '../icons/index.jsx';

export default function SettingsView({
  user,
  repoName,
  setRepoName,
  repoLoading,
  repoError,
  repoSuccess,
  repoStatus,
  repoStatusLoading,
  repoPrompt,
  onConfirmUseExisting,
  onCancelUseExisting,
  onCreateRepo,
  onUnlinkRepo,
  onRefreshRepoStatus,
}) {
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const isRepoLinked = Boolean(user?.is_repo_ready && user?.github_repo_name);

  const handleStartChangeRepo = () => {
    setIsEditingRepo(true);
    setRepoName('');
  };

  const handleCancelChangeRepo = () => {
    setIsEditingRepo(false);
    onCancelUseExisting();
  };

  const handleConfirmUnlink = async () => {
    await onUnlinkRepo();
    setShowUnlinkModal(false);
    setIsEditingRepo(false);
  };

  return (
    <div className="settings-view">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="settings-header">
        <div className="settings-header-icon">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="settings-title">Repository & Account Settings</h1>
          <p className="settings-subtitle">
            Manage your GitHub sync destination, connected platforms, and account preferences.
          </p>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────── */}
      {repoSuccess && (
        <div className="settings-alert success">
          <CheckIcon size={16} />
          <span>{repoSuccess}</span>
        </div>
      )}

      {repoError && (
        <div className="settings-alert error">
          <span>{repoError}</span>
        </div>
      )}

      {/* ── Section 1: GitHub Repository Management ──────────── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="card-header-left">
            <GithubIcon size={20} />
            <div>
              <h2 className="card-title">GitHub DSA Repository</h2>
              <p className="card-desc">Where your automated problem solutions and AI markdown notes are pushed.</p>
            </div>
          </div>
          {isRepoLinked && onRefreshRepoStatus && (
            <button
              className="settings-icon-btn"
              onClick={onRefreshRepoStatus}
              title="Refresh GitHub status"
              disabled={repoStatusLoading}
            >
              <RefreshCwIcon size={14} className={repoStatusLoading ? 'spin' : ''} />
              <span>Verify Sync</span>
            </button>
          )}
        </div>

        {/* Conflict Dialog if user typed a repo that already exists */}
        {repoPrompt?.isOpen ? (
          <div className="settings-conflict-box">
            <div className="conflict-box-header">
              <h3 className="conflict-title">Repository Already Exists on GitHub</h3>
              <p className="conflict-msg">
                A repository named <code className="settings-code">{repoPrompt.existingRepoName}</code> already exists on your GitHub account (<strong>@{user?.github_username}</strong>).
              </p>
            </div>
            <div className="conflict-actions">
              <button
                className="btn-primary-green"
                onClick={onConfirmUseExisting}
                disabled={repoLoading}
              >
                <CheckIcon size={14} />
                <span>{repoLoading ? 'Linking...' : `Link Existing "${repoPrompt.existingRepoName}"`}</span>
              </button>
              <button
                className="btn-secondary-dark"
                onClick={onCancelUseExisting}
                disabled={repoLoading}
              >
                <span>Choose a Unique Name</span>
              </button>
            </div>
          </div>
        ) : isRepoLinked && !isEditingRepo ? (
          /* ── State A: Repository is Linked ───────────────────── */
          <div className="linked-repo-details">
            <div className="repo-status-pill verified">
              <span className="pill-dot green" />
              <span>Active & Syncing Solutions</span>
            </div>

            <div className="repo-info-row">
              <div className="repo-info-item">
                <span className="info-label">Repository Name</span>
                <a
                  href={user.github_repo_url || `https://github.com/${user.github_username}/${user.github_repo_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="repo-link-external"
                >
                  <span className="repo-full-slug">{user.github_username}/{user.github_repo_name}</span>
                  <ExternalLinkIcon size={13} />
                </a>
              </div>

              {repoStatus?.isReachableOnGithub && (
                <>
                  <div className="repo-info-item">
                    <span className="info-label">Default Branch</span>
                    <span className="info-val monospace">{repoStatus.defaultBranch || 'main'}</span>
                  </div>
                  <div className="repo-info-item">
                    <span className="info-label">Visibility</span>
                    <span className="info-val">{repoStatus.isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions for Linked Repo */}
            <div className="repo-actions-bar">
              <button
                className="btn-secondary-dark"
                onClick={handleStartChangeRepo}
                disabled={repoLoading}
              >
                <span>Switch / Link Different Repo</span>
              </button>

              <button
                className="btn-danger-outline"
                onClick={() => setShowUnlinkModal(true)}
                disabled={repoLoading}
              >
                <TrashIcon size={14} />
                <span>Unlink Repository</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── State B: No Repo Linked or Changing Repo ────────── */
          <div className="setup-repo-section">
            <p className="setup-help-text">
              {isEditingRepo
                ? 'Enter a new or existing repository name on your GitHub to switch sync destination.'
                : 'Connect or create a repository to start tracking your DSA journey on GitHub.'}
            </p>

            <form onSubmit={(e) => onCreateRepo(e)} className="settings-repo-form">
              <div className="settings-input-group">
                <span className="settings-prefix">{user?.github_username || 'github'}/</span>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. codestreak or dsa-solutions"
                  disabled={repoLoading}
                  autoFocus={isEditingRepo}
                />
              </div>

              <div className="form-buttons-row">
                <button type="submit" className="btn-primary-green" disabled={repoLoading}>
                  {repoLoading ? 'Configuring...' : (isEditingRepo ? 'Switch Repository' : 'Link Repository')}
                </button>

                {isEditingRepo && (
                  <button
                    type="button"
                    className="btn-secondary-dark"
                    onClick={handleCancelChangeRepo}
                    disabled={repoLoading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </section>

      {/* ── Section 2: Account & Extension Integration ──────── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="card-header-left">
            <ChromeIcon size={20} />
            <div>
              <h2 className="card-title">Browser Extension & Live Capturing</h2>
              <p className="card-desc">CodeStreak captures accepted submissions on LeetCode and Codeforces silently.</p>
            </div>
          </div>
        </div>

        <div className="extension-status-grid">
          <div className="ext-feature-card">
            <div className="ext-feat-top">
              <span className="platform-name">LeetCode Sync</span>
              <span className="status-badge live">Enabled ✓</span>
            </div>
            <p className="ext-feat-desc">Intercepts accepted submissions, problem tags, runtime & memory stats.</p>
          </div>

          <div className="ext-feature-card">
            <div className="ext-feat-top">
              <span className="platform-name">GeeksforGeeks & Codeforces</span>
              <span className="status-badge live">Enabled ✓</span>
            </div>
            <p className="ext-feat-desc">Captures competitive programming verdict and pushes formatted solutions.</p>
          </div>
        </div>
      </section>

      {/* ── Unlink Confirmation Modal ─────────────────────────── */}
      {showUnlinkModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title">Unlink Repository?</h3>
            <p className="modal-desc">
              Are you sure you want to unlink <code className="settings-code">{user?.github_repo_name}</code>?
              <br /><br />
              Your existing files on GitHub will remain completely untouched, but CodeStreak will pause syncing future submissions until a repository is re-linked.
            </p>
            <div className="modal-actions">
              <button
                className="btn-danger-solid"
                onClick={handleConfirmUnlink}
                disabled={repoLoading}
              >
                {repoLoading ? 'Unlinking...' : 'Yes, Unlink Repository'}
              </button>
              <button
                className="btn-secondary-dark"
                onClick={() => setShowUnlinkModal(false)}
                disabled={repoLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
