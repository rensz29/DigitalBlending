import { useState } from 'react';
import { formatKg } from '../utils/format.js';

const TAG_REASONS = [
  'Changeover',
  'Quality reject',
  'Equipment issue',
  'Recipe adjustment',
  'Other',
];

export default function WasteRecordTable({ records, selectedKey, onSelect, onTag, taggingKey }) {
  const [drafts, setDrafts] = useState({});

  function rowKey(record) {
    return `${record.date}|${record.shift}`;
  }

  function setDraft(record, field, value) {
    const key = rowKey(record);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        reason: prev[key]?.reason || '',
        note: prev[key]?.note || '',
        [field]: value,
      },
    }));
  }

  function submitTag(record) {
    const key = rowKey(record);
    const reason = drafts[key]?.reason || '';
    const note = (drafts[key]?.note || '').trim();
    if (!reason) return;
    const tagReason = note ? `${reason} - ${note}` : reason;
    onTag(record, tagReason);
  }

  if (!records.length) {
    return <div className="subtitle">No saved waste records found for the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Shift</th>
            <th>Total Waste</th>
            <th>Cycles</th>
            <th>Source</th>
            <th>Tagged</th>
            <th>Saved At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const key = rowKey(record);
            const isSelected = selectedKey === key;
            const isTagging = taggingKey === key;
            const draft = drafts[key] || { reason: '', note: '' };

            return (
              <tr key={key}>
                <td>{record.date}</td>
                <td>{record.shift}</td>
                <td>{formatKg(record?.waste?.totalKg)}</td>
                <td>{record?.waste?.cycleCount ?? 0}</td>
                <td>
                  <span className="badge">{record.source || 'manual'}</span>
                </td>
                <td>
                  {record.tagged ? (
                    <span className="badge badge-ok">Tagged</span>
                  ) : (
                    <span className="badge badge-warn">Untagged</span>
                  )}
                </td>
                <td>{record.savedAt ? new Date(record.savedAt).toLocaleString() : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onSelect(isSelected ? null : key)}
                    >
                      {isSelected ? 'Hide details' : 'View details'}
                    </button>
                    {!record.tagged && (
                      <>
                        <select
                          value={draft.reason}
                          onChange={(e) => setDraft(record, 'reason', e.target.value)}
                        >
                          <option value="">Select reason</option>
                          {TAG_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Optional note"
                          value={draft.note}
                          onChange={(e) => setDraft(record, 'note', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={!draft.reason || isTagging}
                          onClick={() => submitTag(record)}
                        >
                          {isTagging ? 'Saving…' : 'Tag'}
                        </button>
                      </>
                    )}
                    {record.tagged && <span>{record.tagReason || '—'}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
