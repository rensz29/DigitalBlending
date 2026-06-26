import { toChartNumber } from '../utils/chart.js';

const TAG_COLORS = [
  { stroke: '#EF9F27', fill: 'rgba(239,159,39,0.12)', text: '#BA7517' },
  { stroke: '#5DCAA5', fill: 'rgba(93,202,165,0.12)', text: '#0F6E56' },
  { stroke: '#85B7EB', fill: 'rgba(133,183,235,0.12)', text: '#185FA5' },
  { stroke: '#F09595', fill: 'rgba(240,149,149,0.12)', text: '#A32D2D' },
  { stroke: '#AFA9EC', fill: 'rgba(175,169,236,0.12)', text: '#534AB7' },
  { stroke: '#97C459', fill: 'rgba(151,196,89,0.12)', text: '#3B6D11' },
  { stroke: '#ED93B1', fill: 'rgba(237,147,177,0.12)', text: '#993556' },
  { stroke: '#F0997B', fill: 'rgba(240,153,123,0.12)', text: '#993C1D' },
  { stroke: '#5DCAA5', fill: 'rgba(93,202,165,0.12)', text: '#085041' },
  { stroke: '#FAC775', fill: 'rgba(250,199,117,0.12)', text: '#854F0B' },
];

export function getTagColor(index) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

function formatDisplayValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const numeric = toChartNumber(value);
  if (numeric !== null) return numeric.toFixed(1);
  return String(value);
}

function historyValues(series) {
  if (!series || series.length === 0) return [];
  return series.map((point) => point.v);
}

function dynamicRange(history, fallbackValue) {
  if (history.length >= 2) {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const pad = Math.max((max - min) * 0.05, 0.5);
    return { min: min - pad, max: max + pad };
  }

  const base = toChartNumber(fallbackValue) ?? 0;
  return { min: base - 1, max: base + 1 };
}

function Sparkline({ data, color, min, max }) {
  const W = 320;
  const H = 80;
  if (!data || data.length < 2) return null;

  const pad = (max - min) * 0.08 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - lo) / (hi - lo)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = pts.join(' ');
  const first = pts[0].split(',');
  const last = pts[pts.length - 1].split(',');
  const areaPath = `M${first[0]},${H} ` + pts.map((p) => `L${p}`).join(' ') + ` L${last[0]},${H} Z`;
  const gradientId = `g-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="sparkline-svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export default function OpcuaWidgetCard({ tag, color, liveTag, history, onRemove, editMode }) {
  const numeric = toChartNumber(liveTag?.value);
  const chartable = numeric !== null && liveTag?.statusCode === 'Good';
  const values = historyValues(history);
  const displayValue = formatDisplayValue(liveTag?.value);
  const { min, max } = dynamicRange(values, liveTag?.value);
  const trend = values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;
  const trendUp = trend > 0;
  const trendFlat = Math.abs(trend) < (max - min) * 0.005;
  const pct = chartable
    ? Math.min(100, Math.max(0, ((numeric - min) / (max - min)) * 100))
    : 0;

  const isGood = liveTag?.statusCode === 'Good';
  const status = isGood
    ? { label: 'Normal', className: 'status-ok' }
    : liveTag?.statusCode
      ? { label: 'Fault', className: 'status-err' }
      : { label: 'Waiting', className: 'status-warn' };

  return (
    <article className="chart-card widget-card opcua-flow-widget nopan">
      <div className="widget-accent" style={{ background: color.stroke }} />

      <div className="widget-header">
        <div className="widget-dot" style={{ background: color.stroke }} />
        <div className="widget-title-wrap">
          <div className="widget-title">{tag.displayName}</div>
          <div className="widget-subtitle">{tag.nodeId}</div>
        </div>
        <div className={`widget-status ${status.className}`}>
          <span className="widget-status-dot" />
          {status.label}
        </div>
        {editMode && (
          <button
            type="button"
            className="widget-remove nodrag nopan"
            onClick={onRemove}
            aria-label="Remove widget"
          >
            ✕
          </button>
        )}
      </div>

      <div className="widget-value-row">
        <span className="widget-value">{displayValue}</span>
        {chartable && !trendFlat && (
          <span className={`widget-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}
          </span>
        )}
      </div>

      {chartable ? (
        <>
          <div className="widget-gauge">
            <div className="widget-gauge-fill" style={{ width: `${pct}%`, background: color.stroke }} />
          </div>
          <div className="widget-sparkline">
            {values.length >= 2 ? (
              <Sparkline data={values} color={color.stroke} min={min} max={max} />
            ) : (
              <div className="chart-card-empty">Collecting data…</div>
            )}
          </div>
          <div className="widget-footer">
            <span>Min {min.toFixed(1)}</span>
            <span>{values.length} points</span>
            <span>Max {max.toFixed(1)}</span>
          </div>
        </>
      ) : (
        <div className="chart-card-not-chartable">
          {liveTag?.statusCode && liveTag.statusCode !== 'Good'
            ? `Status: ${liveTag.statusCode}`
            : 'Not chartable — numeric tags only'}
        </div>
      )}
    </article>
  );
}

export function formatTagDisplayValue(value) {
  return formatDisplayValue(value);
}

export function tagGaugeRange(history, fallbackValue) {
  return dynamicRange(historyValues(history), fallbackValue);
}
