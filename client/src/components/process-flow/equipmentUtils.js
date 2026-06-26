import { toChartNumber } from '../../utils/chart.js';

export function tagValue(tags, nodeId) {
  if (!nodeId) return null;
  return tags[nodeId]?.value ?? null;
}

export function tagStatus(tags, nodeId) {
  if (!nodeId) return null;
  return tags[nodeId]?.statusCode ?? null;
}

export function asBool(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return Boolean(value);
}

export function asNumber(value, fallback = 0) {
  const n = toChartNumber(value);
  return n !== null ? n : fallback;
}

export function asPercent(value) {
  const n = asNumber(value, 0);
  return Math.min(100, Math.max(0, n));
}

export function isEquipmentFlowing(type, bindings, tags) {
  switch (type) {
    case 'pump':
    case 'colloid':
      return asBool(tagValue(tags, bindings.running));
    case 'flowControlValve': {
      const pos = asNumber(tagValue(tags, bindings.position), -1);
      if (pos >= 0) return pos > 5;
      return asBool(tagValue(tags, bindings.open));
    }
    case 'threeWayValve':
      return asBool(tagValue(tags, bindings.open)) || asNumber(tagValue(tags, bindings.route), 0) >= 0;
    case 'flowMeter':
      return asNumber(tagValue(tags, bindings.flowRate), 0) > 0;
    case 'premixTank':
    case 'headTank':
      return asPercent(tagValue(tags, bindings.level)) > 0;
    default:
      return false;
  }
}

export function formatTagValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const n = toChartNumber(value);
  if (n !== null) return n.toFixed(1);
  return String(value);
}
