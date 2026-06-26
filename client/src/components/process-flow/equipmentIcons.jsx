export function PumpSymbol({ running, speed = 1, className = '' }) {
  const duration = running ? Math.max(0.3, 2 / Math.max(speed, 0.5)) : 0;
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden="true">
      <rect x="8" y="20" width="84" height="40" rx="6" className="pf-equip-body" />
      <circle cx="28" cy="40" r="14" className="pf-equip-accent" fill="none" strokeWidth="3" />
      <g
        className="pf-rotor"
        style={{
          transformOrigin: '28px 40px',
          animation: running ? `pf-spin ${duration}s linear infinite` : 'none',
        }}
      >
        <line x1="28" y1="28" x2="28" y2="52" className="pf-equip-rotor-line" strokeWidth="3" />
        <line x1="16" y1="40" x2="40" y2="40" className="pf-equip-rotor-line" strokeWidth="3" />
      </g>
      <rect x="62" y="32" width="22" height="16" rx="2" className="pf-equip-detail" />
      <circle cx="92" cy="40" r="5" className="pf-port-out" />
      <circle cx="8" cy="40" r="5" className="pf-port-in" />
    </svg>
  );
}

export function ValveSymbol({ position = 0, className = '' }) {
  const angle = (position / 100) * 90;
  return (
    <svg viewBox="0 0 90 70" className={className} aria-hidden="true">
      <path d="M8 35 L35 15 L35 55 Z" className="pf-equip-body" />
      <path d="M82 35 L55 15 L55 55 Z" className="pf-equip-body" />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '45px 35px' }}>
        <line x1="45" y1="35" x2="45" y2="10" className="pf-equip-stem" strokeWidth="3" />
        <rect x="38" y="4" width="14" height="8" rx="2" className="pf-equip-accent" />
      </g>
      <circle cx="8" cy="35" r="5" className="pf-port-in" />
      <circle cx="82" cy="35" r="5" className="pf-port-out" />
    </svg>
  );
}

export function ThreeWayValveSymbol({ route = 0, open = true, className = '' }) {
  const ports = [
    { cx: 8, cy: 45, active: route === 0 || open },
    { cx: 82, cy: 20, active: route === 1 },
    { cx: 82, cy: 70, active: route === 2 },
  ];
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden="true">
      <circle cx="45" cy="45" r="18" className="pf-equip-body" fill="none" strokeWidth="4" />
      <line x1="45" y1="45" x2="8" y2="45" className="pf-equip-detail" strokeWidth="3" />
      <line x1="45" y1="45" x2="82" y2="20" className="pf-equip-detail" strokeWidth="3" />
      <line x1="45" y1="45" x2="82" y2="70" className="pf-equip-detail" strokeWidth="3" />
      {ports.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r="5"
          className={p.active ? 'pf-port-active' : 'pf-port-in'}
        />
      ))}
    </svg>
  );
}

export function TankSymbol({ level = 0, label = 'tank', className = '' }) {
  const safeId = label.replace(/\W/g, '');
  const fillH = (level / 100) * 56;
  return (
    <svg viewBox="0 0 90 110" className={className} aria-hidden="true">
      <rect x="15" y="20" width="60" height="70" rx="4" className="pf-equip-body" fill="none" strokeWidth="3" />
      <rect
        x="17"
        y={90 - fillH}
        width="56"
        height={fillH}
        className="pf-tank-fill"
      />
      <text x="45" y="105" textAnchor="middle" className="pf-equip-label">
        {Math.round(level)}%
      </text>
      <circle cx="45" cy="12" r="5" className="pf-port-in" />
      <circle cx="45" cy="98" r="5" className="pf-port-out" />
    </svg>
  );
}

export function ColloidSymbol({ running, className = '' }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden="true">
      <rect x="10" y="18" width="80" height="44" rx="8" className="pf-equip-body" />
      <g
        className="pf-rotor"
        style={{
          transformOrigin: '50px 40px',
          animation: running ? 'pf-spin 1.2s linear infinite' : 'none',
        }}
      >
        <ellipse cx="50" cy="40" rx="22" ry="10" className="pf-equip-accent" fill="none" strokeWidth="3" />
        <line x1="28" y1="40" x2="72" y2="40" className="pf-equip-rotor-line" strokeWidth="2" />
      </g>
      <circle cx="8" cy="40" r="5" className="pf-port-in" />
      <circle cx="92" cy="40" r="5" className="pf-port-out" />
    </svg>
  );
}

export function FlowMeterSymbol({ flowRate = 0, className = '' }) {
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden="true">
      <rect x="20" y="15" width="60" height="40" rx="6" className="pf-equip-body" />
      <text x="50" y="42" textAnchor="middle" className="pf-meter-readout">
        {typeof flowRate === 'number' ? flowRate.toFixed(1) : '—'}
      </text>
      <circle cx="8" cy="35" r="5" className="pf-port-in" />
      <circle cx="92" cy="35" r="5" className="pf-port-out" />
    </svg>
  );
}
