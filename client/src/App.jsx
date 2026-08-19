import { useState, useEffect, useCallback } from 'react';
import './App.css';

// ── Hooks ────────────────────────────────────────────────────────
import { useAuth } from './hooks/useAuth';
import { useSubmissions } from './hooks/useSubmissions';
import { useStats } from './hooks/useStats';

// ── Components ───────────────────────────────────────────────────
import LandingPage from './components/LandingPage/LandingPage.jsx';
import LoginPage from './components/LoginPage/LoginPage.jsx';
import DashboardLayout from './components/Dashboard/DashboardLayout.jsx';
import DashboardHome from './components/Dashboard/DashboardHome.jsx';
import RepoBanner from './components/RepoBanner/RepoBanner.jsx';
import BreakdownCards from './components/BreakdownCards/BreakdownCards.jsx';
import SubmissionsList from './components/SubmissionsList/SubmissionsList.jsx';
import SettingsView from './components/Dashboard/SettingsView.jsx';
import InstallPage from './components/InstallPage/InstallPage.jsx';

const THEME_STORAGE_KEY = 'codestreak-theme';

const getInitialTheme = () => {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' ? 'light' : 'dark';
};

// ── Main App ────────────────────────────────────────────────────
function App() {
  const { token, user, loading, handleLogout, handleGithubLogin, updateUser } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sidebarTab, setSidebarTab] = useState('dashboard');
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync client route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const themeToggle = (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={handleThemeToggle}
      aria-label="Toggle theme"
      data-testid="theme-toggle"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );

  // If user is authenticated, redirect / or /login or /dashboard directly to /home
  useEffect(() => {
    if (token && (currentPath === '/' || currentPath === '/login' || currentPath === '/dashboard')) {
      navigate('/home');
    }
  }, [token, currentPath, navigate]);

  const onUnauthorized = useCallback(() => {
    handleLogout();
    navigate('/');
  }, [handleLogout, navigate]);

  const {
    submissions, heatmapData, dataLoading,
    repoName, setRepoName, repoLoading, repoError,
    repoSuccess, repoStatus, repoStatusLoading,
    repoPrompt, confirmUseExistingRepo, cancelUseExistingRepo,
    handleCreateRepo, handleUnlinkRepo, fetchRepoStatus,
  } = useSubmissions(token, onUnauthorized, updateUser);

  // UI state for sub-components
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    stats, languageBreakdown, tagBreakdown, filteredSubmissions,
  } = useStats(submissions, heatmapData, activeTab, searchQuery);

  // ── Render: Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-wrapper">
        {themeToggle}
        <div className="centered-state">
          <div className="loader-ring"><div></div><div></div><div></div><div></div></div>
          <p className="loader-text">Connecting with GitHub...</p>
        </div>
      </div>
    );
  }

  // ── Route: /login ──────────────────────────────────────────────
  if (currentPath === '/login') {
    return (
      <div className="app-wrapper">
        {themeToggle}
        <LoginPage
          onLogin={handleGithubLogin}
          onBack={() => navigate('/')}
        />
      </div>
    );
  }

  // ── Route: /install ─────────────────────────────────────────────
  if (currentPath === '/install' || currentPath === '/setup') {
    return (
      <div className="app-wrapper">
        {themeToggle}
        <InstallPage
          onBack={() => navigate('/')}
          onLogin={() => navigate('/login')}
          onGoToDashboard={() => navigate('/home')}
          user={user}
        />
      </div>
    );
  }

  // ── Route: /home (and /dashboard / /app alias) ───────────────────
  if (currentPath === '/home' || currentPath === '/dashboard' || currentPath === '/app') {
    // If not authenticated, prompt login
    if (!token) {
      return (
        <div className="app-wrapper">
          {themeToggle}
          <LoginPage
            onLogin={handleGithubLogin}
            onBack={() => navigate('/')}
          />
        </div>
      );
    }

    return (
      <>
        {themeToggle}
        <DashboardLayout
          user={user || { github_username: 'developer', avatar_url: 'https://github.com/ghost.png' }}
          onLogout={() => { handleLogout(); navigate('/'); }}
          activeTab={sidebarTab}
          onSelectTab={(tab) => setSidebarTab(tab)}
        >
          {/* Repo setup alert if repo is not ready */}
          {user && (!user.is_repo_ready || !user.github_repo_name) && (
            <div style={{ marginBottom: '24px' }}>
              <RepoBanner
                user={user}
                repoName={repoName}
                setRepoName={setRepoName}
                repoLoading={repoLoading}
                repoError={repoError}
                repoPrompt={repoPrompt}
                onConfirmUseExisting={confirmUseExistingRepo}
                onCancelUseExisting={cancelUseExistingRepo}
                onCreateRepo={handleCreateRepo}
              />
            </div>
          )}

          {sidebarTab === 'dashboard' && (
            <DashboardHome
              user={user}
              submissions={submissions}
              heatmapData={heatmapData}
              stats={stats}
              tagBreakdown={tagBreakdown}
              languageBreakdown={languageBreakdown}
              dataLoading={dataLoading}
              onNavigateToProblems={() => setSidebarTab('problems')}
              onNavigateToConcepts={() => setSidebarTab('concepts')}
            />
          )}

          {sidebarTab === 'problems' && (
            <div className="dash-subview">
              <SubmissionsList
                submissions={submissions}
                languageBreakdown={languageBreakdown}
                dataLoading={dataLoading}
                user={user}
              />
            </div>
          )}

          {sidebarTab === 'concepts' && (
            <div className="dash-subview">
              <BreakdownCards
                languageBreakdown={languageBreakdown}
                tagBreakdown={tagBreakdown}
                totalSolved={stats.totalSolved}
                submissions={submissions}
                user={user}
              />
            </div>
          )}

          {sidebarTab === 'settings' && (
            <div className="dash-subview">
              <SettingsView
                user={user || { github_username: 'developer' }}
                repoName={repoName}
                setRepoName={setRepoName}
                repoLoading={repoLoading}
                repoError={repoError}
                repoSuccess={repoSuccess}
                repoStatus={repoStatus}
                repoStatusLoading={repoStatusLoading}
                repoPrompt={repoPrompt}
                onConfirmUseExisting={confirmUseExistingRepo}
                onCancelUseExisting={cancelUseExistingRepo}
                onCreateRepo={handleCreateRepo}
                onUnlinkRepo={handleUnlinkRepo}
                onRefreshRepoStatus={fetchRepoStatus}
              />
            </div>
          )}
        </DashboardLayout>
      </>
    );
  }

  // ── Default Route: Landing Page (/) ────────────────────────────
  return (
    <>
      {themeToggle}
      <LandingPage
        onLogin={() => navigate('/login')}
        onGoToDashboard={() => navigate('/home')}
        onInstall={() => navigate('/install')}
        user={user}
      />
    </>
  );
}

export default App;
