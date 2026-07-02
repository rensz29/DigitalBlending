import { useEffect, useRef, useState } from 'react';
import DosingErrorChart from './DosingErrorChart.jsx';
import EmptyState from './EmptyState.jsx';
import { SkeletonText, SkeletonOverview } from './Skeleton.jsx';
import LoadingOverlay from './LoadingOverlay.jsx';
import { AlertTriangleIcon, DashboardIcon } from './icons.jsx';

// Lazily fetches /api/dosing-error-data for the given date/shift.
// Mounted only after the Dosing Error tab is first opened.
export default function DosingErrorTab({ date, shift }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const lastKey = useRef(null);

  useEffect(() => {
    const key = `${date}|${shift}`;
    if (lastKey.current === key) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dosing-error-data?date=${date}&shift=${shift}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        if (!cancelled) {
          setData(body);
          lastKey.current = key;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [date, shift]);

  if (loading && !data) {
    return (
      <div className="panel">
        <SkeletonOverview />
        <SkeletonText lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="alert" role="alert">
          <span className="alert-icon">
            <AlertTriangleIcon size={18} />
          </span>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel">
        <EmptyState
          icon={DashboardIcon}
          title="No shift loaded yet"
          hint="Pick a date and shift above, then press Load to view dosing error graph."
        />
      </div>
    );
  }

  return (
    <div className="panel-loading-host" aria-busy={loading || undefined}>
      {loading && <LoadingOverlay message="Loading dosing error…" />}
      <DosingErrorChart windows={data.dosingErrorWindows || []} range={data.range} />
    </div>
  );
}

