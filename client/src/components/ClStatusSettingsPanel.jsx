import { useCallback, useEffect, useState } from 'react';

function rowFromStatus(status) {
  return {
    code: status.code,
    label: status.label,
    color: status.color,
    countsAsRunning: Boolean(status.countsAsRunning),
  };
}

export default function ClStatusSettingsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/cl-statuses');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setRows(body.map(rowFromStatus));
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  function updateRow(code, field, value) {
    setRows((prev) =>
      prev.map((row) => (row.code === code ? { ...row, [field]: value } : row))
    );
    setSuccess(null);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/cl-statuses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setRows(body.map(rowFromStatus));
      setSuccess('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="settings-toolbar">
        <h2>Continuous Line Status</h2>
        <button type="button" className="load-btn" disabled={saving || loading} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <p className="muted settings-tab-desc">
        Configure labels, colors, and which states count toward Line Running % on the dashboard.
      </p>

      {loading && <p className="muted">Loading statuses…</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Label</th>
                <th>Color</th>
                <th>Counts as running</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code}>
                  <td className="cl-status-code">[{row.code}]</td>
                  <td>
                    <input
                      type="text"
                      className="table-input"
                      value={row.label}
                      onChange={(e) => updateRow(row.code, 'label', e.target.value)}
                    />
                  </td>
                  <td>
                    <div className="color-field">
                      <input
                        type="color"
                        className="color-input"
                        value={row.color}
                        onChange={(e) => updateRow(row.code, 'color', e.target.value)}
                      />
                      <input
                        type="text"
                        className="table-input color-text"
                        value={row.color}
                        onChange={(e) => updateRow(row.code, 'color', e.target.value)}
                      />
                      <span
                        className="swatch"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                    </div>
                  </td>
                  <td className="cl-status-check">
                    <input
                      type="checkbox"
                      checked={row.countsAsRunning}
                      onChange={(e) => updateRow(row.code, 'countsAsRunning', e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
