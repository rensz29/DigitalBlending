const INTERVALS = [
  { label: "1s", value: 1000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
];

export default function IntervalSelector({ value, onChange, disabled }) {
  return (
    <div className="interval-selector" role="group" aria-label="Refresh interval">
      {INTERVALS.map((interval) => (
        <button
          key={interval.value}
          type="button"
          className={`interval-option ${value === interval.value ? "active" : ""}`}
          onClick={() => onChange(interval.value)}
          disabled={disabled}
        >
          {interval.label}
        </button>
      ))}
    </div>
  );
}
