import { GaugeIcon, BoxesIcon, DropletIcon } from './icons.jsx';
import { formatNumber, formatPercent } from '../utils/format.js';

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function totalKgField(id) {
  if (id === 'esm') return 'totalEsmKg';
  return `total${id.charAt(0).toUpperCase() + id.slice(1)}Kg`;
}

function valveSecondsField(id) {
  if (id === 'esm') return 'valveOpenSeconds';
  return `${id}ValveOpenSeconds`;
}

function avgFlowField(id) {
  if (id === 'esm') return 'avgEsmFlowKgpm';
  return `avg${id.charAt(0).toUpperCase() + id.slice(1)}FlowKgpm`;
}

export default function KpiCards({ kpis, ingredients }) {
  if (!kpis) return null;

  const sharedCards = [
    {
      value: formatPercent(kpis.runningPct, 1),
      label: 'Line Running',
      Icon: GaugeIcon,
    },
    {
      value: formatNumber(kpis.skuCount, 0),
      label: 'SKUs Run',
      Icon: BoxesIcon,
    },
  ];

  const ingredientCards = (ingredients || []).map((ing) => {
    const avgFlow = kpis[avgFlowField(ing.id)];
    const subs = [
      `${fmtDuration(kpis[valveSecondsField(ing.id)] ?? 0)} valve open`,
    ];
    if (avgFlow !== undefined && avgFlow !== null) {
      subs.push(`Avg flowrate: ${formatNumber(avgFlow, 1)} kg/min`);
    }
    return {
      value: formatNumber(kpis[totalKgField(ing.id)] ?? 0, 1),
      label: `Total ${ing.label} Dosed (kg)`,
      subs,
      color: ing.color,
      Icon: DropletIcon,
    };
  });

  const cards = [...sharedCards, ...ingredientCards];

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div className="kpi-card" key={c.label}>
          <div className="kpi-card-head">
            <span
              className="kpi-card-icon"
              style={c.color ? { color: c.color } : undefined}
            >
              <c.Icon size={18} />
            </span>
            <div
              className="value"
              style={c.color ? { color: c.color } : undefined}
            >
              {c.value}
            </div>
          </div>
          <div className="label">{c.label}</div>
          {c.subs?.map((sub) => (
            <div key={sub} className="label" style={{ marginTop: 2 }}>
              {sub}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
