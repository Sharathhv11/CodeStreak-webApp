import { useState } from 'react';
import './DashboardLayout.css';
import logoImg from '../../assets/codestreak.png';
import {
  HomeIcon,
  ListIcon,
  TagIcon,
  SettingsIcon,
  LogOutIcon,
} from '../icons/index.jsx';

export default function DashboardLayout({ user, onLogout, activeTab, onSelectTab, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon size={17} /> },
    { id: 'problems', label: 'Problems', icon: <ListIcon size={17} /> },
    { id: 'concepts', label: 'Concepts', icon: <TagIcon size={17} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={17} /> },
  ];

  return (
    <div className="dash-container">
      {/* Mobile Top Navigation */}
      <header className="dash-mobile-header">
        <div className="dash-mobile-brand">
          <img src={logoImg} alt="CodeStreak" className="dash-mobile-logo" />
        </div>
        <button
          className="dash-mobile-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <span>{mobileNavOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="dash-mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside className={`dash-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="dash-sidebar-header">
          <div className="brand-lockup">
            <img src={logoImg} alt="CodeStreak" className="dash-sidebar-logo" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="dash-nav-menu" aria-label="Main Navigation">
          <span className="nav-section-label">Navigation</span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`dash-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileNavOpen(false);
                }}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="dash-nav-label">{item.label}</span>
                {isActive && <span className="active-nav-glow" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer — User & Logout */}
        <div className="dash-sidebar-footer">
          <div className="dash-user-profile">
            <div className="user-avatar-wrapper">
              <img
                src={user?.avatar_url || 'https://github.com/ghost.png'}
                alt={user?.github_username || 'User'}
                className="dash-user-avatar"
              />
              <span className="user-online-dot" />
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">@{user?.github_username || 'developer'}</span>
              <span className="dash-user-tier">GitHub Connected</span>
            </div>
          </div>
          <button
            className="dash-logout-btn"
            onClick={onLogout}
            title="Sign out of CodeStreak"
            aria-label="Sign out"
          >
            <LogOutIcon size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main-content">
        <div className="dash-main-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
