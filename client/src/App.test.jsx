import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    token: null,
    user: null,
    loading: false,
    handleLogout: vi.fn(),
    handleGithubLogin: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

vi.mock('./hooks/useSubmissions', () => ({
  useSubmissions: () => ({
    submissions: [],
    heatmapData: [],
    dataLoading: false,
    repoName: '',
    setRepoName: vi.fn(),
    repoLoading: false,
    repoError: null,
    repoSuccess: null,
    repoStatus: null,
    repoStatusLoading: false,
    repoPrompt: null,
    confirmUseExistingRepo: vi.fn(),
    cancelUseExistingRepo: vi.fn(),
    handleCreateRepo: vi.fn(),
    handleUnlinkRepo: vi.fn(),
    fetchRepoStatus: vi.fn(),
  }),
}));

vi.mock('./hooks/useStats', () => ({
  useStats: () => ({
    stats: { totalSolved: 0 },
    languageBreakdown: [],
    tagBreakdown: [],
    filteredSubmissions: [],
  }),
}));

vi.mock('./components/LandingPage/LandingPage.jsx', () => ({
  default: () => <div>Landing Page</div>,
}));
vi.mock('./components/LoginPage/LoginPage.jsx', () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock('./components/Dashboard/DashboardLayout.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('./components/Dashboard/DashboardHome.jsx', () => ({
  default: () => <div>Dashboard Home</div>,
}));
vi.mock('./components/RepoBanner/RepoBanner.jsx', () => ({
  default: () => <div>Repo Banner</div>,
}));
vi.mock('./components/BreakdownCards/BreakdownCards.jsx', () => ({
  default: () => <div>Breakdown Cards</div>,
}));
vi.mock('./components/SubmissionsList/SubmissionsList.jsx', () => ({
  default: () => <div>Submissions List</div>,
}));
vi.mock('./components/Dashboard/SettingsView.jsx', () => ({
  default: () => <div>Settings View</div>,
}));
vi.mock('./components/InstallPage/InstallPage.jsx', () => ({
  default: () => <div>Install Page</div>,
}));

describe('App theme toggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    window.history.pushState({}, '', '/');
  });

  it('renders the theme toggle button', () => {
    render(<App />);

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('changes theme attribute when toggled', () => {
    render(<App />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    fireEvent.click(screen.getByTestId('theme-toggle'));

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('codestreak-theme')).toBe('light');
  });

  it('reads persisted theme preference on load', () => {
    window.localStorage.setItem('codestreak-theme', 'light');

    render(<App />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Dark mode');
  });
});
