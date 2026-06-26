export const EQUIPMENT_TYPES = {
  pump: {
    type: 'pump',
    label: 'Pump',
    width: 100,
    height: 80,
    bindings: [
      { key: 'running', label: 'Running', kind: 'bool' },
      { key: 'speed', label: 'Speed (optional)', kind: 'numeric' },
    ],
  },
  flowControlValve: {
    type: 'flowControlValve',
    label: 'Flow Control Valve',
    width: 90,
    height: 70,
    bindings: [
      { key: 'position', label: 'Position (0–100)', kind: 'numeric' },
      { key: 'open', label: 'Open (bool fallback)', kind: 'bool' },
    ],
  },
  threeWayValve: {
    type: 'threeWayValve',
    label: '3-Way Valve',
    width: 90,
    height: 90,
    bindings: [
      { key: 'route', label: 'Route (0–2)', kind: 'numeric' },
      { key: 'open', label: 'Open (bool fallback)', kind: 'bool' },
    ],
  },
  premixTank: {
    type: 'premixTank',
    label: 'Premix Tank',
    width: 90,
    height: 110,
    bindings: [{ key: 'level', label: 'Level (%)', kind: 'numeric' }],
  },
  colloid: {
    type: 'colloid',
    label: 'Colloid',
    width: 100,
    height: 80,
    bindings: [{ key: 'running', label: 'Running', kind: 'bool' }],
  },
  headTank: {
    type: 'headTank',
    label: 'Head Tank',
    width: 90,
    height: 110,
    bindings: [{ key: 'level', label: 'Level (%)', kind: 'numeric' }],
  },
  flowMeter: {
    type: 'flowMeter',
    label: 'Digital Flow Meter',
    width: 100,
    height: 70,
    bindings: [{ key: 'flowRate', label: 'Flow Rate', kind: 'numeric' }],
  },
};

export const PALETTE_ITEMS = Object.values(EQUIPMENT_TYPES);

export function defaultBindingsForType(type) {
  const meta = EQUIPMENT_TYPES[type];
  if (!meta) return {};
  return Object.fromEntries(meta.bindings.map((b) => [b.key, '']));
}

export function defaultNodeData(type, label) {
  const meta = EQUIPMENT_TYPES[type];
  return {
    label: label || meta?.label || type,
    bindings: defaultBindingsForType(type),
  };
}
