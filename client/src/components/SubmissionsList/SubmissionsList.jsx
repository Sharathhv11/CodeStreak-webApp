import { useState, useMemo } from 'react';
import './SubmissionsList.css';
import { InboxIcon, SearchIcon, CodeIcon, SparklesIcon, TagIcon } from '../icons/index.jsx';
import { getLangColor } from '../../utils/languageColors';
import { getLocalDateKey } from '../../utils/helpers';
import SubmissionCard from './SubmissionCard';
import MuiXLineChart from '../Charts/MuiXLineChart';

// ── Futuristic Solved Problems Component with Cross-Platform Filtering & React Chart ──

export default function SubmissionsList({
  submissions = [],
  languageBreakdown = [],
  dataLoading = false,
  user,
}) {
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChart, setShowChart] = useState(true);

  // Platform Breakdown Counts
  const platformCounts = useMemo(() => {
    const counts = { all: submissions.length, leetcode: 0, codeforces: 0, geeksforgeeks: 0 };
    submissions.forEach((sub) => {
      const plat = (sub.platform || 'leetcode').toLowerCase();
      if (plat.includes('codeforces') || plat === 'cf') counts.codeforces += 1;
      else if (plat.includes('geeks') || plat.includes('gfg')) counts.geeksforgeeks += 1;
      else counts.leetcode += 1;
    });
    return counts;
  }, [submissions]);

  // Filtered Submissions (Multi-Dimensional: Platform + Language + Search)
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const subPlat = (sub.platform || 'leetcode').toLowerCase();
      const subLang = (sub.language || '').toLowerCase();

      // Platform filter
      if (selectedPlatform !== 'all') {
        if (selectedPlatform === 'leetcode' && !subPlat.includes('leetcode')) return false;
        if (selectedPlatform === 'codeforces' && !subPlat.includes('codeforces') && subPlat !== 'cf') return false;
        if (selectedPlatform === 'geeksforgeeks' && !subPlat.includes('geeks') && !subPlat.includes('gfg')) return false;
      }

      // Language filter
      if (selectedLanguage !== 'all' && subLang !== selectedLanguage) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullText = [
          sub.title || '',
          sub.slug || '',
          sub.concept || '',
          sub.language || '',
          sub.platform || '',
          sub.explanation || '',
          ...(sub.tags || []).map((t) => (typeof t === 'string' ? t : t.name || '')),
        ].join(' ').toLowerCase();

        if (!fullText.includes(q)) return false;
      }

      return true;
    });
  }, [submissions, selectedPlatform, selectedLanguage, searchQuery]);

  // Futuristic Cross-Platform Timeline Chart Data
  const { chartData, chartSeries } = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return { chartData: [], chartSeries: [] };
    }

    // 7-day timeline points
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        key: getLocalDateKey(d),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    const series = [
      { key: 'leetcode', label: 'LeetCode', color: '#f59e0b', totalCount: platformCounts.leetcode },
      { key: 'codeforces', label: 'Codeforces', color: '#38bdf8', totalCount: platformCounts.codeforces },
      { key: 'geeksforgeeks', label: 'GeeksforGeeks', color: '#10b981', totalCount: platformCounts.geeksforgeeks },
    ];

    let lcCum = 0;
    let cfCum = 0;
    let gfgCum = 0;

    const data = days.map((day, idx) => {
      const row = { day: day.label, key: day.key };

      const lcOnDay = submissions.filter((s) => {
        const p = (s.platform || 'leetcode').toLowerCase();
        const d = getLocalDateKey(new Date(s.timestamp || s.createdAt || Date.now()));
        return d === day.key && (p.includes('leetcode') || (!p.includes('codeforces') && !p.includes('geeks')));
      }).length;

      const cfOnDay = submissions.filter((s) => {
        const p = (s.platform || '').toLowerCase();
        const d = getLocalDateKey(new Date(s.timestamp || s.createdAt || Date.now()));
        return d === day.key && (p.includes('codeforces') || p === 'cf');
      }).length;

      const gfgOnDay = submissions.filter((s) => {
        const p = (s.platform || '').toLowerCase();
        const d = getLocalDateKey(new Date(s.timestamp || s.createdAt || Date.now()));
        return d === day.key && (p.includes('geeks') || p.includes('gfg'));
      }).length;

      lcCum += lcOnDay;
      cfCum += cfOnDay;
      gfgCum += gfgOnDay;

      // Make sure final totals match actual platform counts at latest point
      row.leetcode = idx === days.length - 1 ? Math.max(lcCum, platformCounts.leetcode) : lcCum;
      row.codeforces = idx === days.length - 1 ? Math.max(cfCum, platformCounts.codeforces) : cfCum;
      row.geeksforgeeks = idx === days.length - 1 ? Math.max(gfgCum, platformCounts.geeksforgeeks) : gfgCum;

      return row;
    });

    return { chartData: data, chartSeries: series };
  }, [submissions, platformCounts]);

  const isInitialLoading = dataLoading && submissions.length === 0;

  return (
    <div className="futuristic-problems-view">
      {/* ── Futuristic HUD Header ───────────────────────────────── */}
      <header className="problems-hud-header">
        <div className="hud-title-group">
          <div className="hud-status-badge">
            <span className="hud-pulse-dot" />
            <span className="hud-status-text">CROSS-PLATFORM DSA INDEX // SYNCED</span>
          </div>
          <h1 className="problems-title">Solved Problems Archive</h1>
          <p className="problems-subtitle">
            Search, filter, and inspect your unified algorithmic code solutions across LeetCode, Codeforces, and GeeksforGeeks.
          </p>
        </div>

        <button
          className="hud-chart-toggle-btn"
          onClick={() => setShowChart(!showChart)}
          title="Toggle futuristic analytics chart"
        >
          <SparklesIcon size={14} />
          <span>{showChart ? 'Hide Analytics Chart' : 'Show Analytics Chart'}</span>
        </button>
      </header>

      {/* ── Futuristic React Chart (Cross-Platform Analytics) ─── */}
      {showChart && submissions.length > 0 && (
        <section className="card futuristic-chart-card">
          <div className="chart-card-header">
            <div className="chart-header-title">
              <h3 className="chart-main-title">Cross-Platform Sync Velocity</h3>
              <span className="chart-sub-label">Multi-line progression across platforms over timeline</span>
            </div>
            <div className="hud-stats-pill-row">
              <span className="hud-metric-pill">
                <span className="metric-k">TOTAL:</span>
                <span className="metric-v">{submissions.length}</span>
              </span>
              <span className="hud-metric-pill leetcode">
                <span className="metric-k">LC:</span>
                <span className="metric-v">{platformCounts.leetcode}</span>
              </span>
              <span className="hud-metric-pill codeforces">
                <span className="metric-k">CF:</span>
                <span className="metric-v">{platformCounts.codeforces}</span>
              </span>
              <span className="hud-metric-pill gfg">
                <span className="metric-k">GFG:</span>
                <span className="metric-v">{platformCounts.geeksforgeeks}</span>
              </span>
            </div>
          </div>

          <MuiXLineChart
            dataset={chartData}
            series={chartSeries}
            xAxisKey="day"
            xAxisLabel="x-axis (Timeline)"
            yAxisLabel="Solutions"
            title="Cross-Platform Sync Velocity"
            subtitle="Multi-line chart comparison across LeetCode, Codeforces, and GeeksforGeeks"
            height={260}
          />
        </section>
      )}

      {/* ── Filter Bar & Controls (Cross-Platform & Languages) ──── */}
      <section className="card problems-filter-card">
        {/* Row 1: Search Bar & Platform Selector */}
        <div className="filter-controls-top">
          {/* Platform Segmented Switcher */}
          <div className="platform-segmented-tabs">
            <button
              className={`plat-tab-btn ${selectedPlatform === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedPlatform('all')}
            >
              <span>All Platforms</span>
              <span className="plat-tab-count">{platformCounts.all}</span>
            </button>
            <button
              className={`plat-tab-btn leetcode ${selectedPlatform === 'leetcode' ? 'active' : ''}`}
              onClick={() => setSelectedPlatform('leetcode')}
            >
              <span>LeetCode</span>
              <span className="plat-tab-count">{platformCounts.leetcode}</span>
            </button>
            <button
              className={`plat-tab-btn codeforces ${selectedPlatform === 'codeforces' ? 'active' : ''}`}
              onClick={() => setSelectedPlatform('codeforces')}
            >
              <span>Codeforces</span>
              <span className="plat-tab-count">{platformCounts.codeforces}</span>
            </button>
            <button
              className={`plat-tab-btn gfg ${selectedPlatform === 'geeksforgeeks' ? 'active' : ''}`}
              onClick={() => setSelectedPlatform('geeksforgeeks')}
            >
              <span>GeeksforGeeks</span>
              <span className="plat-tab-count">{platformCounts.geeksforgeeks}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="problems-search-box">
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder="Filter by problem name, concept, tag, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Language Filter Pills */}
        <div className="language-pills-row">
          <span className="lang-filter-label">Language:</span>
          <button
            className={`lang-filter-pill ${selectedLanguage === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('all')}
          >
            <span>All</span>
            <span className="lang-pill-count">{submissions.length}</span>
          </button>

          {languageBreakdown.map(([lang, count]) => {
            const isActive = selectedLanguage === lang.toLowerCase();
            return (
              <button
                key={lang}
                className={`lang-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang.toLowerCase())}
              >
                <span className="lang-color-dot" style={{ backgroundColor: getLangColor(lang) }} />
                <span>{lang}</span>
                <span className="lang-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Problems Stack & Expanded Details ─────────────────── */}
      <section className="problems-results-container">
        {/* Results Metadata Bar */}
        <div className="results-metadata-bar">
          <span className="results-count-text">
            Showing <strong>{filteredSubmissions.length}</strong> of {submissions.length} problem solutions
          </span>
          {(selectedPlatform !== 'all' || selectedLanguage !== 'all' || searchQuery) && (
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSelectedPlatform('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
            >
              Reset all filters
            </button>
          )}
        </div>

        {isInitialLoading ? (
          <div className="submissions-loader-box">
            <div className="svg-spinner" />
            <p>Decrypting solution records from GitHub...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="submissions-empty-state">
            <div className="empty-state-icon-box">
              <InboxIcon size={32} />
            </div>
            <h3 className="empty-state-title">No solutions match your active filters</h3>
            <p className="empty-state-text">
              {searchQuery || selectedPlatform !== 'all' || selectedLanguage !== 'all'
                ? 'Try adjusting your platform, language, or search parameters.'
                : 'Solve your first problem using the CodeStreak extension to see it recorded here.'}
            </p>
          </div>
        ) : (
          <div className="submissions-cards-stack">
            {filteredSubmissions.map((sub) => (
              <SubmissionCard
                key={sub._id}
                sub={sub}
                isExpanded={activeSubmission?._id === sub._id}
                onToggle={() =>
                  setActiveSubmission(activeSubmission?._id === sub._id ? null : sub)
                }
                user={user}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
