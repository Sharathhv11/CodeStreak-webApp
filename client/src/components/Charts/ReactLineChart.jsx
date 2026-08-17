import { useState, useMemo, useRef } from 'react';
import './ReactLineChart.css';

/**
 * ReactLineChart — Production-Grade Modular Multi-Line React Chart Component
 * Implements standard React Charts architecture with 2D coordinate system,
 * arrowheads, axes ticks, interactive tooltips, crosshair, and legend box.
 */
export default function ReactLineChart({
  data = [],
  series = [],
  xAxisKey = 'label',
  xAxisLabel = 'x-axis',
  yAxisLabel = 'y-axis',
  height = 280,
  minMaxY = 3,
}) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  // Chart dimensions & padding
  const SVG_WIDTH = 720;
  const SVG_HEIGHT = height;
  const PAD_LEFT = 60;
  const PAD_RIGHT = 50;
  const PAD_TOP = 42;
  const PAD_BOTTOM = 52;

  const PLOT_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const PLOT_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Visible series
  const activeSeries = useMemo(() => {
    return series.filter((s) => !hiddenSeries.has(s.key));
  }, [series, hiddenSeries]);

  // Compute maximum Y value across all active series data points
  const maxY = useMemo(() => {
    let max = minMaxY;
    data.forEach((row) => {
      activeSeries.forEach((s) => {
        const val = Number(row[s.key]) || 0;
        if (val > max) max = val;
      });
    });
    // Round to a clean upper bound
    return Math.max(Math.ceil(max * 1.25), minMaxY);
  }, [data, activeSeries, minMaxY]);

  // Generate clean Y-axis ticks
  const yTicks = useMemo(() => {
    const step = Math.max(Math.ceil(maxY / 4), 1);
    const ticks = [];
    for (let v = 0; v <= maxY; v += step) {
      ticks.push(v);
    }
    if (!ticks.includes(maxY)) ticks.push(maxY);
    return ticks;
  }, [maxY]);

  // Coordinate projection functions
  const getX = (idx) => {
    if (data.length <= 1) return PAD_LEFT + PLOT_W / 2;
    return PAD_LEFT + (idx / (data.length - 1)) * PLOT_W;
  };

  const getY = (val) => {
    return PAD_TOP + PLOT_H - (val / maxY) * PLOT_H;
  };

  // Toggle series visibility
  const toggleSeries = (key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < series.length - 1) next.add(key);
      return next;
    });
  };

  // Handle mouse move across the chart for crosshair
  const handleMouseMove = (e) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * SVG_WIDTH;

    // Find closest index
    let closestIdx = 0;
    let minDiff = Infinity;
    data.forEach((_, idx) => {
      const diff = Math.abs(getX(idx) - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  if (data.length === 0) {
    return (
      <div className="react-chart-empty">
        <p>No chart data available to display.</p>
      </div>
    );
  }

  const hoveredData = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="react-line-chart-wrapper" ref={containerRef} onMouseLeave={() => setHoverIndex(null)}>
      {/* ── Legend Box (Matching user's reference diagram) ─────── */}
      <div className="react-chart-legend-box">
        <span className="legend-box-header">Languages</span>
        <div className="legend-pills-list">
          {series.map((s) => {
            const isHidden = hiddenSeries.has(s.key);
            const latestVal = data.length > 0 ? data[data.length - 1][s.key] ?? 0 : 0;
            return (
              <button
                key={s.key}
                type="button"
                className={`legend-pill-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleSeries(s.key)}
                title={`Toggle ${s.label} visibility`}
              >
                <span className="legend-swatch-box" style={{ backgroundColor: isHidden ? '#3f3f46' : s.color }} />
                <span className="legend-pill-label">{s.label}</span>
                <span className="legend-pill-val">({latestVal})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SVG Chart Area ────────────────────────────────────── */}
      <div className="react-chart-svg-container" onMouseMove={handleMouseMove}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="react-chart-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal Grid Lines */}
          {yTicks.map((tick) => {
            const yPos = getY(tick);
            return (
              <g key={tick} className="chart-grid-group">
                <line
                  x1={PAD_LEFT}
                  y1={yPos}
                  x2={SVG_WIDTH - PAD_RIGHT}
                  y2={yPos}
                  className="chart-grid-line"
                />
                <text
                  x={PAD_LEFT - 12}
                  y={yPos + 4}
                  textAnchor="end"
                  className="chart-tick-text"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-Axis Ticks & Labels */}
          {data.map((row, idx) => {
            const xPos = getX(idx);
            return (
              <g key={row[xAxisKey] || idx} className="chart-x-tick-group">
                <line
                  x1={xPos}
                  y1={PAD_TOP + PLOT_H}
                  x2={xPos}
                  y2={PAD_TOP + PLOT_H + 6}
                  className="chart-axis-tick"
                />
                <text
                  x={xPos}
                  y={PAD_TOP + PLOT_H + 22}
                  textAnchor="middle"
                  className="chart-tick-text x-tick"
                >
                  {row[xAxisKey]}
                </text>
              </g>
            );
          })}

          {/* Vertical Y-Axis Main Line with Arrowhead */}
          <line
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={PAD_LEFT}
            y2={PAD_TOP - 16}
            className="chart-main-axis"
          />
          <polygon
            points={`${PAD_LEFT - 5},${PAD_TOP - 12} ${PAD_LEFT},${PAD_TOP - 26} ${PAD_LEFT + 5},${PAD_TOP - 12}`}
            className="chart-axis-arrowhead"
          />
          <text
            x={PAD_LEFT}
            y={PAD_TOP - 30}
            textAnchor="middle"
            className="chart-axis-title"
          >
            {yAxisLabel}
          </text>

          {/* Horizontal X-Axis Main Line with Arrowhead */}
          <line
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={SVG_WIDTH - PAD_RIGHT + 16}
            y2={PAD_TOP + PLOT_H}
            className="chart-main-axis"
          />
          <polygon
            points={`${SVG_WIDTH - PAD_RIGHT + 12},${PAD_TOP + PLOT_H - 5} ${SVG_WIDTH - PAD_RIGHT + 26},${PAD_TOP + PLOT_H} ${SVG_WIDTH - PAD_RIGHT + 12},${PAD_TOP + PLOT_H + 5}`}
            className="chart-axis-arrowhead"
          />
          <text
            x={SVG_WIDTH - PAD_RIGHT + 28}
            y={PAD_TOP + PLOT_H + 4}
            textAnchor="start"
            className="chart-axis-title"
          >
            {xAxisLabel}
          </text>

          {/* Vertical Crosshair on Hover */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={PAD_TOP}
              x2={getX(hoverIndex)}
              y2={PAD_TOP + PLOT_H}
              className="chart-crosshair-line"
            />
          )}

          {/* Render Active Lines */}
          {activeSeries.map((s) => {
            const pointsStr = data
              .map((row, idx) => `${getX(idx)},${getY(Number(row[s.key]) || 0)}`)
              .join(' ');

            return (
              <g key={s.key} className="chart-series-group">
                {/* Glow/Shadow Stroke */}
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="5"
                  strokeOpacity="0.2"
                  points={pointsStr}
                />
                {/* Main Curve Line */}
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                />

                {/* Data Points */}
                {data.map((row, idx) => {
                  const cx = getX(idx);
                  const cy = getY(Number(row[s.key]) || 0);
                  const isHovered = hoverIndex === idx;

                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={s.color}
                      stroke="#09090b"
                      strokeWidth="2"
                      className={`chart-point ${isHovered ? 'active' : ''}`}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && hoveredData && (
          <div
            className="react-chart-tooltip"
            style={{
              left: `${(getX(hoverIndex) / SVG_WIDTH) * 100}%`,
              top: '12px',
            }}
          >
            <div className="tooltip-date-header">{hoveredData[xAxisKey]}</div>
            <div className="tooltip-values-list">
              {activeSeries.map((s) => (
                <div key={s.key} className="tooltip-val-row">
                  <span className="tooltip-swatch" style={{ backgroundColor: s.color }} />
                  <span className="tooltip-series-name">{s.label}:</span>
                  <span className="tooltip-series-count">{hoveredData[s.key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
