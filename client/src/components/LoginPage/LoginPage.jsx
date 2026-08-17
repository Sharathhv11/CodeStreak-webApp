import './LoginPage.css';
import { GithubIcon, ShieldCheckIcon } from '../icons/index.jsx';
import logoImg from '../../assets/codestreak.png';

// ── Login Page Component ────────────────────────────────────────

export default function LoginPage({ onLogin, onBack }) {
  return (
    <div className="login-page">
      <div className="login-bg-ambient" />
      <div className="login-bg-grid" />

      {onBack && (
        <button className="login-back-btn" onClick={onBack}>
          <span>← Back to CodeStreak</span>
        </button>
      )}
      
      <div className="login-card">
        {/* Header with Logo */}
        <div className="login-brand-header">
          <div className="login-logo-glow-wrap">
            <img src={logoImg} alt="CodeStreak" className="login-brand-logo" />
          </div>
        </div>

        <div className="login-heading-group">
          <h1 className="login-title">
            Level up your DSA streak.
          </h1>
          <p className="login-subtitle">
            Automated problem tracking across platforms with instant GitHub commits and AI complexity breakdown.
          </p>
        </div>

        {/* Action & Security */}
        <div className="login-action-wrap">
          <button className="github-login-btn" onClick={onLogin}>
            <span className="btn-curvy-fill" />
            <span className="btn-content">
              <GithubIcon size={18} />
              <span>Continue with GitHub</span>
            </span>
          </button>
          <div className="login-security-badge">
            <ShieldCheckIcon size={14} />
            <span>Secure OAuth 2.0 • Public repository access only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
