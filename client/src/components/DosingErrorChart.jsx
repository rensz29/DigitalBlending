import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useChartTheme, tooltipStyle } from '../hooks/useChartTheme.js';
import { fmtTime } from '../lib/timeBuckets.js';

const INGREDIENT_COLORS = {
  esm: '#38bdf8',
  oil: '#f97316',
  wv: '#a78bfa',
  starch: '#fbbf24',
};

const INGREDIENT_LABELS = {
  esm: 'ESM',
  oil: 'Oil',
  wv: 'Water Vinegar',
  starch: 'Starch',
};

const REL_ERROR_TOLERANCE_PCT = 5;

function formatPct(value) {
  if (value == null) return '—';
  return `${value.toFixed(2)}%`;
}

function formatError(value) {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function buildPoints(windows) {
  return (windows || [])
    .map((w, idx) => {
      const ingredientId = w.ingredientId;
      const error = w.errorPct?.[ingredientId];
      if (error == null) return null;
      return {
        id: `${ingredientId}-${w.windowStart}-${idx}`,
        ingredientId,
        ingredientLabel: w.ingredientLabel || INGREDIENT_LABELS[ingredientId] || ingredientId,
        windowStart: w.windowStart,
        windowEnd: w.windowEnd,
        startLabel: w.startLabel,
        endLabel: w.endLabel,
        sku: w.sku,
        totalKg: w.windowTotalKg,
        target: w.target?.[ingredientId] ?? null,
        actual: w.actual?.[ingredientId] ?? null,
        error,
      };
    })
    .filter(Boolean);
}

function DosingTooltip({ active, payload, ct }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div
      className="dosing-error-tooltip"
      style={{
        background: ct.tooltipBg,
        border: `1px solid ${ct.tooltipBorder}`,
        color: ct.tooltipText,
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 320,
      }}
    >
      <div><strong>{p.ingredientLabel}</strong></div>
      <div>Window: {p.startLabel}–{p.endLabel}</div>
      <div>SKU: {p.sku || '—'}</div>
      <div>Total kg: {p.totalKg?.toFixed?.(3) ?? '—'}</div>
      <div>Target: {formatPct(p.target)}</div>
      <div>Actual: {formatPct(p.actual)}</div>
      <div>Error: {formatError(p.error)}</div>
    </div>
  );
}

function IngredientLineChart({ ingredientId, points, range, ct }) {
  const label = INGREDIENT_LABELS[ingredientId];
  const color = INGREDIENT_COLORS[ingredientId];

  return (
    <div className="dosing-error-chart-item">
      <div className="timeline-label" style={{ marginBottom: 'var(--space-2)' }}>
        {label}
      </div>
      {points.length === 0 ? (
        <p className="muted">No valid error points for {label}.</p>
      ) : (
        <div className="dosing-error-chart-wrap">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="windowStart"
                domain={range ? [range.unixStart, range.unixEnd] : ['dataMin', 'dataMax']}
                tickFormatter={fmtTime}
                stroke={ct.axis}
                fontSize={11}
                minTickGap={20}
              />
              <YAxis
                type="number"
                dataKey="error"
                unit="%"
                stroke={ct.axis}
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={0} stroke={ct.axis} strokeOpacity={0.5} />
              <ReferenceLine y={REL_ERROR_TOLERANCE_PCT} stroke={ct.axis} strokeDasharray="4 4" />
              <ReferenceLine y={-REL_ERROR_TOLERANCE_PCT} stroke={ct.axis} strokeDasharray="4 4" />
              <Tooltip
                content={<DosingTooltip ct={ct} />}
                contentStyle={tooltipStyle(ct)}
                cursor={{ stroke: ct.axis, strokeDasharray: '4 4' }}
              />
              <Line
                type="monotone"
                dataKey="error"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function DosingErrorChart({ windows = [], range }) {
  const ct = useChartTheme();
  const points = buildPoints(windows);
  const skippedCount = Math.max(0, (windows || []).length - points.length);

  if (!points.length) {
    return (
      <div className="panel">
        <h2>Dosing Error</h2>
        <p className="muted">No dosing error points for this shift.</p>
      </div>
    );
  }

  const byIngredient = {
    esm: points.filter((p) => p.ingredientId === 'esm'),
    oil: points.filter((p) => p.ingredientId === 'oil'),
    wv: points.filter((p) => p.ingredientId === 'wv'),
    starch: points.filter((p) => p.ingredientId === 'starch'),
  };

  return (
    <div className="panel">
      <h2>Dosing Error</h2>
      <p className="muted comparison-note">
        Relative error formula: (Actual% - Target%) / Target% * 100. Hover each point to inspect
        window details.
      </p>
      {skippedCount > 0 && (
        <p className="muted" style={{ marginTop: '-8px' }}>
          {skippedCount} windows are hidden because target/error is unavailable.
        </p>
      )}

      <div className="dosing-error-multi-chart">
        {Object.keys(INGREDIENT_LABELS).map((ingredientId) => (
          <IngredientLineChart
            key={ingredientId}
            ingredientId={ingredientId}
            points={byIngredient[ingredientId]}
            range={range}
            ct={ct}
          />
        ))}
      </div>
    </div>
  );
}
