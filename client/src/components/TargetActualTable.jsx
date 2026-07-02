const TOLERANCE_PP = 2;

function formatPct(value) {
  if (value == null) return '—';
  return value.toFixed(2);
}

function formatVariance(value) {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function varianceClass(variance, hasTarget) {
  if (!hasTarget || variance == null) return 'variance-na';
  return Math.abs(variance) <= TOLERANCE_PP ? 'variance-ok' : 'variance-warn';
}

export default function TargetActualTable({ data, ingredients }) {
  if (!data || data.length === 0) {
    return (
      <div className="panel">
        <h2>Target vs Actual</h2>
        <p className="muted">No SKU dosing recorded for this shift.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Target vs Actual</h2>
      <p className="muted comparison-note">
        Actual composition is derived from dosed kg. Variance within ±{TOLERANCE_PP} pp is highlighted
        in green; outside tolerance in amber.
      </p>

      <div className="table-wrap">
        <table className="data-table comparison-table">
          <thead>
            <tr>
              <th rowSpan={2}>Product</th>
              <th rowSpan={2}>Total kg</th>
              {(ingredients || []).map((ing) => (
                <th key={ing.id} colSpan={3} className="comparison-group-header">
                  {ing.label}
                </th>
              ))}
              <th rowSpan={2}>Status</th>
            </tr>
            <tr>
              {(ingredients || []).map((ing) => (
                <th key={`${ing.id}-sub`} colSpan={3} className="comparison-subheader">
                  <span>Target</span>
                  <span>Actual</span>
                  <span>Δ</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const noDosing = row.totalKg === 0;
              const status = !row.hasTarget
                ? 'No target recipe'
                : noDosing
                  ? 'No dosing'
                  : 'OK';

              return (
                <tr key={row.sku}>
                  <td>{row.sku}</td>
                  <td>{noDosing ? '—' : row.totalKg.toFixed(1)}</td>
                  {(ingredients || []).map((ing) => {
                    const target = row.target?.[ing.id];
                    const actual = row.actual?.[ing.id];
                    const variance = row.variance?.[ing.id];

                    return (
                      <td key={ing.id} colSpan={3} className="comparison-ingredient-cell">
                        <div className="comparison-ingredient-grid">
                          <span className="comparison-value">
                            {row.hasTarget ? formatPct(target) : '—'}
                          </span>
                          <span className="comparison-value">
                            {noDosing ? '—' : formatPct(actual)}
                          </span>
                          <span className={`comparison-value ${varianceClass(variance, row.hasTarget)}`}>
                            {row.hasTarget && !noDosing ? formatVariance(variance) : '—'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className={!row.hasTarget ? 'comparison-status-warn' : 'muted'}>
                    {status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
