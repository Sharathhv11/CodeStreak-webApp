import { useState, useMemo, useRef, useId } from 'react';
import './ConceptStackedBarChart.css';
import { DIFFICULTY_CONFIG, PLATFORM_CONFIG } from '../../utils/conceptHelpers';
import { TagIcon, SparklesIcon, TrophyIcon } from '../icons/index.jsx';

/**
 * ConceptStackedBarChart — High-Performance Futuristic Stacked Bar Chart
 * 
 * Features:
 * - Stacked bars showing Easy (Green #10b981), Medium (Yellow #f59e0b), and Hard (Red #ef4444)
 * - 100% responsive SVG layout with smooth dynamic scaling
 * - Dual Display Modes: 'Absolute Counts' and '100% Proportional Stack'
 * - Interactive hover tooltip with glassmorphism, exact metrics, percentages & platform tags
 * - Click-to-inspect bar interactivity
 * - Legend with toggleable visibility for difficulty levels
 */
export default function ConceptStackedBarChart({
  concepts = [],
  platformFilter = 'All',
  onSelectConcept,
  selectedConcept = null,
  height = 360,
}) {
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stackMode, setStackMode] = useState('count'); // 'count' | 'percentage'
  const [hiddenDifficulties, setHiddenDifficulties] = useState(new Set());

  const clipId = useId();

  // Active difficulty layers
  const activeDifficulties = useMemo(() => {
    return ['Easy', 'Medium', 'Hard'].filter((d) => !hiddenDifficulties.has(d));
  }, [hiddenDifficulties]);

  // Compute maximum stack value for Y-axis scaling
  const maxY = useMemo(() => {
    if (stackMode === 'percentage') return 100;
    if (!concepts || concepts.length === 0) return 10;

    let max = 0;
    concepts.forEach((c) => {
      let sum = 0;
      if (activeDifficulties.includes('Easy')) sum += c.easy || 0;
      if (activeDifficulties.includes('Medium')) sum += c.medium || 0;
      if (activeDifficulties.includes('Hard')) sum += c.hard || 0;
      if (sum > max) max = sum;
    });

    if (max <= 5) return 5;
    if (max <= 10) return 10;
    if (max <= 20) return Math.ceil(max * 1.25);
    return Math.ceil((max * 1.2) / 5) * 5;
  }, [concepts, stackMode, activeDifficulties]);

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    if (stackMode === 'percentage') {
      return [0, 25, 50, 75, 100];
    }
    const step = Math.max(Math.ceil(maxY / 4), 1);
    const ticks = [];
    for (let v = 0; v <= maxY; v += step) {
      ticks.push(v);
    }
    if (!ticks.includes(maxY)) ticks.push(maxY);
    return ticks;
  }, [maxY, stackMode]);

  // SVG Dimension Layout
  const SVG_WIDTH = 760;
  const SVG_HEIGHT = height;
  const PAD_LEFT = 48;
  const PAD_RIGHT = 24;
  const PAD_TOP = 32;
  const PAD_BOTTOM = 64;

  const PLOT_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const PLOT_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const barCount = concepts.length;
  const slotWidth = barCount > 0 ? PLOT_W / barCount : PLOT_W;
  const barWidth = Math.min(Math.max(slotWidth * 0.58, 16), 46);

  // Toggle difficulty visibility in legend
  const toggleDifficulty = (diff) => {
    setHiddenDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        if (next.size < 2) next.add(diff);
      }
      return next;
    });
  };

  // Track mouse coordinates for tooltip positioning
  const handleMouseMove = (e, index) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Helper to calculate segment heights
  const getBarSegments = (item) => {
    const rawEasy = activeDifficulties.includes('Easy') ? item.easy || 0 : 0;
    const rawMed = activeDifficulties.includes('Medium') ? item.medium || 0 : 0;
    const rawHard = activeDifficulties.includes('Hard') ? item.hard || 0 : 0;
    const rawTotal = rawEasy + rawMed + rawHard;

    if (rawTotal === 0) return { easyH: 0, medH: 0, hardH: 0, totalH: 0 };

    if (stackMode === 'percentage') {
      const easyPct = (rawEasy / rawTotal) * 100;
      const medPct = (rawMed / rawTotal) * 100;
      const hardPct = (rawHard / rawTotal) * 100;

      const easyH = (easyPct / 100) * PLOT_H;
      const medH = (medPct / 100) * PLOT_H;
      const hardH = (hardPct / 100) * PLOT_H;
      return { easyH, medH, hardH, totalH: PLOT_H };
    }

    const easyH = (rawEasy / maxY) * PLOT_H;
    const medH = (rawMed / maxY) * PLOT_H;
    const hardH = (rawHard / maxY) * PLOT_H;
    const totalH = (rawTotal / maxY) * PLOT_H;

    return { easyH, medH, hardH, totalH };
  };

  if (!concepts || concepts.length === 0) {
    return (
      <div className="concept-chart-empty">
        <div className="empty-chart-icon">
          <TagIcon size={28} />
        </div>
        <h4 className="empty-chart-title">No Concept Data Available</h4>
        <p className="empty-chart-desc">
          {platformFilter !== 'All'
            ? `No problems solved under the ${platformFilter} platform match your query.`
            : 'Solve problems across different algorithmic paradigms to populate your stacked mastery chart.'}
        </p>
      </div>
    );
  }

  const activeItem = hoveredIndex !== null ? concepts[hoveredIndex] : null;

  return (
    <div className="concept-stacked-chart-container" ref={containerRef}>
      {/* ── Chart Controls Bar ──────────────────────────────────── */}
      <div className="chart-controls-bar">
        {/* Left: Legend with interactive visibility toggles */}
        <div className="chart-legend-wrap">
          <span className="legend-hint-label">Difficulty Stack:</span>
          {['Easy', 'Medium', 'Hard'].map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            const isHidden = hiddenDifficulties.has(diff);
            return (
              <button
                key={diff}
                type="button"
                className={`chart-legend-pill ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleDifficulty(diff)}
                title={`Click to ${isHidden ? 'show' : 'hide'} ${diff} problems`}
              >
                <span
                  className="legend-color-dot"
                  style={{
                    backgroundColor: config.color,
                    boxShadow: isHidden ? 'none' : `0 0 8px ${config.color}66`,
                  }}
                />
                <span className="legend-name">{config.label}</span>
                {isHidden && <span className="legend-crossed">✕</span>}
              </button>
            );
          })}
        </div>

        {/* Right: Stack Mode Toggle */}
        <div className="chart-mode-segmented">
          <button
            type="button"
            className={`mode-pill ${stackMode === 'count' ? 'active' : ''}`}
            onClick={() => setStackMode('count')}
            title="Display absolute number of solved problems"
          >
            Problems Solved
          </button>
          <button
            type="button"
            className={`mode-pill ${stackMode === 'percentage' ? 'active' : ''}`}
            onClick={() => setStackMode('percentage')}
            title="Display 100% normalized difficulty distribution"
          >
            100% Difficulty %
          </button>
        </div>
      </div>

      {/* ── Main SVG Graphic Area ──────────────────────────────── */}
      <div className="svg-responsive-box">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="concept-stacked-svg"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradients for glowing stacked bars */}
            <linearGradient id="grad-easy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="grad-medium" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="grad-hard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="bar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* ── Horizontal Grid Lines & Y-Axis Labels ── */}
          <g className="grid-group">
            {yTicks.map((tickVal) => {
              const yPos = PAD_TOP + PLOT_H - (tickVal / maxY) * PLOT_H;
              return (
                <g key={tickVal} className="grid-row">
                  <line
                    x1={PAD_LEFT}
                    y1={yPos}
                    x2={SVG_WIDTH - PAD_RIGHT}
                    y2={yPos}
                    className={`grid-line ${tickVal === 0 ? 'baseline' : ''}`}
                  />
                  <text
                    x={PAD_LEFT - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    className="axis-label y-axis-label"
                  >
                    {tickVal}
                    {stackMode === 'percentage' ? '%' : ''}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── Stacked Bars Columns ── */}
          <g className="bars-group">
            {concepts.map((item, idx) => {
              const slotX = PAD_LEFT + idx * slotWidth;
              const barX = slotX + (slotWidth - barWidth) / 2;
              const isHovered = hoveredIndex === idx;
              const isSelected = selectedConcept === item.concept;

              const { easyH, medH, hardH, totalH } = getBarSegments(item);

              // Stacking from bottom to top: Easy -> Medium -> Hard
              const baseY = PAD_TOP + PLOT_H;
              const easyY = baseY - easyH;
              const medY = easyY - medH;
              const hardY = medY - hardH;

              // Determine topmost visible segment for rounded cap
              let topCapRadius = 4;

              return (
                <g
                  key={item.concept}
                  className={`bar-column-group ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectConcept && onSelectConcept(item)}
                  onMouseMove={(e) => handleMouseMove(e, idx)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hover Backdrop Beam */}
                  <rect
                    x={slotX + 2}
                    y={PAD_TOP - 6}
                    width={slotWidth - 4}
                    height={PLOT_H + 12}
                    className="bar-backdrop-beam"
                    rx={6}
                  />

                  {/* Top Total Value Label on Bar */}
                  {totalH > 0 && (
                    <text
                      x={barX + barWidth / 2}
                      y={baseY - totalH - 7}
                      textAnchor="middle"
                      className={`bar-total-label ${isHovered ? 'active' : ''}`}
                    >
                      {stackMode === 'percentage' ? `${item.total}` : item.total}
                    </text>
                  )}

                  {/* 1. Easy Segment (Bottom - Green) */}
                  {easyH > 0 && (
                    <rect
                      x={barX}
                      y={easyY}
                      width={barWidth}
                      height={easyH}
                      fill="url(#grad-easy)"
                      className="bar-segment easy-segment"
                      rx={medH === 0 && hardH === 0 ? topCapRadius : 0}
                    />
                  )}

                  {/* 2. Medium Segment (Middle - Yellow) */}
                  {medH > 0 && (
                    <rect
                      x={barX}
                      y={medY}
                      width={barWidth}
                      height={medH}
                      fill="url(#grad-medium)"
                      className="bar-segment medium-segment"
                      rx={hardH === 0 ? topCapRadius : 0}
                    />
                  )}

                  {/* 3. Hard Segment (Top - Red) */}
                  {hardH > 0 && (
                    <rect
                      x={barX}
                      y={hardY}
                      width={barWidth}
                      height={hardH}
                      fill="url(#grad-hard)"
                      className="bar-segment hard-segment"
                      rx={topCapRadius}
                    />
                  )}

                  {/* Subtle Bar Outline for Definition */}
                  {totalH > 0 && (
                    <rect
                      x={barX}
                      y={baseY - totalH}
                      width={barWidth}
                      height={totalH}
                      fill="none"
                      stroke={isHovered || isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={isHovered || isSelected ? 1.5 : 1}
                      rx={topCapRadius}
                      className="bar-contour"
                    />
                  )}

                  {/* X-Axis Concept Label */}
                  <text
                    x={barX + barWidth / 2}
                    y={PAD_TOP + PLOT_H + 18}
                    textAnchor="middle"
                    className={`axis-label x-concept-label ${isHovered ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                  >
                    {item.concept.length > 11 ? `${item.concept.slice(0, 10)}…` : item.concept}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Baseline */}
          <line
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={SVG_WIDTH - PAD_RIGHT}
            y2={PAD_TOP + PLOT_H}
            className="axis-baseline"
          />
        </svg>

        {/* ── Interactive Floating Tooltip ─────────────────────── */}
        {activeItem && (
          <div
            className="concept-chart-tooltip"
            style={{
              left: `${Math.min(Math.max(mousePos.x, 140), containerRef.current?.offsetWidth - 180 || 500)}px`,
              top: `${Math.max(mousePos.y - 12, 10)}px`,
            }}
          >
            <div className="tooltip-header">
              <div className="tooltip-title-wrap">
                <span className="tooltip-concept-title">{activeItem.concept}</span>
                <span className="tooltip-total-badge">{activeItem.total} Solved</span>
              </div>
            </div>

            {/* 3-Difficulty Stacking Breakdown Rows */}
            <div className="tooltip-breakdown-list">
              <div className="tooltip-diff-row">
                <div className="diff-left">
                  <span className="diff-indicator" style={{ backgroundColor: DIFFICULTY_CONFIG.Easy.color }} />
                  <span className="diff-title">Easy</span>
                </div>
                <div className="diff-right">
                  <span className="diff-count">{activeItem.easy}</span>
                  <span className="diff-pct">({activeItem.easyPct}%)</span>
                </div>
              </div>

              <div className="tooltip-diff-row">
                <div className="diff-left">
                  <span className="diff-indicator" style={{ backgroundColor: DIFFICULTY_CONFIG.Medium.color }} />
                  <span className="diff-title">Medium</span>
                </div>
                <div className="diff-right">
                  <span className="diff-count">{activeItem.medium}</span>
                  <span className="diff-pct">({activeItem.mediumPct}%)</span>
                </div>
              </div>

              <div className="tooltip-diff-row">
                <div className="diff-left">
                  <span className="diff-indicator" style={{ backgroundColor: DIFFICULTY_CONFIG.Hard.color }} />
                  <span className="diff-title">Hard</span>
                </div>
                <div className="diff-right">
                  <span className="diff-count">{activeItem.hard}</span>
                  <span className="diff-pct">({activeItem.hardPct}%)</span>
                </div>
              </div>
            </div>

            {/* Platform Distribution for this concept */}
            {Object.keys(activeItem.platforms || {}).length > 0 && (
              <div className="tooltip-platforms-row">
                <span className="tooltip-sub-label">Platforms:</span>
                <div className="tooltip-plat-chips">
                  {Object.entries(activeItem.platforms).map(([plat, count]) => (
                    <span key={plat} className="tooltip-plat-tag">
                      <span
                        className="plat-dot-sm"
                        style={{ backgroundColor: PLATFORM_CONFIG[plat]?.color || '#a1a1aa' }}
                      />
                      {plat}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="tooltip-footer-hint">
              <span>Click bar to inspect solved problems</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
