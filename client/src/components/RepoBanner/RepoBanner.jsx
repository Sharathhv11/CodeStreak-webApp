import './RepoBanner.css';
import { GithubIcon, CheckIcon } from '../icons/index.jsx';

// ── Repository Setup Banner Component ───────────────────────────

export default function RepoBanner({
  user,
  repoName,
  setRepoName,
  repoLoading,
  repoError,
  repoPrompt,
  onConfirmUseExisting,
  onCancelUseExisting,
  onCreateRepo,
}) {
  return (
    <section className="repo-banner">
      {/* ── Existing Repo Conflict & Confirmation Modal/Card ──── */}
      {repoPrompt?.isOpen ? (
        <div className="repo-conflict-dialog">
          <div className="repo-conflict-header">
            <div className="repo-conflict-icon">
              <GithubIcon size={20} />
            </div>
            <div className="repo-conflict-titles">
              <h3 className="repo-conflict-title">Repository Already Exists</h3>
              <p className="repo-conflict-msg">
                A repository named <code className="inline-repo-code">{repoPrompt.existingRepoName}</code> was found on your GitHub account (<strong>@{user?.github_username}</strong>).
              </p>
            </div>
          </div>

          <div className="repo-conflict-actions">
            <button
              className="repo-use-existing-btn"
              onClick={onConfirmUseExisting}
              disabled={repoLoading}
            >
              <CheckIcon size={15} />
              <span>{repoLoading ? 'Linking repository...' : `Use Existing "${repoPrompt.existingRepoName}"`}</span>
            </button>

            <button
              className="repo-choose-different-btn"
              onClick={onCancelUseExisting}
              disabled={repoLoading}
            >
              <span>Choose a Unique Name</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Standard Initial Repo Setup Form ─────────────────── */
        <div className="repo-banner-content">
          <div className="repo-banner-text">
            <h3>Set Up Your Repository</h3>
            <p>Create a GitHub repository or connect an existing one to sync your solved DSA problems.</p>
          </div>

          <form onSubmit={onCreateRepo} className="repo-banner-form">
            <div className="repo-input-wrap">
              <span className="repo-prefix">{user?.github_username || 'github'}/</span>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="codestreak"
                disabled={repoLoading}
              />
            </div>
            <button type="submit" className="repo-create-btn" disabled={repoLoading}>
              {repoLoading ? 'Configuring...' : 'Set Up Repo'}
            </button>
          </form>
        </div>
      )}

      {/* Error / Rate Limit Message */}
      {repoError && (
        <div className="repo-error-banner">
          <span>{repoError}</span>
        </div>
      )}
    </section>
  );
}
