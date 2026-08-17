import './Heatmap.css';
import { formatDateReadable } from '../../utils/helpers';

// ── Heatmap Component ───────────────────────────────────────────

export default function Heatmap({ totalContributions, heatmapDays, heatmapLookup, getHeatLevel, monthLabels }) {
  return (
    <section className="card heatmap-section">
      <div className="card-header-row">
        <h3>{totalContributions} submissions in the last year</h3>
      </div>
      <div className="heatmap-scroll">
        <div className="heatmap-wrapper">
          <div className="heatmap-months">
            {monthLabels.map((m, i) => <span key={i} className="month-lbl">{m}</span>)}
          </div>
          <div className="heatmap-body">
            <div className="heatmap-days-labels">
              <span>Mon</span><span>Wed</span><span>Fri</span>
            </div>
            <div className="heatmap-grid">
              {heatmapDays.map(day => {
                const count = heatmapLookup[day] || 0;
                return (
                  <div key={day} className={`hm-cell ${getHeatLevel(count)}`}
                       title={`${count} submission${count !== 1 ? 's' : ''} on ${formatDateReadable(day)}`} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap-footer">
        <span className="heatmap-legend-label">Less</span>
        <div className="hm-cell level-0 legend-cell" />
        <div className="hm-cell level-1 legend-cell" />
        <div className="hm-cell level-2 legend-cell" />
        <div className="hm-cell level-3 legend-cell" />
        <div className="hm-cell level-4 legend-cell" />
        <span className="heatmap-legend-label">More</span>
      </div>
    </section>
  );
}
