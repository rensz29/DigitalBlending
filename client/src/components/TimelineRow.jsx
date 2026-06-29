import { fmtTime, mergeSegments } from '../lib/timeBuckets.js';

export default function TimelineRow({
  label,
  segments,
  activeColor,
  inactiveColor,
  isActive,
  formatTitle,
}) {
  const merged = mergeSegments(segments);

  return (
    <div className="timeline-row overview-row">
      <div className="timeline-label">{label}</div>
      <div className="timeline-band">
        {merged.length === 0 ? (
          <div
            className="timeline-seg"
            style={{ flex: 1, background: '#334155' }}
            title="No data"
          />
        ) : (
          merged.map((s, i) => {
            const active = isActive(s.value);
            const title = formatTitle
              ? formatTitle(s)
              : `${fmtTime(s.start)}–${fmtTime(s.end)}: ${s.value}`;
            return (
              <div
                key={i}
                className="timeline-seg"
                style={{
                  flexGrow: s.end - s.start,
                  flexShrink: 0,
                  flexBasis: 0,
                  background: active ? activeColor : inactiveColor,
                }}
                title={title}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export const RUNNING = /^(run|running|on|true|1|started|auto)$/i;
export const OPEN = /^(open|opened|on|true|1)$/i;

export function matchesState(v, re) {
  return v === 1 || v === true || (typeof v === 'string' && re.test(v.trim()));
}

export function isBucketActive(value) {
  return value === 'active';
}
