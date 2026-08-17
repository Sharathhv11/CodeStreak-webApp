import './Navbar.css';
import { GithubIcon, ExternalLinkIcon } from '../icons/index.jsx';
import logoImg from '../../assets/codestreak.png';

// ── Navbar Component ────────────────────────────────────────────

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logoImg} alt="CodeStreak Logo" className="nav-logo-img" />
        <span className="nav-brand">CodeStreak</span>
      </div>
      <div className="nav-right">
        {user?.is_repo_ready && user?.github_repo_name && (
          <a href={user.github_repo_url || `https://github.com/${user.github_username}/${user.github_repo_name}`}
             target="_blank" rel="noreferrer" className="nav-repo-chip">
            <GithubIcon size={14} />
            <span>{user.github_repo_name}</span>
            <ExternalLinkIcon />
          </a>
        )}
        <div className="nav-user-pill">
          <img src={user?.avatar_url} alt="" className="nav-avatar" />
          <span className="nav-username">{user?.github_username}</span>
        </div>
        <button onClick={onLogout} className="nav-logout-btn">Logout</button>
      </div>
    </nav>
  );
}
