import { useState, useMemo, useRef, useId } from 'react';
import './MuiXLineChart.css';

/**
 * MuiXLineChart — MUI X-Charts Pro Specification Implementation
 * Features:
 * - Full 100% width responsive ChartsSurface
 * - Horizontal ChartsGrid lines & ChartsAxisHighlight vertical cursor
 * - Smooth bezier LinePlot curves with area under-fill
 * - ChartsZoomSlider (Time window range selector: 7D, 14D, 30D, All)
 * - Milestone / Streak Shaded Bands (MUI RecessionBands pattern)
 * - Rich elevated ChartsTooltip
 * - Language Peek Panel docked on the right side of the graph
 */
export default function MuiXLineChart({
  dataset = [],
  series = [],
  xAxisKey = 'date',
  xAxisLabel = 'Timeline',
  yAxisLabel = 'Solutions Solved',
  title = 'Languages Practice Velocity & Progression',
  subtitle = 'Multi-line progression across practice history with interactive language peek',
  height = 320,
  bands = [],
}) {
  const clipPathId = useId();
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [timeRange, setTimeRange] = useState('all'); // '7d', '14d', '30d', 'all'

  // Filter dataset based on time range slider
  const filteredData = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];
    if (timeRange === '7d') return dataset.slice(-7);
    if (timeRange === '14d') return dataset.slice(-14);
    if (timeRange === '30d') return dataset.slice(-30);
    return dataset;
  }, [dataset, timeRange]);

  // Active series
  const activeSeries = useMemo(() => {
    return series.filter((s) => !hiddenSeries.has(s.key));
  }, [series, hiddenSeries]);

  // Total count across all languages
  const totalCount = useMemo(() => {
    return series.reduce((sum, s) => sum + (s.totalCount || 0), 0);
  }, [series]);

  // Compute maximum Y value
  const maxY = useMemo(() => {
    let max = 2;
    filteredData.forEach((row) => {
      activeSeries.forEach((s) => {
        const val = Number(row[s.key]) || 0;
        if (val > max) max = val;
      });
    });
    return Math.max(Math.ceil(max * 1.3), 3);
  }, [filteredData, activeSeries]);

  // Dimensions
  const SVG_WIDTH = 680;
  const SVG_HEIGHT = height;
  const PAD_LEFT = 50;
  const PAD_RIGHT = 30;
  const PAD_TOP = 36;
  const PAD_BOTTOM = 46;

  const PLOT_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const PLOT_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Coordinate projections
  const getX = (idx) => {
    if (filteredData.length <= 1) return PAD_LEFT + PLOT_W / 2;
    return PAD_LEFT + (idx / (filteredData.length - 1)) * PLOT_W;
  };

  const getY = (val) => {
    return PAD_TOP + PLOT_H - (val / maxY) * PLOT_H;
  };

  // Generate smooth cubic bezier SVG path from coordinates
  const getSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  };

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const step = Math.max(Math.ceil(maxY / 4), 1);
    const ticks = [];
    for (let v = 0; v <= maxY; v += step) {
      ticks.push(v);
    }
    if (!ticks.includes(maxY)) ticks.push(maxY);
    return ticks;
  }, [maxY]);

  // Toggle series visibility
  const toggleSeries = (key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < series.length - 1) next.add(key);
      return next;
    });
  };

  // Mouse movement on chart surface for highlight crosshair
  const handleMouseMove = (e) => {
    if (!containerRef.current || filteredData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * SVG_WIDTH;

    let closestIdx = 0;
    let minDiff = Infinity;
    filteredData.forEach((_, idx) => {
      const diff = Math.abs(getX(idx) - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const hoveredData = hoverIndex !== null && hoverIndex < filteredData.length ? filteredData[hoverIndex] : null;

  return (
    <div className="mui-charts-pro-container">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="mui-chart-header">
        <div className="mui-chart-title-wrap">
          <h3 className="mui-chart-title">{title}</h3>
          <p className="mui-chart-subtitle">{subtitle}</p>
        </div>

        {/* ChartsZoomSlider Range Controls */}
        <div className="mui-zoom-slider-pills">
          <span className="zoom-slider-label">Range:</span>
          {[
            { id: '7d', label: '7D' },
            { id: '14d', label: '14D' },
            { id: '30d', label: '30D' },
            { id: 'all', label: 'ALL' },
          ].map((r) => (
            <button
              key={r.id}
              className={`mui-zoom-pill ${timeRange === r.id ? 'active' : ''}`}
              onClick={() => setTimeRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Two-Column Layout: (Left: Full Chart Surface | Right: Language Peek) ── */}
      <div className="mui-chart-main-grid">
        {/* Left (75%): Full Width ChartsSurface */}
        <div
          className="mui-charts-surface-wrap"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="mui-charts-surface"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id={clipPathId}>
                <rect x={PAD_LEFT} y={PAD_TOP - 10} width={PLOT_W} height={PLOT_H + 10} />
              </clipPath>

              {/* Gradient fills for each series */}
              {series.map((s) => (
                <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Shaded Milestone / Streak Bands (MUI RecessionBands pattern) */}
            {bands.map((band, bIdx) => {
              const xStart = getX(band.startIdx || 0);
              const xEnd = getX(band.endIdx || filteredData.length - 1);
              return (
                <g key={bIdx} className="mui-milestone-band">
                  <rect
                    x={xStart}
                    y={PAD_TOP}
                    width={Math.max(xEnd - xStart, 1)}
                    height={PLOT_H}
                    fill="rgba(255, 255, 255, 0.04)"
                  />
                  {band.label && (
                    <text
                      x={xStart + 6}
                      y={PAD_TOP + 14}
                      fill="rgba(255, 255, 255, 0.5)"
                      fontSize="10"
                      fontFamily="var(--mono)"
                    >
                      {band.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ChartsGrid (Horizontal Gridlines) */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <g key={tick} className="mui-grid-line-group">
                  <line
                    x1={PAD_LEFT}
                    y1={yPos}
                    x2={SVG_WIDTH - PAD_RIGHT}
                    y2={yPos}
                    className="mui-charts-grid-line"
                  />
                  <text
                    x={PAD_LEFT - 12}
                    y={yPos + 4}
                    textAnchor="end"
                    className="mui-axis-tick-text"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* ChartsXAxis Tick Labels */}
            {filteredData.map((row, idx) => {
              const xPos = getX(idx);
              return (
                <g key={row[xAxisKey] || idx} className="mui-x-tick-group">
                  <line
                    x1={xPos}
                    y1={PAD_TOP + PLOT_H}
                    x2={xPos}
                    y2={PAD_TOP + PLOT_H + 5}
                    className="mui-axis-tick-mark"
                  />
                  <text
                    x={xPos}
                    y={PAD_TOP + PLOT_H + 20}
                    textAnchor="middle"
                    className="mui-axis-tick-text x-text"
                  >
                    {row[xAxisKey]}
                  </text>
                </g>
              );
            })}

            {/* Main Axis Borders */}
            <line
              x1={PAD_LEFT}
              y1={PAD_TOP + PLOT_H}
              x2={SVG_WIDTH - PAD_RIGHT}
              y2={PAD_TOP + PLOT_H}
              className="mui-axis-baseline"
            />

            {/* Y-Axis Label */}
            <text x={PAD_LEFT} y={PAD_TOP - 16} textAnchor="start" className="mui-axis-title">
              {yAxisLabel}
            </text>

            {/* ChartsAxisHighlight (Vertical Line & Highlight Band on Hover) */}
            {hoverIndex !== null && (
              <g className="mui-axis-highlight-group">
                <rect
                  x={getX(hoverIndex) - 12}
                  y={PAD_TOP}
                  width={24}
                  height={PLOT_H}
                  fill="rgba(255, 255, 255, 0.03)"
                />
                <line
                  x1={getX(hoverIndex)}
                  y1={PAD_TOP}
                  x2={getX(hoverIndex)}
                  y2={PAD_TOP + PLOT_H}
                  className="mui-axis-highlight-line"
                />
              </g>
            )}

            {/* LinePlot Curves and Gradient Area Fills */}
            <g clipPath={`url(#${clipPathId})`}>
              {activeSeries.map((s) => {
                const points = filteredData.map((row, idx) => ({
                  x: getX(idx),
                  y: getY(Number(row[s.key]) || 0),
                }));

                const curvePath = getSmoothPath(points);
                const areaPath = `${curvePath} L ${points[points.length - 1].x},${PAD_TOP + PLOT_H} L ${points[0].x},${PAD_TOP + PLOT_H} Z`;

                return (
                  <g key={s.key} className="mui-series-group">
                    {/* Area Under-Fill */}
                    <path d={areaPath} fill={`url(#grad-${s.key})`} className="mui-area-fill" />

                    {/* Main Line Stroke */}
                    <path
                      d={curvePath}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mui-line-stroke"
                    />

                    {/* Data Points */}
                    {points.map((p, idx) => {
                      const isHovered = hoverIndex === idx;
                      return (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill={s.color}
                          stroke="#000000"
                          strokeWidth="2"
                          className={`mui-data-point ${isHovered ? 'hovered' : ''}`}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* ChartsTooltip (MUI Elevated Floating Paper) */}
          {hoverIndex !== null && hoveredData && (
            <div
              className="mui-charts-tooltip"
              style={{
                left: `${(getX(hoverIndex) / SVG_WIDTH) * 100}%`,
                top: '16px',
              }}
            >
              <div className="mui-tooltip-header">
                <span className="mui-tooltip-date">{hoveredData[xAxisKey]}</span>
              </div>
              <div className="mui-tooltip-series-list">
                {activeSeries.map((s) => (
                  <div key={s.key} className="mui-tooltip-row">
                    <span className="mui-tooltip-swatch" style={{ backgroundColor: s.color }} />
                    <span className="mui-tooltip-label">{s.label}:</span>
                    <span className="mui-tooltip-value">{hoveredData[s.key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right (25%): Language Peek Panel (Docked to the right of graph) */}
        <aside className="mui-language-peek-panel">
          <div className="peek-panel-header">
            <h4 className="peek-panel-title">Languages Peek</h4>
            <span className="peek-total-count">{totalCount} total</span>
          </div>

          <div className="peek-language-list">
            {series.map((s) => {
              const isHidden = hiddenSeries.has(s.key);
              const count = s.totalCount || (dataset.length > 0 ? dataset[dataset.length - 1][s.key] ?? 0 : 0);
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div
                  key={s.key}
                  className={`peek-language-item ${isHidden ? 'disabled' : ''}`}
                  onClick={() => toggleSeries(s.key)}
                  title={`Click to ${isHidden ? 'show' : 'hide'} ${s.label} on graph`}
                >
                  <div className="peek-item-top">
                    <div className="peek-item-left">
                      <span className="peek-color-indicator" style={{ backgroundColor: isHidden ? '#52525b' : s.color }} />
                      <span className="peek-item-name">{s.label}</span>
                    </div>
                    <span className="peek-item-count">{count}</span>
                  </div>

                  {/* Proportional Mini Bar */}
                  <div className="peek-progress-track">
                    <div
                      className="peek-progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isHidden ? '#52525b' : s.color,
                      }}
                    />
                  </div>

                  <div className="peek-item-footer">
                    <span className="peek-item-pct">{pct}% of total</span>
                    <span className="peek-toggle-hint">{isHidden ? 'Show' : 'Active'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
