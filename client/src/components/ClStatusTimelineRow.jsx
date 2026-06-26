import { fmtTimeRange } from '../lib/timeBuckets.js';
import { colorForStatus, formatStatusLabel } from '../lib/clStatus.js';

const EMPTY_COLOR = '#334155';

export default function ClStatusTimelineRow({ label, segments, range, clStatuses }) {
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
          segments.map((s, i) => {
            const title = `${fmtTimeRange(s.start, s.end)}: ${formatStatusLabel(
              clStatuses,
              s.value
            )}`;
            return (
              <div
                key={i}
                className="timeline-seg sku-seg"
                style={{
                  width: `${((s.end - s.start) / total) * 100}%`,
                  background: colorForStatus(clStatuses, s.value),
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
