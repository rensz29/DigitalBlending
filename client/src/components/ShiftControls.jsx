const SHIFTS = [
  { id: 1, label: 'Shift 1', time: '6am–2pm' },
  { id: 2, label: 'Shift 2', time: '2pm–10pm' },
  { id: 3, label: 'Shift 3', time: '10pm–6am' },
];

export default function ShiftControls({
  date,
  shift,
  loading,
  onDateChange,
  onShiftChange,
  onLoad,
}) {
  return (
    <div className="controls">
      <div className="field">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Shift</label>
        <div className="shift-group">
          {SHIFTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`shift-btn ${shift === s.id ? 'active' : ''}`}
              onClick={() => onShiftChange(s.id)}
              title={s.time}
            >
              {s.label}
              <br />
              <small style={{ opacity: 0.8 }}>{s.time}</small>
            </button>
          ))}
        </div>
      </div>

      <button className="load-btn" onClick={onLoad} disabled={loading}>
        {loading ? 'Loading…' : 'Load'}
      </button>
    </div>
  );
}
