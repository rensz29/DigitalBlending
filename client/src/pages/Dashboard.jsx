import { useState } from 'react';
import ShiftControls from '../components/ShiftControls.jsx';
import KpiCards from '../components/KpiCards.jsx';
import SkuBreakdown from '../components/SkuBreakdown.jsx';
import TargetActualTable from '../components/TargetActualTable.jsx';
import IngredientOverviewPanel from '../components/IngredientOverviewPanel.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCards, SkeletonText } from '../components/Skeleton.jsx';
import { AlertTriangleIcon, DashboardIcon } from '../components/icons.jsx';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shift-data?date=${date}&shift=${shift}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setResult(body);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const ingredients = result?.ingredients || [];

  return (
    <>
      <div className="subtitle">
        Continuous Line 03 · Nirvana Digital Blending · times shown in Asia/Manila
      </div>

      <div className="panel">
        <ShiftControls
          date={date}
          shift={shift}
          loading={loading}
          onDateChange={setDate}
          onShiftChange={setShift}
          onLoad={load}
        />
        {error && (
          <div className="alert" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <span className="alert-icon">
              <AlertTriangleIcon size={18} />
            </span>
            {error}
          </div>
        )}
      </div>

      {loading && (
        <>
          <div className="panel">
            <SkeletonCards count={6} />
          </div>
          <div className="panel">
            <SkeletonText lines={5} />
          </div>
        </>
      )}

      {!result && !error && !loading && (
        <div className="panel">
          <EmptyState
            icon={DashboardIcon}
            title="No shift loaded yet"
            hint="Pick a date and shift above, then press Load to see KPIs, ingredient dosing, and recipe comparison."
          />
        </div>
      )}

      {result && !loading && (
        <>
          <div className="panel">
            <h2>
              {result.shiftLabel} · {result.date} ({result.range.startLabel}–
              {result.range.endLabel})
            </h2>
            <KpiCards kpis={result.kpis} ingredients={ingredients} />
          </div>

          <IngredientOverviewPanel
            series={result.series}
            shiftRange={result.range}
            date={result.date}
            shift={result.shift}
            ingredients={ingredients}
            clStatuses={result.clStatuses}
          />

          <SkuBreakdown data={result.skuBreakdown} ingredients={ingredients} />

          <TargetActualTable
            data={result.recipeComparison}
            ingredients={ingredients}
          />
        </>
      )}
    </>
  );
}
