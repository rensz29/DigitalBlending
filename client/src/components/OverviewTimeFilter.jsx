import { useEffect, useState } from 'react';
import { viewRangeFromTimes, isFullShift } from '../lib/shiftWindow.js';

export default function OverviewTimeFilter({
  shiftRange,
  date,
  shift,
  viewRange,
  onApply,
  onReset,
}) {
  const [fromTime, setFromTime] = useState(shiftRange?.startLabel ?? '');
  const [toTime, setToTime] = useState(shiftRange?.endLabel ?? '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setFromTime(shiftRange?.startLabel ?? '');
    setToTime(shiftRange?.endLabel ?? '');
    setError(null);
  }, [shiftRange, date, shift]);

  function apply() {
    const result = viewRangeFromTimes(shiftRange, date, shift, fromTime, toTime);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    onApply(result);
  }

  function reset() {
    setFromTime(shiftRange.startLabel);
    setToTime(shiftRange.endLabel);
    setError(null);
    onReset();
  }

  const filtered = !isFullShift(viewRange, shiftRange);

  return (
    <div className="overview-time-filter">
      <div className="field">
        <label htmlFor="overview-from">From</label>
        <input
          id="overview-from"
          type="time"
          className="overview-time-input"
          value={fromTime}
          onChange={(e) => {
            setFromTime(e.target.value);
            setError(null);
          }}
        />
      </div>
      <div className="field">
        <label htmlFor="overview-to">To</label>
        <input
          id="overview-to"
          type="time"
          className="overview-time-input"
          value={toTime}
          onChange={(e) => {
            setToTime(e.target.value);
            setError(null);
          }}
        />
      </div>
      <button type="button" className="load-btn" onClick={apply}>
        Apply
      </button>
      <button type="button" className="btn-secondary" onClick={reset} disabled={!filtered}>
        Reset
      </button>
      {filtered && (
        <p className="muted overview-time-note">
          Showing {viewRange.startLabel}–{viewRange.endLabel} (shift {shiftRange.startLabel}–
          {shiftRange.endLabel})
        </p>
      )}
      {Number(shift) === 3 && (
        <p className="muted overview-time-hint">
          Shift 3 crosses midnight — times before 22:00 use the next calendar day.
        </p>
      )}
      {error && <p className="error overview-time-error">{error}</p>}
    </div>
  );
}
