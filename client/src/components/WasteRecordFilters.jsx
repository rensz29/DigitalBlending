export default function WasteRecordFilters({ filters, onChange, onApply, onReset, loading }) {
  return (
    <div className="controls" style={{ alignItems: 'flex-end' }}>
      <div className="field">
        <label htmlFor="waste-date-from">Date from</label>
        <input
          id="waste-date-from"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange('dateFrom', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="waste-date-to">Date to</label>
        <input
          id="waste-date-to"
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange('dateTo', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="waste-shift-filter">Shift</label>
        <select
          id="waste-shift-filter"
          value={filters.shift}
          onChange={(e) => onChange('shift', e.target.value)}
        >
          <option value="">All</option>
          <option value="1">Shift 1</option>
          <option value="2">Shift 2</option>
          <option value="3">Shift 3</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="waste-tagged-filter">Tagged</label>
        <select
          id="waste-tagged-filter"
          value={filters.tagged}
          onChange={(e) => onChange('tagged', e.target.value)}
        >
          <option value="">All</option>
          <option value="true">Tagged</option>
          <option value="false">Untagged</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="waste-source-filter">Source</label>
        <select
          id="waste-source-filter"
          value={filters.source}
          onChange={(e) => onChange('source', e.target.value)}
        >
          <option value="">All</option>
          <option value="manual">Manual</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <button type="button" className="btn btn-primary" onClick={onApply} disabled={loading}>
        Apply
      </button>
      <button type="button" className="btn btn-secondary" onClick={onReset} disabled={loading}>
        Reset
      </button>
    </div>
  );
}
