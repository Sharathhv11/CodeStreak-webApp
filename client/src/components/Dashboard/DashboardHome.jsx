import { useState, useMemo } from 'react';
import './DashboardHome.css';
import {
  FireIcon,
  TrophyIcon,
  CodeIcon,
  TagIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  InboxIcon,
  GithubIcon,
  ChromeIcon,
} from '../icons/index.jsx';
import { formatTimeAgo, formatDateReadable, getLocalDateKey } from '../../utils/helpers';
import { aggregateConceptData, DIFFICULTY_CONFIG } from '../../utils/conceptHelpers';
import StreakTimerBanner from './StreakTimerBanner';
import MuiSparkline from '../Charts/MuiSparkline';

export default function DashboardHome({
  user,
  submissions = [],
  heatmapData = [],
  stats = { totalSolved: 0, currentStreak: 0, maxStreak: 0, uniqueLanguages: 0, todaySolved: 0 },
  tagBreakdown = [],
  languageBreakdown = [],
  dataLoading = false,
  onNavigateToProblems,
  onNavigateToConcepts,
}) {
  // Active platform filter for heatmap
  const [platformFilter, setPlatformFilter] = useState('All');

  // MUI KPI Sparkline Trends (Dynamic 10-point curves)
  const sparklineTrends = useMemo(() => {
    const dateCounts = {};
    submissions.forEach((s) => {
      const key = getLocalDateKey(s.timestamp);
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    });

    const now = new Date();
    const last10Daily = [];
    let runningSum = 0;
    const cumulative = [];

    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = getLocalDateKey(d);
      const c = dateCounts[k] || 0;
      last10Daily.push(c);
      runningSum += c;
      cumulative.push(runningSum);
    }

    const totalTrend = cumulative.some((v) => v > 0)
      ? cumulative
      : [2, 4, 3, 6, 5, 8, 7, 9, 8, stats.totalSolved || 10];

    const currentStreakTrend = stats.currentStreak > 0
      ? [0, 0, 0.4, 0.4, 0.8, 0.8, Math.max(0.8, stats.currentStreak - 0.5), stats.currentStreak]
      : [0, 0, 0, 0, 0, 0, 0, 0];

    const longestStreakTrend = [1, 1, 1, 1, 1, 1, 1, stats.maxStreak || 1];

    const conceptsTrend = tagBreakdown.length > 0
      ? [1, 1, 1, 1, 2, 2, tagBreakdown.length]
      : [1, 1, 1, 2, 2, 2];

    return {
      totalSolved: totalTrend,
      currentStreak: currentStreakTrend,
      longestStreak: longestStreakTrend,
      concepts: conceptsTrend,
    };
  }, [submissions, stats, tagBreakdown]);

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted local date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Map heatmap data from backend [{ _id: 'YYYY-MM-DD', count: N, submissions: [...] }] or object
  const heatmapLookup = useMemo(() => {
    if (Array.isArray(heatmapData)) {
      return heatmapData.reduce((acc, curr) => {
        if (curr && curr._id) {
          acc[curr._id] = curr;
        }
        return acc;
      }, {});
    }
    return heatmapData || {};
  }, [heatmapData]);

  // Generate 52 weeks (364 days) calendar grid using local dates ending today
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(getLocalDateKey(d));
    }
    return days;
  }, []);

  // Heatmap month labels along the top
  const monthLabels = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const mIdx = (today.getMonth() - i + 12) % 12;
      labels.push(months[mIdx]);
    }
    return labels;
  }, []);

  // Heat level color class (0 to 4) - Pure Monochrome
  const getHeatLevelClass = (count) => {
    if (!count || count === 0) return 'lvl-0';
    if (count === 1) return 'lvl-1';
    if (count === 2) return 'lvl-2';
    if (count <= 4) return 'lvl-3';
    return 'lvl-4';
  };

  // Recent 5 real submissions
  const recentSubmissions = useMemo(() => {
    return submissions.slice(0, 5);
  }, [submissions]);

  // Total count for languages breakdown
  const totalLanguageCount = useMemo(() => {
    if (!languageBreakdown || languageBreakdown.length === 0) return 0;
    return languageBreakdown.reduce((acc, [, count]) => acc + count, 0);
  }, [languageBreakdown]);

  // Monochrome shades for languages multi-line graph
  const monochromeShades = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

  // Top concepts with difficulty stack breakdown
  const topConceptsWithDifficulty = useMemo(() => {
    const res = aggregateConceptData({ submissions, limit: 6 });
    return res.concepts;
  }, [submissions]);

  // Max count for concept progress bar scaling
  const maxConceptCount = useMemo(() => {
    if (!topConceptsWithDifficulty || topConceptsWithDifficulty.length === 0) return 1;
    return Math.max(...topConceptsWithDifficulty.map((t) => t.total), 1);
  }, [topConceptsWithDifficulty]);

  return (
    <div className="dash-home pure-bw">
      {/* ── Top Bar (Pure Monochrome) ─────────────────────────── */}
      <header className="dash-topbar">
        <div className="dash-greeting-wrap">
          <div className="dash-greeting-row">
            <h1 className="dash-greeting">
              {greetingTime}, <span className="dash-greeting-user">@{user?.github_username || 'developer'}</span>
            </h1>
            <span className="greeting-wave">👋</span>
          </div>
          <p className="dash-greeting-sub">
            Your unified DSA knowledge repository is in sync • <span className="dash-current-date">{todayFormatted}</span>
          </p>
        </div>

        {/* Topbar Right: Linked GitHub Repository Pill */}
        {user?.is_repo_ready && user?.github_repo_name && (
          <div className="dash-topbar-right">
            <a
              href={user.github_repo_url || `https://github.com/${user.github_username}/${user.github_repo_name}`}
              target="_blank"
              rel="noreferrer"
              className="topbar-repo-chip"
              title="Open repository on GitHub"
            >
              <GithubIcon size={14} />
              <span>{user.github_username}/{user.github_repo_name}</span>
              <ExternalLinkIcon size={11} />
            </a>
          </div>
        )}
      </header>

      {/* ── Streak Status & Countdown Timer Banner ────────────── */}
      <StreakTimerBanner stats={stats} />

      {/* ── Row 1: 4 MUI-Style Stat Cards with SparkLines ────── */}
      <section className="dash-stats-grid">
        {/* Card 1: Total Solved */}
        <div className="dash-stat-card mui-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Solved</span>
            <div className="stat-icon-badge mono">
              <CodeIcon size={14} />
            </div>
          </div>
          <div className="stat-card-middle">
            <div className="stat-number-wrap">
              <span className="stat-value">{stats.totalSolved}</span>
            </div>
            <MuiSparkline
              data={sparklineTrends.totalSolved}
              color="#3b82f6"
              width={116}
              height={44}
            />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">across all platforms</span>
            {stats.uniqueLanguages > 0 && (
              <span className="stat-badge-sm">{stats.uniqueLanguages} language{stats.uniqueLanguages > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Card 2: Current Streak */}
        <div className="dash-stat-card mui-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Current Streak</span>
            <div className="stat-icon-badge mono">
              <FireIcon size={14} />
            </div>
          </div>
          <div className="stat-card-middle">
            <div className="stat-number-wrap">
              <span className="stat-value">
                {stats.currentStreak > 0 ? `${stats.currentStreak}d` : '0d'}
              </span>
            </div>
            <MuiSparkline
              data={sparklineTrends.currentStreak}
              color="#3b82f6"
              width={116}
              height={44}
            />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">
              {stats.currentStreak > 0 ? 'keep the streak alive' : 'solve a problem today'}
            </span>
          </div>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="dash-stat-card mui-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Longest Streak</span>
            <div className="stat-icon-badge mono">
              <TrophyIcon size={14} />
            </div>
          </div>
          <div className="stat-card-middle">
            <div className="stat-number-wrap">
              <span className="stat-value">{stats.maxStreak}d</span>
            </div>
            <MuiSparkline
              data={sparklineTrends.longestStreak}
              color="#3b82f6"
              width={116}
              height={44}
            />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">all-time personal best</span>
          </div>
        </div>

        {/* Card 4: Concepts Covered */}
        <div className="dash-stat-card mui-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Concepts Covered</span>
            <div className="stat-icon-badge mono">
              <TagIcon size={14} />
            </div>
          </div>
          <div className="stat-card-middle">
            <div className="stat-number-wrap">
              <span className="stat-value">{tagBreakdown.length}</span>
            </div>
            <MuiSparkline
              data={sparklineTrends.concepts}
              color="#3b82f6"
              width={116}
              height={44}
            />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">
              {stats.totalSolved > 0 ? 'mastered paradigms' : 'out of 40+ paradigms'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Row 2: 52-Week Contribution Heatmap (Pure Monochrome) ─ */}
      <section className="dash-card heatmap-card">
        <div className="dash-card-header">
          <div className="dash-card-title-group">
            <h2 className="dash-card-title">Submission Activity</h2>
            <span className="dash-card-subtitle">52-week consolidated coding frequency</span>
          </div>

          <div className="heatmap-header-right">
            {/* Platform Filter Segmented Control */}
            <div className="heatmap-segmented-control">
              {['All', 'LeetCode', 'Codeforces'].map((plat) => (
                <button
                  key={plat}
                  className={`segmented-pill ${platformFilter === plat ? 'active' : ''}`}
                  onClick={() => setPlatformFilter(plat)}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="heatmap-legend">
              <span className="legend-txt">Less</span>
              <span className="hm-cell lvl-0" />
              <span className="hm-cell lvl-1" />
              <span className="hm-cell lvl-2" />
              <span className="hm-cell lvl-3" />
              <span className="hm-cell lvl-4" />
              <span className="legend-txt">More</span>
            </div>
          </div>
        </div>

        {/* Heatmap Month Labels */}
        <div className="heatmap-month-labels">
          <div className="month-spacer" />
          <div className="month-labels-row">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="month-label">{m}</span>
            ))}
          </div>
        </div>

        {/* Heatmap Grid & Weekdays */}
        <div className="dash-heatmap-wrapper">
          <div className="heatmap-days-col">
            <span className="day-label">Mon</span>
            <span className="day-label">Wed</span>
            <span className="day-label">Fri</span>
          </div>

          <div className="dash-heatmap-scroll">
            <div className="dash-heatmap-grid">
              {heatmapDays.map((day) => {
                const dayData = heatmapLookup[day];
                let count = 0;

                if (dayData) {
                  if (typeof dayData === 'number') {
                    count = dayData;
                  } else if (typeof dayData.count === 'number') {
                    count = dayData.count;
                    if (platformFilter !== 'All' && Array.isArray(dayData.submissions)) {
                      count = dayData.submissions.filter(s =>
                        (s.platform || '').toLowerCase().includes(platformFilter.toLowerCase())
                      ).length;
                    }
                  }
                }

                return (
                  <div
                    key={day}
                    className={`hm-cell ${getHeatLevelClass(count)}`}
                    title={`${count} problem${count !== 1 ? 's' : ''} solved · ${formatDateReadable(day)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Row 3: Two Columns (Submissions Table + Right Column Sidebars) */}
      <div className="dash-two-col-grid">
        {/* Left Column (60%): Recent Submissions */}
        <section className="dash-card submissions-table-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <h2 className="dash-card-title">Recent Submissions</h2>
              <span className="dash-card-subtitle">Latest solutions synchronized to GitHub</span>
            </div>
            {submissions.length > 5 && onNavigateToProblems && (
              <button className="dash-link-btn" onClick={onNavigateToProblems}>
                <span>View all ({submissions.length})</span>
                <ArrowRightIcon size={12} />
              </button>
            )}
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="dash-empty-state">
              <div className="empty-icon-box">
                <InboxIcon size={26} />
              </div>
              <h3 className="empty-title">No submissions yet</h3>
              <p className="empty-desc">
                Install the CodeStreak extension and solve your first problem on LeetCode or GeeksforGeeks to start tracking your streak.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Platform</th>
                    <th>Concept</th>
                    <th>Language</th>
                    <th>Runtime</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub) => {
                    const platformName = sub.platform || 'LeetCode';
                    const conceptTag = sub.concept || (sub.tags && (sub.tags[0]?.name || sub.tags[0])) || 'General';
                    const conceptSlug = conceptTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    const problemSlug = (sub.slug || sub.title).toLowerCase().replace(/[^a-z0-9-_.]+/g, '-');
                    const platformSlug = platformName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                    const targetUrl = user?.is_repo_ready && user?.github_username && user?.github_repo_name
                      ? `https://github.com/${user.github_username}/${user.github_repo_name}/tree/main/${platformSlug}/${conceptSlug}/${problemSlug}`
                      : `https://github.com/search?q=${encodeURIComponent(sub.title)}`;

                    return (
                      <tr key={sub._id}>
                        {/* Problem Title */}
                        <td className="cell-problem">
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="problem-link"
                            title="Open solution on GitHub"
                          >
                            <span>{sub.title}</span>
                            <ExternalLinkIcon size={11} />
                          </a>
                        </td>

                        {/* Platform Badge */}
                        <td className="cell-platform">
                          <span className="plat-badge mono">
                            {platformName}
                          </span>
                        </td>

                        {/* Concept Tag */}
                        <td className="cell-concept">
                          <span className="concept-pill">
                            {conceptTag}
                          </span>
                        </td>

                        {/* Language */}
                        <td className="cell-lang">
                          <span className="lang-text">
                            {sub.language || 'Code'}
                          </span>
                        </td>

                        {/* Runtime */}
                        <td className="cell-runtime">
                          <span className="runtime-text">{sub.runtime || '—'}</span>
                        </td>

                        {/* Timestamp */}
                        <td className="cell-time">
                          <span className="time-text">{formatTimeAgo(sub.timestamp || sub.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column (40%): Concept Strength */}
        <section className="dash-card concepts-strength-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <h2 className="dash-card-title">Concept Strength</h2>
              <span className="dash-card-subtitle">Mastery across solved DSA paradigms</span>
            </div>
            {tagBreakdown.length > 6 && onNavigateToConcepts && (
              <button className="dash-link-btn" onClick={onNavigateToConcepts}>
                <span>View all</span>
                <ArrowRightIcon size={12} />
              </button>
            )}
          </div>

          {topConceptsWithDifficulty.length === 0 ? (
            <div className="dash-empty-state mini">
              <div className="empty-icon-box mini">
                <TagIcon size={20} />
              </div>
              <h3 className="empty-title mini">No concept data yet</h3>
              <p className="empty-desc mini">
                Solve problems across different paradigms to build your concept profile.
              </p>
            </div>
          ) : (
            <div className="concept-bars-list">
              {topConceptsWithDifficulty.map((item) => {
                const totalPct = Math.round((item.total / maxConceptCount) * 100);
                const easyShare = item.total > 0 ? (item.easy / item.total) * 100 : 0;
                const medShare = item.total > 0 ? (item.medium / item.total) * 100 : 0;
                const hardShare = item.total > 0 ? (item.hard / item.total) * 100 : 0;

                return (
                  <div
                    key={item.concept}
                    className="concept-bar-item"
                    onClick={onNavigateToConcepts}
                    style={{ cursor: 'pointer' }}
                    title={`View ${item.concept} stacked analytics: ${item.easy} Easy, ${item.medium} Medium, ${item.hard} Hard`}
                  >
                    <div className="concept-bar-meta">
                      <span className="concept-name">{item.concept}</span>
                      <div className="concept-count-pills">
                        <span className="concept-count-badge">{item.total} solved</span>
                      </div>
                    </div>
                    <div className="concept-progress-track">
                      <div
                        className="concept-stacked-bar-fill"
                        style={{ width: `${totalPct}%`, display: 'flex', height: '100%', borderRadius: '9999px', overflow: 'hidden' }}
                      >
                        {item.easy > 0 && (
                          <div
                            style={{
                              width: `${easyShare}%`,
                              backgroundColor: DIFFICULTY_CONFIG.Easy.color,
                              height: '100%',
                            }}
                          />
                        )}
                        {item.medium > 0 && (
                          <div
                            style={{
                              width: `${medShare}%`,
                              backgroundColor: DIFFICULTY_CONFIG.Medium.color,
                              height: '100%',
                            }}
                          />
                        )}
                        {item.hard > 0 && (
                          <div
                            style={{
                              width: `${hardShare}%`,
                              backgroundColor: DIFFICULTY_CONFIG.Hard.color,
                              height: '100%',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Beautiful Dashboard Footer ─────────────────────────── */}
      <footer className="dash-home-footer">
        <div className="dash-footer-divider" />
        <div className="dash-footer-content">
          <div className="dash-footer-left">
            <span className="dash-footer-logo">CodeStreak</span>
            <p className="dash-footer-text">
              Automated DSA repository synchronization. Built for engineers.
            </p>
          </div>
          <div className="dash-footer-links">
            <a href="https://github.com/Sharathhv11/CodeStreak-webApp" target="_blank" rel="noreferrer" className="dash-footer-link">
              <GithubIcon size={13} />
              <span>GitHub</span>
            </a>
            <a href="/install" className="dash-footer-link">
              <ChromeIcon size={13} />
              <span>Extension Setup</span>
            </a>
          </div>
          <div className="dash-footer-right">
            <div className="status-indicator">
              <span className="status-dot green" />
              <span className="status-label">All systems operational</span>
            </div>
            <span className="dash-copyright">© {new Date().getFullYear()} CodeStreak</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
