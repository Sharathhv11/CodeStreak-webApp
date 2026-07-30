import { useEffect, useState, useMemo } from 'react';
import './App.css';

// ── SVG Icon Components ─────────────────────────────────────────
const GithubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChevronIcon = ({ expanded }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`chevron-icon ${expanded ? 'expanded' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

// ── Helper Functions ────────────────────────────────────────────
const formatDateReadable = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateReadable(dateStr);
};

const LANGUAGE_COLORS = {
  'c++': '#f34b7d', cpp: '#f34b7d', python: '#3572A5', python3: '#3572A5',
  java: '#b07219', javascript: '#f1e05a', typescript: '#3178c6',
  go: '#00ADD8', golang: '#00ADD8', rust: '#dea584', c: '#555555',
  ruby: '#701516', swift: '#F05138', kotlin: '#A97BFF', php: '#4F5D95',
  csharp: '#178600', 'c#': '#178600', dart: '#00B4AB', scala: '#c22d40',
};

const getLangColor = (lang) => LANGUAGE_COLORS[(lang || '').toLowerCase()] || '#6e7681';

// ── Main App ────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Repo creation state
  const [repoName, setRepoName] = useState('codestreak');
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState('');

  // UI state
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Auth: Exchange OAuth code on mount ────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    window.history.replaceState({}, document.title, "/");
    setLoading(true);

    fetch(`/auth/github/callback?code=${code}`)
      .then(res => res.json())
      .then(data => {
        const { token: receivedToken, user: receivedUser } = data;
        if (!receivedToken) throw new Error("No token in response");

        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);

        const EXTENSION_ID = "adfdipdnnoifjbmgigodmbaeiffhlmel";
        if (window.chrome?.runtime) {
          window.chrome.runtime.sendMessage(
            EXTENSION_ID,
            { type: "AUTH_TOKEN", token: receivedToken, user: receivedUser },
            (response) => console.log("extension ack →", response)
          );
        }
      })
      .catch(err => console.error("Auth error:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch data when token changes ────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [subsRes, heatRes] = await Promise.all([
        fetch('/api/submission', { headers }),
        fetch('/api/submission/heatmap', { headers })
      ]);

      if (subsRes.status === 401 || heatRes.status === 401) { handleLogout(); return; }

      const subsData = await subsRes.json();
      const heatData = await heatRes.json();
      if (subsData.success) setSubmissions(subsData.data);
      if (heatData.success) setHeatmapData(heatData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(''); setUser(null); setSubmissions([]); setHeatmapData([]);
    if (window.chrome?.runtime) {
      window.chrome.runtime.sendMessage("adfdipdnnoifjbmgigodmbaeiffhlmel", { type: "LOGOUT" });
    }
  };

  const handleGithubLogin = () => { window.location.href = "/auth/github"; };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) { setRepoError("Repository name cannot be empty."); return; }
    setRepoLoading(true); setRepoError('');
    try {
      const res = await fetch("/repo/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ repoName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        fetchData();
      } else {
        setRepoError(data.message || "Failed to create repository.");
      }
    } catch { setRepoError("Network error. Please try again."); }
    finally { setRepoLoading(false); }
  };

  // ── Computed Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!submissions.length) return { currentStreak: 0, maxStreak: 0, totalSolved: 0, uniqueLanguages: 0, todaySolved: 0 };

    const datesSet = new Set(submissions.map(s => new Date(s.timestamp).toLocaleDateString('en-CA')));
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const sortedDates = Array.from(datesSet).sort();

    // Max streak
    let maxStreak = 1, tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
      if (diff === 1) { tempStreak++; if (tempStreak > maxStreak) maxStreak = tempStreak; }
      else { tempStreak = 1; }
    }

    // Current streak
    let currentStreak = 0;
    if (datesSet.has(todayStr) || datesSet.has(yesterdayStr)) {
      const checkDate = datesSet.has(todayStr) ? new Date() : new Date(Date.now() - 86400000);
      while (datesSet.has(checkDate.toLocaleDateString('en-CA'))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const languages = new Set(submissions.map(s => s.language?.toLowerCase()));
    const todaySolved = submissions.filter(s => new Date(s.timestamp).toLocaleDateString('en-CA') === todayStr).length;

    return { currentStreak, maxStreak, totalSolved: submissions.length, uniqueLanguages: languages.size, todaySolved };
  }, [submissions]);

  // ── Language breakdown ────────────────────────────────────────
  const languageBreakdown = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      const lang = s.language || 'Other';
      map[lang] = (map[lang] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [submissions]);

  // ── Tag breakdown ─────────────────────────────────────────────
  const tagBreakdown = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      (s.tags || []).forEach(t => {
        const name = t.name || t;
        map[name] = (map[name] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [submissions]);

  // ── Filtered submissions ──────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    if (activeTab !== 'all') {
      filtered = filtered.filter(s => (s.language || '').toLowerCase() === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.slug?.toLowerCase().includes(q) ||
        (s.tags || []).some(t => (t.name || '').toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [submissions, activeTab, searchQuery]);

  // ── Heatmap ───────────────────────────────────────────────────
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      days.push(d.toLocaleDateString('en-CA'));
    }
    return days;
  }, []);

  const heatmapLookup = useMemo(() =>
    heatmapData.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
    [heatmapData]
  );

  const totalContributions = useMemo(() =>
    Object.values(heatmapLookup).reduce((sum, c) => sum + c, 0),
    [heatmapLookup]
  );

  const getHeatLevel = (count) => {
    if (!count) return 'level-0';
    if (count === 1) return 'level-1';
    if (count === 2) return 'level-2';
    if (count <= 4) return 'level-3';
    return 'level-4';
  };

  const monthLabels = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      labels.push(months[(today.getMonth() - i + 12) % 12]);
    }
    return labels;
  }, []);

  // ── Render: Login ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="centered-state">
          <div className="loader-ring"><div></div><div></div><div></div><div></div></div>
          <p className="loader-text">Connecting with GitHub...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="app-wrapper">
        <div className="login-page">
          <div className="login-bg-gradient" />
          <div className="login-card">
            <div className="login-logo">
              <span className="logo-icon">⚡</span>
              <h1>CodeStreak</h1>
            </div>
            <p className="login-tagline">
              Track your coding consistency. Auto-sync solutions to GitHub with AI-powered complexity analysis.
            </p>
            <div className="login-features">
              <div className="feature-chip"><span>🔥</span> Streak Tracking</div>
              <div className="feature-chip"><span>🧠</span> AI Analysis</div>
              <div className="feature-chip"><span>📊</span> Heatmap</div>
              <div className="feature-chip"><span>🐙</span> GitHub Sync</div>
            </div>
            <button className="github-login-btn" onClick={handleGithubLogin}>
              <GithubIcon size={20} />
              <span>Continue with GitHub</span>
            </button>
            <p className="login-disclaimer">We only request public repository access.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Dashboard ─────────────────────────────────────────
  return (
    <div className="app-wrapper">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo-icon">⚡</span>
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
          <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
        </div>
      </nav>

      <main className="dashboard">
        {/* REPO SETUP BANNER */}
        {(!user?.is_repo_ready || !user?.github_repo_name) && (
          <section className="repo-banner">
            <div className="repo-banner-content">
              <div className="repo-banner-text">
                <h3>🚀 Set Up Your Repository</h3>
                <p>Create a GitHub repository to automatically sync your solved problems.</p>
              </div>
              <form onSubmit={handleCreateRepo} className="repo-banner-form">
                <div className="repo-input-wrap">
                  <span className="repo-prefix">{user?.github_username}/</span>
                  <input type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)}
                         placeholder="codestreak" disabled={repoLoading} />
                </div>
                <button type="submit" className="repo-create-btn" disabled={repoLoading}>
                  {repoLoading ? 'Creating...' : 'Create Repo'}
                </button>
              </form>
              {repoError && <p className="repo-error">{repoError}</p>}
            </div>
          </section>
        )}

        {/* GREETING + STATS ROW */}
        <section className="greeting-section">
          <div className="greeting-text">
            <h2>Welcome back, <span className="accent-text">{user?.name || user?.github_username}</span></h2>
            <p className="greeting-sub">
              {stats.todaySolved > 0
                ? `You've solved ${stats.todaySolved} problem${stats.todaySolved > 1 ? 's' : ''} today. Keep it up!`
                : "You haven't solved any problems today. Let's get started!"}
            </p>
          </div>
        </section>

        {/* STAT CARDS */}
        <section className="stat-cards">
          <div className="stat-card stat-total">
            <div className="stat-card-icon"><CodeIcon /></div>
            <div className="stat-card-body">
              <span className="stat-number">{stats.totalSolved}</span>
              <span className="stat-desc">Problems Solved</span>
            </div>
          </div>
          <div className="stat-card stat-streak">
            <div className="stat-card-icon fire"><FireIcon /></div>
            <div className="stat-card-body">
              <span className="stat-number">{stats.currentStreak}</span>
              <span className="stat-desc">Day Streak</span>
            </div>
          </div>
          <div className="stat-card stat-max">
            <div className="stat-card-icon trophy"><TrophyIcon /></div>
            <div className="stat-card-body">
              <span className="stat-number">{stats.maxStreak}</span>
              <span className="stat-desc">Max Streak</span>
            </div>
          </div>
          <div className="stat-card stat-langs">
            <div className="stat-card-icon brain"><BrainIcon /></div>
            <div className="stat-card-body">
              <span className="stat-number">{stats.uniqueLanguages}</span>
              <span className="stat-desc">Languages Used</span>
            </div>
          </div>
        </section>

        {/* HEATMAP */}
        <section className="card heatmap-section">
          <div className="card-header-row">
            <h3>{totalContributions} submissions in the last year</h3>
          </div>
          <div className="heatmap-scroll">
            <div className="heatmap-wrapper">
              <div className="heatmap-months">
                {monthLabels.map((m, i) => <span key={i} className="month-lbl">{m}</span>)}
              </div>
              <div className="heatmap-body">
                <div className="heatmap-days-labels">
                  <span>Mon</span><span>Wed</span><span>Fri</span>
                </div>
                <div className="heatmap-grid">
                  {heatmapDays.map(day => {
                    const count = heatmapLookup[day] || 0;
                    return (
                      <div key={day} className={`hm-cell ${getHeatLevel(count)}`}
                           title={`${count} submission${count !== 1 ? 's' : ''} on ${formatDateReadable(day)}`} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="heatmap-footer">
            <span className="heatmap-legend-label">Less</span>
            <div className="hm-cell level-0 legend-cell" />
            <div className="hm-cell level-1 legend-cell" />
            <div className="hm-cell level-2 legend-cell" />
            <div className="hm-cell level-3 legend-cell" />
            <div className="hm-cell level-4 legend-cell" />
            <span className="heatmap-legend-label">More</span>
          </div>
        </section>

        {/* TWO-COLUMN: LANGUAGES + TAGS */}
        <div className="two-col-row">
          <section className="card lang-breakdown-card">
            <h3>Languages</h3>
            {languageBreakdown.length === 0 ? (
              <p className="empty-text">No data yet</p>
            ) : (
              <div className="lang-list">
                {languageBreakdown.map(([lang, count]) => {
                  const pct = Math.round((count / stats.totalSolved) * 100);
                  return (
                    <div key={lang} className="lang-row">
                      <div className="lang-info">
                        <span className="lang-dot" style={{ background: getLangColor(lang) }} />
                        <span className="lang-name">{lang}</span>
                        <span className="lang-count">{count}</span>
                      </div>
                      <div className="lang-bar-track">
                        <div className="lang-bar-fill" style={{ width: `${pct}%`, background: getLangColor(lang) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="card tags-card">
            <h3>Top Topics</h3>
            {tagBreakdown.length === 0 ? (
              <p className="empty-text">No tags yet</p>
            ) : (
              <div className="tags-cloud">
                {tagBreakdown.map(([name, count]) => (
                  <span key={name} className="topic-chip">
                    {name} <span className="topic-count">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* SUBMISSIONS LIST */}
        <section className="card submissions-section">
          <div className="card-header-row submissions-header">
            <h3>Solved Problems</h3>
            <div className="submissions-controls">
              <div className="search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search problems..." value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Language filter tabs */}
          <div className="filter-tabs">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              All <span className="tab-count">{submissions.length}</span>
            </button>
            {languageBreakdown.slice(0, 5).map(([lang, count]) => (
              <button key={lang}
                      className={`tab-btn ${activeTab === lang.toLowerCase() ? 'active' : ''}`}
                      onClick={() => setActiveTab(lang.toLowerCase())}>
                <span className="lang-dot-sm" style={{ background: getLangColor(lang) }} />
                {lang} <span className="tab-count">{count}</span>
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className="data-loader">
              <div className="loader-ring small"><div></div><div></div><div></div><div></div></div>
              <p>Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>{searchQuery ? 'No problems match your search.' : 'No submissions yet. Solve a problem on LeetCode with the extension!'}</p>
            </div>
          ) : (
            <div className="submissions-list">
              {filteredSubmissions.map((sub) => (
                <div key={sub._id} className={`sub-card ${activeSubmission?._id === sub._id ? 'expanded' : ''}`}
                     onClick={() => setActiveSubmission(activeSubmission?._id === sub._id ? null : sub)}>
                  <div className="sub-card-main">
                    <div className="sub-left">
                      <span className="sub-lang-dot" style={{ background: getLangColor(sub.language) }} />
                      <div className="sub-info">
                        <span className="sub-title">{sub.title}</span>
                        <div className="sub-meta-row">
                          <span className="sub-lang-badge">{sub.language}</span>
                          {sub.runtime && <span className="sub-meta"><ClockIcon /> {sub.runtime}</span>}
                          {sub.memory && <span className="sub-meta">💾 {sub.memory}</span>}
                          <span className="sub-meta sub-time">{formatTimeAgo(sub.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="sub-right">
                      {sub.timeComplexity && <span className="complexity-chip time-chip">{sub.timeComplexity}</span>}
                      {sub.spaceComplexity && <span className="complexity-chip space-chip">{sub.spaceComplexity}</span>}
                      <ChevronIcon expanded={activeSubmission?._id === sub._id} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {activeSubmission?._id === sub._id && (
                    <div className="sub-expanded" onClick={(e) => e.stopPropagation()}>
                      <div className="sub-detail-grid">
                        <div className="sub-analysis">
                          <div className="analysis-header">
                            <BrainIcon /> <h4>AI Analysis</h4>
                          </div>
                          <p className="analysis-text">{sub.explanation || 'No analysis available.'}</p>
                          <div className="complexity-detail-row">
                            <div className="complexity-block">
                              <span className="complexity-label">Time</span>
                              <span className="complexity-value time-value">{sub.timeComplexity || 'N/A'}</span>
                            </div>
                            <div className="complexity-block">
                              <span className="complexity-label">Space</span>
                              <span className="complexity-value space-value">{sub.spaceComplexity || 'N/A'}</span>
                            </div>
                          </div>

                          {sub.tags?.length > 0 && (
                            <div className="sub-tags">
                              {sub.tags.map((tag, i) => (
                                <span key={i} className="sub-tag">{tag.name || tag}</span>
                              ))}
                            </div>
                          )}

                          {user?.is_repo_ready && (
                            <a href={`https://github.com/${user.github_username}/${user.github_repo_name}/tree/main/LeetCode/${sub.slug}`}
                               target="_blank" rel="noreferrer" className="gh-view-btn">
                              <GithubIcon size={14} /> View on GitHub <ExternalLinkIcon />
                            </a>
                          )}
                        </div>

                        <div className="sub-code-pane">
                          <div className="code-pane-header">
                            <span>Solution</span>
                            <span className="code-lang-label">{sub.language}</span>
                          </div>
                          <pre className="code-block"><code>{sub.code}</code></pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ by CodeStreak — Powered by Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
