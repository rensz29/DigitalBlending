import { useEffect, useState } from 'react';

export default function WasteSaveButton({ date, shift, totalKg, onSaved }) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ exists: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setLoadingStatus(true);
      setError(null);
      try {
        const res = await fetch(`/api/waste-records/status?date=${date}&shift=${shift}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        if (!cancelled) setStatus(body);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [date, shift]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/waste-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, shift }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setStatus({
        exists: true,
        tagged: body.tagged,
        source: body.source,
        savedAt: body.savedAt,
        tagReason: body.tagReason,
      });
      onSaved?.(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const noWaste = !Number.isFinite(Number(totalKg)) || Number(totalKg) <= 0;
  const disabled = saving || loadingStatus || status.exists || noWaste;
  const label = status.exists ? 'Already saved' : saving ? 'Saving…' : 'Save waste';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={handleSave}>
        {label}
      </button>
      {status.exists && (
        <span className="badge badge-ok">
          Saved{status.source ? ` (${status.source})` : ''}
        </span>
      )}
      {!status.exists && noWaste && <span className="badge">No waste to save</span>}
      {error && (
        <span className="badge badge-warn" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
