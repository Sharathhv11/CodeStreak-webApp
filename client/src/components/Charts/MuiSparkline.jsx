import { useId, useMemo } from 'react';
import './MuiSparkline.css';

/**
 * MuiSparkline — High-performance SVG Sparkline Area Chart
 * Follows MUI X-Charts SparkLine specification with smooth bezier curves and glowing area gradient.
 */
export default function MuiSparkline({
  data = [],
  color = '#3b82f6',
  width = 130,
  height = 50,
  strokeWidth = 2.2,
  showArea = true,
  className = '',
}) {
  const gradientId = useId();

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: '', areaPath: '', lastPoint: null };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padTop = 6;
    const padBottom = 6;
    const padX = 2;

    const plotW = width - padX * 2;
    const plotH = height - padTop - padBottom;

    const points = data.map((val, idx) => {
      const x = padX + (idx / Math.max(data.length - 1, 1)) * plotW;
      const y = padTop + plotH - ((val - min) / range) * plotH;
      return { x, y, val };
    });

    if (points.length === 1) {
      const singleY = height / 2;
      return {
        linePath: `M 0,${singleY} L ${width},${singleY}`,
        areaPath: `M 0,${singleY} L ${width},${singleY} L ${width},${height} L 0,${height} Z`,
        lastPoint: { x: width, y: singleY },
      };
    }

    // Smooth cubic bezier spline
    let line = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = ((p0.x + p1.x) / 2).toFixed(1);
      line += ` C ${cpX},${p0.y.toFixed(1)} ${cpX},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }

    const last = points[points.length - 1];
    const area = `${line} L ${last.x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;

    return {
      linePath: line,
      areaPath: area,
      lastPoint: last,
    };
  }, [data, width, height]);

  if (!linePath) return null;

  return (
    <div className={`mui-sparkline-wrap ${className}`} style={{ width, height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        className="mui-sparkline-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="65%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Glowing Area Fill */}
        {showArea && (
          <path d={areaPath} fill={`url(#${gradientId})`} className="mui-sparkline-area" />
        )}

        {/* Main Line Stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mui-sparkline-line"
        />

        {/* Subtle glowing end-point dot */}
        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3"
            fill={color}
            stroke="#101014"
            strokeWidth="1.5"
            className="mui-sparkline-dot"
          />
        )}
      </svg>
    </div>
  );
}
