/* Shared number/value formatting helpers. */

// Measurement units for ingredient density/temp (confirmed from live tags:
// density ≈ 0.9–1.05 → kg/L, temperature in °C).
export const DENSITY_UNIT = 'kg/L';
export const TEMP_UNIT = '°C';
export const FLOW_RATE_UNIT = 'kg/min';

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatKg(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${formatNumber(value, digits)} kg`;
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${formatNumber(value, digits)}%`;
}
