import { useEffect, useRef, useState } from 'react';
import WastePanel from './WastePanel.jsx';
import EmptyState from './EmptyState.jsx';
import { SkeletonText, SkeletonOverview } from './Skeleton.jsx';
import LoadingOverlay from './LoadingOverlay.jsx';
import { AlertTriangleIcon, DropletIcon } from './icons.jsx';

// Lazily fetches /api/waste-data for the given date/shift. Mounted only after
// the Wastewise tab is first opened, so the Wastewise tags are never queried on
// the ingredients/History load. Refetches only when date/shift change.
export default function WasteTab({ date, shift }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const lastKey = useRef(null);

  useEffect(() => {
    const key = `${date}|${shift}`;
    if (lastKey.current === key) return; // already loaded for this selection
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/waste-data?date=${date}&shift=${shift}`);
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
          icon={DropletIcon}
          title="No waste data"
          hint="Pick a date and shift above to load Wastewise."
        />
      </div>
    );
  }

  return (
    <div className="panel-loading-host" aria-busy={loading || undefined}>
      {loading && <LoadingOverlay message="Loading waste data…" />}
      <WastePanel waste={data.waste} range={data.range} />
    </div>
  );
}
