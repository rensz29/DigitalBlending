import { fmtTimeRange } from '../lib/timeBuckets.js';

const SKU_PALETTE = [
  '#38bdf8',
  '#f97316',
  '#a78bfa',
  '#fbbf24',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#fb923c',
  '#c084fc',
  '#4ade80',
];

const UNKNOWN_COLOR = '#64748b';
const EMPTY_COLOR = '#334155';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForSku(sku) {
  if (!sku || sku === 'Unknown') return UNKNOWN_COLOR;
  return SKU_PALETTE[hashString(sku) % SKU_PALETTE.length];
}

export default function SkuTimelineRow({ label, segments, range }) {
  const { unixStart, unixEnd } = range;
  const total = unixEnd - unixStart || 1;

  return (
    <div className="timeline-row overview-row">
      <div className="timeline-label">{label}</div>
      <div className="timeline-band">
        {!segments || segments.length === 0 ? (
          <div
            className="timeline-seg"
            style={{ width: '100%', background: EMPTY_COLOR }}
            title="No data"
          />
        ) : (
          segments.map((s, i) => (
            <div
              key={i}
              className="timeline-seg sku-seg"
              style={{
                width: `${((s.end - s.start) / total) * 100}%`,
                background: colorForSku(s.value),
              }}
              title={`${fmtTimeRange(s.start, s.end)}: ${s.value}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
