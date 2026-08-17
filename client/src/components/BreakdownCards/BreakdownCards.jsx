import { useState, useMemo } from 'react';
import './BreakdownCards.css';
import MuiXLineChart from '../Charts/MuiXLineChart';
import ConceptStackedBarChart from '../Charts/ConceptStackedBarChart';
import {
  aggregateConceptData,
  aggregatePlatformComparisonData,
  getPlatformFilterOptions,
  DIFFICULTY_CONFIG,
  PLATFORM_CONFIG,
  normalizePlatform,
} from '../../utils/conceptHelpers';
import { getLocalDateKey, formatTimeAgo, getPracticeUrl, getGithubReadmeUrl } from '../../utils/helpers';
import {
  CodeIcon,
  TagIcon,
  SearchIcon,
  SparklesIcon,
  ExternalLinkIcon,
  LayersIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  PlayIcon,
  GithubIcon,
} from '../icons/index.jsx';

export default function BreakdownCards({
  languageBreakdown = [],
  tagBreakdown = [],
  totalSolved = 0,
  submissions = [],
  user,
}) {
  // ── Tab Modes: 'stacked' (Difficulty Stack) | 'compare' (Compare by Platform) | 'languages' (Progression)
  const [activeViewMode, setActiveViewMode] = useState('stacked');

  // ── Filter & Search State
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('most-solved');
  const [limitOption, setLimitOption] = useState(12);

  // ── Selected Concept for Drill-Down Drawer
  const [inspectedConcept, setInspectedConcept] = useState(null);
  const [conceptProblemSearch, setConceptProblemSearch] = useState('');

  // Vibrant multi-line colors for language comparison
  const LINE_COLORS = ['#10b981', '#ef4444', '#38bdf8', '#f59e0b', '#a855f7', '#ffffff'];

  // ── 1. Platform Filter Options
  const platformOptions = useMemo(() => {
    return getPlatformFilterOptions(submissions);
  }, [submissions]);

  // ── 2. Aggregated Concept Stacked Data
  const {
    concepts: conceptStackList,
    totalFiltered,
    totalConceptsCount,
    overallStats,
  } = useMemo(() => {
    return aggregateConceptData({
      submissions,
      platformFilter: selectedPlatform,
      searchQuery,
      sortOption,
      limit: limitOption === 'all' ? 'all' : Number(limitOption),
    });
  }, [submissions, selectedPlatform, searchQuery, sortOption, limitOption]);

  // Set default inspected concept if none selected
  const activeInspectedData = useMemo(() => {
    if (!conceptStackList || conceptStackList.length === 0) return null;
    if (inspectedConcept) {
      const found = conceptStackList.find((c) => c.concept === inspectedConcept);
      if (found) return found;
    }
    return conceptStackList[0];
  }, [conceptStackList, inspectedConcept]);

  // Filtered submissions within inspected concept based on conceptProblemSearch
  const filteredInspectedSubmissions = useMemo(() => {
    if (!activeInspectedData?.submissions) return [];
    if (!conceptProblemSearch.trim()) return activeInspectedData.submissions;
    const q = conceptProblemSearch.toLowerCase().trim();
    return activeInspectedData.submissions.filter((sub) => {
      const title = (sub.title || '').toLowerCase();
      const lang = (sub.language || '').toLowerCase();
      const plat = (sub.platform || '').toLowerCase();
      const diff = (sub.derivedDifficulty || sub.difficulty || '').toLowerCase();
      return title.includes(q) || lang.includes(q) || plat.includes(q) || diff.includes(q);
    });
  }, [activeInspectedData, conceptProblemSearch]);

  // ── 3. Platform Comparison Data
  const {
    platformList,
    comparisonRows,
    platformSummaries,
  } = useMemo(() => {
    return aggregatePlatformComparisonData(submissions, searchQuery);
  }, [submissions, searchQuery]);

  // ── 4. Languages Timeline Data for MuiXLineChart
  const timelineDays = useMemo(() => {
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
    return days;
  }, []);

  const chartSeries = useMemo(() => {
    return languageBreakdown.map(([lang, totalCount], idx) => ({
      key: lang.toLowerCase(),
      label: lang,
      totalCount,
      color: LINE_COLORS[idx % LINE_COLORS.length],
    }));
  }, [languageBreakdown]);

  const chartData = useMemo(() => {
    if (!languageBreakdown || languageBreakdown.length === 0) return [];

    const runningTotals = {};
    languageBreakdown.forEach(([lang]) => {
      runningTotals[lang.toLowerCase()] = 0;
    });

    return timelineDays.map((day, idx) => {
      const row = { day: day.label, key: day.key };

      languageBreakdown.forEach(([lang, totalCount]) => {
        const langKey = lang.toLowerCase();
        const countOnDay = (submissions || []).filter((sub) => {
          const subLang = (sub.language || '').toLowerCase();
          const subDate = getLocalDateKey(new Date(sub.timestamp || sub.createdAt || Date.now()));
          return subDate === day.key && (subLang === langKey || subLang.includes(langKey));
        }).length;

        runningTotals[langKey] += countOnDay;
        let val = Math.min(runningTotals[langKey], totalCount);

        if (idx === timelineDays.length - 1 && val < totalCount) {
          val = totalCount;
        }

        row[langKey] = val;
      });

      return row;
    });
  }, [languageBreakdown, submissions, timelineDays]);

  return (
    <div className="concepts-view-container">
      {/* ── Header Row ─────────────────────────────────────────── */}
      <div className="concepts-header-row">
        <div className="concepts-header-left">
          <div className="concepts-badge-pill">
            <SparklesIcon size={13} />
            <span>ALGORITHMIC PARADIGMS & ARCHIVE</span>
          </div>
          <h1 className="concepts-main-title">Concepts & Problem Analytics</h1>
          <p className="concepts-main-subtitle">
            Stacked difficulty distribution, cross-platform comparative mastery, and language progression.
          </p>
        </div>

        {/* ── View Switcher Tabs ────────────────────────────────── */}
        <div className="concepts-view-switcher">
          <button
            type="button"
            className={`view-tab-btn ${activeViewMode === 'stacked' ? 'active' : ''}`}
            onClick={() => setActiveViewMode('stacked')}
          >
            <LayersIcon size={15} />
            <span>Stacked Difficulty</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${activeViewMode === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveViewMode('compare')}
          >
            <ShieldCheckIcon size={15} />
            <span>Compare by Platform</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${activeViewMode === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveViewMode('languages')}
          >
            <CodeIcon size={15} />
            <span>Language Timeline</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          VIEW 1: STACKED DIFFICULTY VIEW (Main Feature)
          ═══════════════════════════════════════════════════════════ */}
      {activeViewMode === 'stacked' && (
        <div className="stacked-analytics-layout">
          {/* Top Quick Stats Strip */}
          <div className="concept-stats-strip">
            <div className="concept-stat-box">
              <span className="c-stat-label">Total Concepts</span>
              <span className="c-stat-value">{totalConceptsCount}</span>
              <span className="c-stat-sub">across {selectedPlatform}</span>
            </div>

            <div className="concept-stat-box easy-box">
              <div className="c-stat-top">
                <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Easy.color }} />
                <span className="c-stat-label">Easy Solved</span>
              </div>
              <span className="c-stat-value" style={{ color: DIFFICULTY_CONFIG.Easy.color }}>
                {overallStats.easy}
              </span>
              <span className="c-stat-sub">
                {overallStats.total > 0 ? Math.round((overallStats.easy / overallStats.total) * 100) : 0}% of filtered
              </span>
            </div>

            <div className="concept-stat-box medium-box">
              <div className="c-stat-top">
                <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Medium.color }} />
                <span className="c-stat-label">Medium Solved</span>
              </div>
              <span className="c-stat-value" style={{ color: DIFFICULTY_CONFIG.Medium.color }}>
                {overallStats.medium}
              </span>
              <span className="c-stat-sub">
                {overallStats.total > 0 ? Math.round((overallStats.medium / overallStats.total) * 100) : 0}% of filtered
              </span>
            </div>

            <div className="concept-stat-box hard-box">
              <div className="c-stat-top">
                <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Hard.color }} />
                <span className="c-stat-label">Hard Solved</span>
              </div>
              <span className="c-stat-value" style={{ color: DIFFICULTY_CONFIG.Hard.color }}>
                {overallStats.hard}
              </span>
              <span className="c-stat-sub">
                {overallStats.total > 0 ? Math.round((overallStats.hard / overallStats.total) * 100) : 0}% of filtered
              </span>
            </div>
          </div>

          {/* Platform Filter Segmented Bar */}
          <div className="platform-filter-bar">
            <span className="filter-bar-label">Filter Platform:</span>
            <div className="platform-pills-list">
              {platformOptions.map((opt) => {
                const isActive = selectedPlatform === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`platform-filter-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform(opt.id)}
                  >
                    {opt.id !== 'All' && (
                      <span
                        className="plat-dot-indicator"
                        style={{ backgroundColor: PLATFORM_CONFIG[opt.id]?.color || '#a1a1aa' }}
                      />
                    )}
                    <span className="plat-name">{opt.name}</span>
                    <span className="plat-count-badge">{opt.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main Stacked Bar Chart Card ─────────────────────── */}
          <section className="card concept-stacked-card">
            <div className="stacked-card-header">
              <div className="card-title-wrap">
                <h3 className="section-title">Concept Mastery & Difficulty Stacks</h3>
                <p className="card-subtitle">
                  Bars represent problems solved per concept; stacked in 🟢 Easy (Green), 🟡 Medium (Yellow), and 🔴 Hard (Red).
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="chart-filter-controls">
                {/* Search Bar */}
                <div className="concept-search-input-wrap">
                  <SearchIcon size={14} />
                  <input
                    type="text"
                    placeholder="Search concept (e.g. DP, Tree)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="concept-search-field"
                  />
                  {searchQuery && (
                    <button
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <select
                  className="concept-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  aria-label="Sort Concepts By"
                >
                  <option value="most-solved">Sort: Most Solved</option>
                  <option value="hardest">Sort: Hardest Focus %</option>
                  <option value="easiest">Sort: Easiest Focus %</option>
                  <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
                </select>

                {/* Limit Dropdown */}
                <select
                  className="concept-limit-select"
                  value={limitOption}
                  onChange={(e) => setLimitOption(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  aria-label="Concepts Display Limit"
                >
                  <option value={8}>Show Top 8</option>
                  <option value={12}>Show Top 12</option>
                  <option value={16}>Show Top 16</option>
                  <option value="all">Show All</option>
                </select>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <ConceptStackedBarChart
              concepts={conceptStackList}
              platformFilter={selectedPlatform}
              selectedConcept={activeInspectedData?.concept}
              onSelectConcept={(conceptItem) => setInspectedConcept(conceptItem.concept)}
              height={360}
            />
          </section>

          {/* ── Two-Column Bottom Row: Topics Tag Cloud + Problem Inspector ── */}
          <div className="two-col-row">
            {/* Mastered Topics Cloud */}
            <section className="card tags-card">
              <div className="card-header-simple">
                <div className="header-with-badge">
                  <h3 className="section-title">Mastered Concepts Cloud</h3>
                  <span className="count-pill">{conceptStackList.length} Active</span>
                </div>
                <span className="header-sub-hint">Click topic to inspect</span>
              </div>

              {conceptStackList.length === 0 ? (
                <p className="empty-text">No concepts recorded yet for this filter</p>
              ) : (
                <div className="tags-cloud">
                  {conceptStackList.map((item) => {
                    const isSelected = activeInspectedData?.concept === item.concept;
                    return (
                      <button
                        key={item.concept}
                        type="button"
                        className={`topic-chip ${isSelected ? 'active-chip' : ''}`}
                        onClick={() => setInspectedConcept(item.concept)}
                      >
                        <span className="topic-name">{item.concept}</span>
                        <span className="topic-count">{item.total}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Drill-down Problem Inspector */}
            <section className="card drilldown-card">
              <div className="card-header-simple inspector-header-wrap">
                <div className="header-with-badge">
                  <h3 className="section-title">
                    {activeInspectedData ? activeInspectedData.concept : 'Concept Inspector'}
                  </h3>
                  {activeInspectedData && (
                    <span className="count-pill">
                      {conceptProblemSearch.trim()
                        ? `${filteredInspectedSubmissions.length} of ${activeInspectedData.total} Solved`
                        : `${activeInspectedData.total} Solved`}
                    </span>
                  )}
                </div>

                {/* Top Right Problem Search Input */}
                {activeInspectedData && (
                  <div className="insp-search-box">
                    <SearchIcon size={12} className="insp-search-icon" />
                    <input
                      type="text"
                      className="insp-search-input"
                      placeholder={`Search ${activeInspectedData.concept} problems...`}
                      value={conceptProblemSearch}
                      onChange={(e) => setConceptProblemSearch(e.target.value)}
                    />
                    {conceptProblemSearch && (
                      <button
                        type="button"
                        className="insp-search-clear"
                        onClick={() => setConceptProblemSearch('')}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!activeInspectedData ? (
                <p className="empty-text">Select a concept from the chart or tag cloud to inspect solutions</p>
              ) : (
                <div className="drilldown-content">
                  {/* Difficulty Breakdown Pill Bar */}
                  <div className="inspector-diff-pills">
                    <span className="insp-pill easy">
                      <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Easy.color }} />
                      Easy: {activeInspectedData.easy} ({activeInspectedData.easyPct}%)
                    </span>
                    <span className="insp-pill medium">
                      <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Medium.color }} />
                      Medium: {activeInspectedData.medium} ({activeInspectedData.mediumPct}%)
                    </span>
                    <span className="insp-pill hard">
                      <span className="diff-dot-sm" style={{ backgroundColor: DIFFICULTY_CONFIG.Hard.color }} />
                      Hard: {activeInspectedData.hard} ({activeInspectedData.hardPct}%)
                    </span>
                  </div>

                  {/* Submissions List for this Concept */}
                  <div className="inspector-problems-list">
                    {filteredInspectedSubmissions.length === 0 ? (
                      <div className="insp-empty-search-state">
                        <p className="insp-empty-search-msg">
                          No problems found matching "<strong>{conceptProblemSearch}</strong>"
                        </p>
                        <button
                          type="button"
                          className="insp-clear-search-btn"
                          onClick={() => setConceptProblemSearch('')}
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      filteredInspectedSubmissions.map((sub, idx) => {
                        const diff = sub.derivedDifficulty || 'Medium';
                        const diffConfig = DIFFICULTY_CONFIG[diff];
                        const plat = normalizePlatform(sub.platform);
                        const platConfig = PLATFORM_CONFIG[plat];

                        return (
                          <div key={sub._id || idx} className="inspector-problem-row">
                            <div className="insp-left">
                              <span
                                className={`insp-diff-badge ${diffConfig.badgeClass}`}
                                style={{ color: diffConfig.color, borderColor: diffConfig.border }}
                              >
                                {diff}
                              </span>
                              <div className="insp-title-wrap">
                                <span className="insp-problem-title">{sub.title}</span>
                                <div className="insp-sub-meta">
                                  <span className="insp-plat-badge" style={{ color: platConfig?.color || '#a1a1aa' }}>
                                    {plat}
                                  </span>
                                  <span className="meta-sep">•</span>
                                  <span className="insp-lang">{sub.language || 'Code'}</span>
                                  {sub.runtime && (
                                    <>
                                      <span className="meta-sep">•</span>
                                      <span className="insp-runtime">{sub.runtime}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="insp-right">
                              {/* 1. Practice Button */}
                              <a
                                href={getPracticeUrl(sub)}
                                target="_blank"
                                rel="noreferrer"
                                className="insp-link-btn insp-btn-practice"
                                title={`Practice ${sub.title} on ${plat}`}
                              >
                                <PlayIcon size={10} />
                                <span>Practice</span>
                                <ExternalLinkIcon size={10} />
                              </a>

                              {/* 2. GitHub Notes Button */}
                              {(getGithubReadmeUrl(sub, user) || sub.github_readme_url) && (
                                <a
                                  href={getGithubReadmeUrl(sub, user) || sub.github_readme_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="insp-link-btn insp-btn-notes"
                                  title="View README notes on GitHub"
                                >
                                  <BookOpenIcon size={11} />
                                  <span>Notes</span>
                                  <ExternalLinkIcon size={10} />
                                </a>
                              )}

                              {/* 3. GitHub Code Button */}
                              {sub.github_solution_url && (
                                <a
                                  href={sub.github_solution_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="insp-link-btn insp-btn-code"
                                  title="View solution source on GitHub"
                                >
                                  <GithubIcon size={11} />
                                  <span>Code</span>
                                  <ExternalLinkIcon size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          VIEW 2: COMPARE BY PLATFORM VIEW (User Requirement)
          ═══════════════════════════════════════════════════════════ */}
      {activeViewMode === 'compare' && (
        <div className="compare-analytics-layout">
          {/* Platform Summary Mastery Cards */}
          <div className="platform-summary-cards-grid">
            {platformList.map((plat) => {
              const pData = platformSummaries[plat];
              if (!pData) return null;
              const easyPct = pData.totalSolved > 0 ? Math.round((pData.easy / pData.totalSolved) * 100) : 0;
              const medPct = pData.totalSolved > 0 ? Math.round((pData.medium / pData.totalSolved) * 100) : 0;
              const hardPct = pData.totalSolved > 0 ? Math.max(0, 100 - easyPct - medPct) : 0;

              return (
                <div key={plat} className="card platform-summary-card">
                  <div className="plat-card-header">
                    <div className="plat-brand-title">
                      <span className="plat-dot-lg" style={{ backgroundColor: pData.color }} />
                      <h4 className="plat-name-title">{plat}</h4>
                    </div>
                    <span className="plat-solved-pill">{pData.totalSolved} Solved</span>
                  </div>

                  <div className="plat-metrics-row">
                    <div className="plat-metric-item">
                      <span className="p-metric-val">{pData.uniqueConcepts}</span>
                      <span className="p-metric-lbl">Concepts Covered</span>
                    </div>
                    <div className="plat-metric-item">
                      <span className="p-metric-val" style={{ color: DIFFICULTY_CONFIG.Hard.color }}>
                        {pData.hard}
                      </span>
                      <span className="p-metric-lbl">Hard Solved</span>
                    </div>
                  </div>

                  {/* Multi-Segment Stacked Progress Bar */}
                  <div className="plat-stacked-progress-wrap">
                    <div className="plat-stacked-track">
                      {pData.easy > 0 && (
                        <div
                          className="plat-seg-fill easy"
                          style={{ width: `${easyPct}%`, backgroundColor: DIFFICULTY_CONFIG.Easy.color }}
                          title={`Easy: ${pData.easy} (${easyPct}%)`}
                        />
                      )}
                      {pData.medium > 0 && (
                        <div
                          className="plat-seg-fill med"
                          style={{ width: `${medPct}%`, backgroundColor: DIFFICULTY_CONFIG.Medium.color }}
                          title={`Medium: ${pData.medium} (${medPct}%)`}
                        />
                      )}
                      {pData.hard > 0 && (
                        <div
                          className="plat-seg-fill hard"
                          style={{ width: `${hardPct}%`, backgroundColor: DIFFICULTY_CONFIG.Hard.color }}
                          title={`Hard: ${pData.hard} (${hardPct}%)`}
                        />
                      )}
                    </div>
                    <div className="plat-progress-legend">
                      <span>Easy: {pData.easy}</span>
                      <span>Med: {pData.medium}</span>
                      <span>Hard: {pData.hard}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cross-Platform Concept Comparison Matrix */}
          <section className="card compare-matrix-card">
            <div className="card-header-simple">
              <div>
                <h3 className="section-title">Cross-Platform Concept Comparison Matrix</h3>
                <p className="card-subtitle">
                  Compare how each algorithmic concept is practiced and mastered across LeetCode, GeeksforGeeks, Codeforces, etc.
                </p>
              </div>
            </div>

            {comparisonRows.length === 0 ? (
              <p className="empty-text">No concepts available for cross-platform comparison</p>
            ) : (
              <div className="compare-matrix-table-wrap">
                <table className="compare-matrix-table">
                  <thead>
                    <tr>
                      <th className="th-concept">Concept / Paradigm</th>
                      <th className="th-total">Total Solved</th>
                      {platformList.map((plat) => (
                        <th key={plat} className="th-plat">
                          <span
                            className="plat-header-dot"
                            style={{ backgroundColor: PLATFORM_CONFIG[plat]?.color || '#a1a1aa' }}
                          />
                          {plat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      return (
                        <tr key={row.concept} className="compare-row">
                          {/* Concept Name */}
                          <td className="cell-matrix-concept">
                            <span className="matrix-concept-name">{row.concept}</span>
                          </td>

                          {/* Total Solved Badge */}
                          <td className="cell-matrix-total">
                            <span className="matrix-total-badge">{row.total}</span>
                          </td>

                          {/* Platform Columns */}
                          {platformList.map((plat) => {
                            const platData = row.byPlatform[plat];
                            if (!platData || platData.total === 0) {
                              return (
                                <td key={plat} className="cell-matrix-plat empty">
                                  <span className="matrix-dash">—</span>
                                </td>
                              );
                            }

                            const pTotal = platData.total;
                            return (
                              <td key={plat} className="cell-matrix-plat">
                                <div className="matrix-plat-cell-wrap">
                                  <span className="plat-cell-count">{pTotal}</span>
                                  {/* Mini 3-Color Difficulty Stack Dots */}
                                  <div className="matrix-mini-diff-stack">
                                    {platData.easy > 0 && (
                                      <span
                                        className="mini-diff-dot"
                                        style={{ backgroundColor: DIFFICULTY_CONFIG.Easy.color }}
                                        title={`${platData.easy} Easy`}
                                      />
                                    )}
                                    {platData.medium > 0 && (
                                      <span
                                        className="mini-diff-dot"
                                        style={{ backgroundColor: DIFFICULTY_CONFIG.Medium.color }}
                                        title={`${platData.medium} Medium`}
                                      />
                                    )}
                                    {platData.hard > 0 && (
                                      <span
                                        className="mini-diff-dot"
                                        style={{ backgroundColor: DIFFICULTY_CONFIG.Hard.color }}
                                        title={`${platData.hard} Hard`}
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          VIEW 3: LANGUAGE PROGRESSION VIEW (Preserved & Elevated)
          ═══════════════════════════════════════════════════════════ */}
      {activeViewMode === 'languages' && (
        <div className="languages-view-layout">
          {/* Full-Width MUI X-Charts Line Overview Card */}
          <section className="card lang-graph-card">
            {languageBreakdown.length === 0 ? (
              <div className="graph-empty-state">
                <CodeIcon size={32} />
                <p>No language solutions recorded yet. Solve problems to plot your multi-line chart.</p>
              </div>
            ) : (
              <MuiXLineChart
                dataset={chartData}
                series={chartSeries}
                xAxisKey="day"
                xAxisLabel="x-axis (Timeline)"
                yAxisLabel="Solutions Solved"
                title="Language Solutions Progression"
                subtitle="Multi-line chart comparison with interactive Language Peek on right"
                height={300}
              />
            )}
          </section>

          {/* Language Summary List */}
          <section className="card lang-breakdown-card">
            <div className="card-header-simple">
              <h3 className="section-title">Language Summary</h3>
              <span className="count-pill">{languageBreakdown.length} Languages</span>
            </div>

            {languageBreakdown.length === 0 ? (
              <p className="empty-text">No languages recorded yet</p>
            ) : (
              <div className="lang-list">
                {languageBreakdown.map(([lang, count], idx) => {
                  const color = LINE_COLORS[idx % LINE_COLORS.length];
                  const pct = totalSolved > 0 ? Math.round((count / totalSolved) * 100) : 0;
                  return (
                    <div key={lang} className="lang-row">
                      <div className="lang-info">
                        <span className="lang-dot" style={{ background: color }} />
                        <span className="lang-name">{lang}</span>
                        <span className="lang-count">{count} solved ({pct}%)</span>
                      </div>
                      <div className="lang-bar-track">
                        <div
                          className="lang-bar-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
