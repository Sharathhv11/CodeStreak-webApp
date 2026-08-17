import './StatsSection.css';
import { CodeIcon, FireIcon, TrophyIcon, BrainIcon } from '../icons/index.jsx';

// ── Stats Section Component (Greeting + Stat Cards) ─────────────

export default function StatsSection({ user, stats }) {
  return (
    <>
      {/* GREETING */}
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
    </>
  );
}
