import { getLangColor } from '../../utils/languageColors';
import { formatTimeAgo, getPracticeUrl, getGithubReadmeUrl } from '../../utils/helpers';
import {
  ClockIcon,
  DatabaseIcon,
  ChevronIcon,
  BrainIcon,
  GithubIcon,
  ExternalLinkIcon,
  TagIcon,
  BookOpenIcon,
  PlayIcon,
} from '../icons/index.jsx';
import IdeCodeViewer from '../CodeViewer/IdeCodeViewer';

// ── Submission Card Component ───────────────────────────────────

export default function SubmissionCard({ sub, isExpanded, onToggle, user }) {
  const platformName = sub.platform || 'LeetCode';
  const isLeetCode = platformName.toLowerCase().includes('leetcode');
  const isCF = platformName.toLowerCase().includes('codeforces');

  // Derive concept and GitHub path: /leetcode/{concept}/{problem}
  const conceptName = sub.concept || (sub.tags && (sub.tags[0]?.name || sub.tags[0])) || 'General';
  const conceptSlug = conceptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const platformSlug = platformName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const problemSlug = (sub.slug || sub.title).toLowerCase().replace(/[^a-z0-9-_.]+/g, '-');

  const githubPath = `${platformSlug}/${conceptSlug}/${problemSlug}`;
  const githubRepoUrl = user?.is_repo_ready && user?.github_username && user?.github_repo_name
    ? `https://github.com/${user.github_username}/${user.github_repo_name}/tree/main/${githubPath}`
    : null;

  const practiceUrl = getPracticeUrl(sub);
  const githubReadmeUrl = getGithubReadmeUrl(sub, user) || (githubRepoUrl ? `${githubRepoUrl}/README.md` : null);

  return (
    <div className={`sub-card ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="sub-card-main">
        {/* Left: Indicator & Title Info */}
        <div className="sub-left">
          <span
            className="sub-lang-dot"
            style={{ background: getLangColor(sub.language) }}
            title={`Language: ${sub.language}`}
          />
          <div className="sub-info">
            <div className="sub-title-row">
              <span className="sub-title">{sub.title}</span>
              <span className={`sub-platform-pill ${isLeetCode ? 'leetcode' : isCF ? 'codeforces' : 'gfg'}`}>
                {platformName}
              </span>
            </div>

            <div className="sub-meta-row">
              {/* Concept Tag */}
              <span className="sub-concept-chip">
                <TagIcon size={10} />
                <span>{conceptName}</span>
              </span>

              {/* Language */}
              <span className="sub-lang-badge">{sub.language}</span>

              {/* Runtime & Memory */}
              {sub.runtime && (
                <span className="sub-meta">
                  <ClockIcon size={11} /> {sub.runtime}
                </span>
              )}
              {sub.memory && (
                <span className="sub-meta">
                  <DatabaseIcon size={11} /> {sub.memory}
                </span>
              )}

              {/* Timestamp */}
              <span className="sub-meta sub-time">{formatTimeAgo(sub.timestamp || sub.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Complexity & Toggle */}
        <div className="sub-right">
          {sub.timeComplexity && (
            <span className="complexity-chip time-chip">{sub.timeComplexity}</span>
          )}
          {sub.spaceComplexity && (
            <span className="complexity-chip space-chip">{sub.spaceComplexity}</span>
          )}
          <ChevronIcon expanded={isExpanded} size={16} />
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="sub-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="sub-detail-grid">
            {/* Left: AI Analysis & Concept */}
            <div className="sub-analysis">
              <div className="analysis-header">
                <BrainIcon size={16} />
                <h4>AI Complexity Breakdown & Notes</h4>
              </div>

              <p className="analysis-text">
                {sub.explanation || 'Solution recorded and synced to your GitHub repository.'}
              </p>

              <div className="complexity-detail-row">
                <div className="complexity-block">
                  <span className="complexity-label">Time Complexity</span>
                  <span className="complexity-value time-value">{sub.timeComplexity || 'O(N)'}</span>
                </div>
                <div className="complexity-block">
                  <span className="complexity-label">Space Complexity</span>
                  <span className="complexity-value space-value">{sub.spaceComplexity || 'O(1)'}</span>
                </div>
              </div>

              {sub.tags?.length > 0 && (
                <div className="sub-tags-wrap">
                  <span className="tags-label">Tags:</span>
                  <div className="sub-tags">
                    {sub.tags.map((tag, i) => (
                      <span key={i} className="sub-tag">
                        {typeof tag === 'string' ? tag : tag.name || tag.slug}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Practice on Platform + GitHub Notes + GitHub Folder */}
              <div className="sub-actions-container">
                <div className="sub-primary-actions">
                  {/* 1. Practice on Platform */}
                  <a
                    href={practiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sub-btn-action sub-btn-practice"
                    title={`Open ${sub.title} on ${platformName} to practice`}
                  >
                    <PlayIcon size={12} />
                    <span>Practice Problem</span>
                    <ExternalLinkIcon size={11} />
                  </a>

                  {/* 2. GitHub Notes (README.md) */}
                  {githubReadmeUrl ? (
                    <a
                      href={githubReadmeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="sub-btn-action sub-btn-notes"
                      title="Open AI complexity notes & analysis README on GitHub"
                    >
                      <BookOpenIcon size={13} />
                      <span>GitHub Notes</span>
                      <ExternalLinkIcon size={11} />
                    </a>
                  ) : (
                    <span className="sub-btn-action sub-btn-notes disabled" title="Link your GitHub repository in Settings to view notes">
                      <BookOpenIcon size={13} />
                      <span>GitHub Notes</span>
                    </span>
                  )}
                </div>

                {/* 3. GitHub Folder Directory Link */}
                {githubRepoUrl ? (
                  <a
                    href={githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sub-github-path-link"
                    title="Open solution directory on GitHub"
                  >
                    <GithubIcon size={13} />
                    <span className="path-text">View in /{githubPath} on GitHub</span>
                    <ExternalLinkIcon size={11} />
                  </a>
                ) : (
                  <span className="gh-unlinked-note">
                    Link your repository in Settings to view solution files on GitHub.
                  </span>
                )}
              </div>
            </div>

            {/* Right: IDE Syntax-Highlighted Code Viewer */}
            <div className="sub-code-col">
              <IdeCodeViewer
                code={sub.code || '// No code stored for this submission.'}
                language={sub.language || 'python3'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
