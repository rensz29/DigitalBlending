import { fmtTimeRange, mergeSegments } from '../lib/timeBuckets.js';
import { colorForStatus, formatStatusLabel } from '../lib/clStatus.js';

const EMPTY_COLOR = '#334155';

export default function ClStatusTimelineRow({ label, segments, clStatuses }) {
  const merged = mergeSegments(segments);

  return (
    <div className="timeline-row overview-row">
      <div className="timeline-label">{label}</div>
      <div className="timeline-band">
        {merged.length === 0 ? (
          <div
            className="timeline-seg"
            style={{ flex: 1, background: EMPTY_COLOR }}
            title="No data"
          />
        ) : (
          merged.map((s, i) => {
            const title = `${fmtTimeRange(s.start, s.end)}: ${formatStatusLabel(
              clStatuses,
              s.value
            )}`;
            return (
              <div
                key={i}
                className="timeline-seg sku-seg"
                style={{
                  flexGrow: s.end - s.start,
                  flexShrink: 0,
                  flexBasis: 0,
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
