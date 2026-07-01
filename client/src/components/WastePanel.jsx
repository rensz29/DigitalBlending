import BucketedDosedChart from './BucketedDosedChart.jsx';
import EmptyState from './EmptyState.jsx';
import { DropletIcon, TimerIcon, AlertTriangleIcon } from './icons.jsx';
import { formatKg, formatNumber } from '../utils/format.js';

const WASTE_COLOR = '#f87171';

function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function WastePanel({ waste, range }) {
  if (!waste) return null;

  const {
    totalKg,
    cipExcludedKg,
    cycleCount,
    cycles = [],
    bySku = [],
    trend = [],
  } = waste;

  const kpis = [
    { value: formatKg(totalKg), label: 'Total Waste', Icon: DropletIcon, color: WASTE_COLOR },
    { value: formatNumber(cycleCount, 0), label: 'Waste Cycles', Icon: TimerIcon },
    { value: formatKg(cipExcludedKg), label: 'CIP-Excluded', Icon: AlertTriangleIcon },
  ];

  return (
    <div className="panel">
      <h2>Wastewise</h2>
      <div className="subtitle" style={{ marginBottom: 'var(--space-4)' }}>
        Forward-flow through the waste valve while open, excluding CIP cleaning.
      </div>

      <div className="kpi-grid" style={{ marginBottom: 'var(--space-5)' }}>
        {kpis.map((c) => (
          <div className="kpi-card" key={c.label}>
            <div className="kpi-card-head">
              <span
                className="kpi-card-icon"
                style={c.color ? { color: c.color } : undefined}
              >
                <c.Icon size={18} />
              </span>
              <div className="value" style={c.color ? { color: c.color } : undefined}>
                {c.value}
              </div>
            </div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </div>

      {cycles.length === 0 ? (
        <EmptyState
          icon={DropletIcon}
          title="No waste recorded"
          hint="No waste-valve open cycles in this shift window."
        />
      ) : (
        <>
          <div className="ingredient-overview-tracks">
            <BucketedDosedChart
              label="Waste over time"
              data={trend}
              range={range}
              color={WASTE_COLOR}
              unit=" kg"
              valueLabel="Waste"
              bucketSeconds={900}
            />
          </div>

          <div className="timeline-label" style={{ marginTop: 'var(--space-4)' }}>
            Waste cycles
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Open</th>
                  <th>Close</th>
                  <th>Duration</th>
                  <th>CL Mode</th>
                  <th>Waste</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c, i) => (
                  <tr key={i}>
                    <td>{c.startLabel}</td>
                    <td>{c.endLabel}</td>
                    <td>{fmtDuration(c.durationSec)}</td>
                    <td>{c.mode}</td>
                    <td>{formatKg(c.wasteKg)}</td>
                    <td>
                      {c.counted ? (
                        <span className="badge badge-ok">Counted</span>
                      ) : (
                        <span className="badge badge-warn">CIP excluded</span>
                      )}
                      {c.counted && c.excludedCipKg > 0 && (
                        <span className="badge badge-warn" style={{ marginLeft: 6 }}>
                          +{formatKg(c.excludedCipKg)} CIP
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bySku.length > 0 && (
            <>
              <div className="timeline-label" style={{ marginTop: 'var(--space-5)' }}>
                Waste by SKU
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Waste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySku.map((r) => (
                      <tr key={r.sku}>
                        <td>{r.sku}</td>
                        <td>{formatKg(r.kg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
