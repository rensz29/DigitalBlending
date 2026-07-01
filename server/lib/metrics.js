// KPI + SKU-breakdown computations from normalized series.

import { INGREDIENTS } from './tags.js';
import { parseClStatusCode } from './clStatusStore.js';

// --- state predicates ----------------------------------------------------

// True when a CL_Status / valve sample represents an "active" state.
function isTruthyState(value, activeWords) {
  if (value === 1 || value === true) return true;
  if (value === 0 || value === false) return false;
  if (typeof value === 'string') {
    return activeWords.test(value.trim());
  }
  return false;
}

const RUNNING = /^(run|running|on|true|1|started|auto)$/i;
const OPEN = /^(open|opened|on|true|1)$/i;

const isRunning = (v) => isTruthyState(v, RUNNING);
export const isOpen = (v) => isTruthyState(v, OPEN);

// --- time helpers --------------------------------------------------------

// Step-function value active at time t (last sample at or before t).
export function valueAt(points, t) {
  let v;
  for (const p of points) {
    if (p.t <= t) v = p.value;
    else break;
  }
  return v;
}

// Seconds within [start, end] for which predicate(value) holds, treating each
// sample's value as constant until the next sample (step / zero-order hold).
function activeSeconds(points, predicate, start, end) {
  if (!points.length) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const segStart = Math.max(points[i].t, start);
    const segEnd = i + 1 < points.length ? points[i + 1].t : end;
    const clipped = Math.min(segEnd, end);
    if (clipped > segStart && predicate(points[i].value)) {
      total += clipped - segStart;
    }
  }
  return total;
}

// --- accumulation --------------------------------------------------------

// Sum of positive increments of a (possibly resetting) running counter.
// Equals last - first when the counter only increases.
function accumulate(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Number(points[i].value) - Number(points[i - 1].value);
    if (Number.isFinite(d) && d > 0) total += d;
  }
  return total;
}

// Attribute each positive dosed increment to the SKU active at that moment.
function dosedBySku(dosed, sku) {
  const totals = new Map();
  for (let i = 1; i < dosed.length; i++) {
    const d = Number(dosed[i].value) - Number(dosed[i - 1].value);
    if (!Number.isFinite(d) || d <= 0) continue;
    const mid = (dosed[i - 1].t + dosed[i].t) / 2;
    const activeSku = String(valueAt(sku, mid) ?? 'Unknown').trim() || 'Unknown';
    totals.set(activeSku, (totals.get(activeSku) || 0) + d);
  }
  return totals;
}

function mergeSkuBreakdown(byIngredient) {
  const skus = new Set();
  for (const { map } of byIngredient) {
    for (const sku of map.keys()) skus.add(sku);
  }

  const rows = [...skus].map((sku) => {
    const row = { sku };
    let totalKg = 0;
    for (const { kgField, map } of byIngredient) {
      const kg = round(map.get(sku) || 0, 1);
      row[kgField] = kg;
      totalKg += kg;
    }
    row._totalKg = totalKg;
    return row;
  });

  return rows
    .sort((a, b) => b._totalKg - a._totalKg)
    .map(({ _totalKg, ...row }) => row);
}

function totalKgField(id) {
  if (id === 'esm') return 'totalEsmKg';
  return `total${id.charAt(0).toUpperCase() + id.slice(1)}Kg`;
}

function valveSecondsField(id) {
  if (id === 'esm') return 'valveOpenSeconds';
  return `${id}ValveOpenSeconds`;
}

function valvePctField(id) {
  if (id === 'esm') return 'valveOpenPct';
  return `${id}ValveOpenPct`;
}

function avgFlowField(id) {
  if (id === 'esm') return 'avgEsmFlowKgpm';
  return `avg${id.charAt(0).toUpperCase() + id.slice(1)}FlowKgpm`;
}

function avgDensityField(id) {
  return `avg${id.charAt(0).toUpperCase() + id.slice(1)}Density`;
}

function avgTempField(id) {
  return `avg${id.charAt(0).toUpperCase() + id.slice(1)}Temp`;
}

export function averageFlowrateKgpm(points, start, end) {
  if (!points?.length) return 0;

  let weightedSum = 0;
  let totalSeconds = 0;

  for (let i = 0; i < points.length; i++) {
    const segStart = Math.max(points[i].t, start);
    const segEnd = i + 1 < points.length ? points[i + 1].t : end;
    const clippedEnd = Math.min(segEnd, end);
    const duration = clippedEnd - segStart;
    if (duration <= 0) continue;

    const value = Number(points[i].value);
    if (!Number.isFinite(value) || value < 0) continue;

    weightedSum += value * duration;
    totalSeconds += duration;
  }

  if (!totalSeconds) return 0;
  return round(weightedSum / totalSeconds, 2);
}

// --- public API ----------------------------------------------------------

export function computeMetrics(series, range, options = {}) {
  const { unixStart, unixEnd } = range;
  const duration = unixEnd - unixStart || 1;

  const sku = series.sku || [];
  const cl = series.clStatus || [];

  const runningStatusCodes = options.runningStatusCodes;
  const isLineRunning =
    runningStatusCodes instanceof Set
      ? (v) => {
          const code = parseClStatusCode(v);
          return code !== null && runningStatusCodes.has(code);
        }
      : isRunning;

  const runningSeconds = activeSeconds(cl, isLineRunning, unixStart, unixEnd);

  const skusRun = [
    ...new Set(
      sku
        .map((p) => p.value)
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
        .map(String)
    ),
  ];

  const kpis = {
    runningPct: round((runningSeconds / duration) * 100, 1),
    runningSeconds,
    skuCount: skusRun.length,
    skusRun,
  };

  const byIngredient = INGREDIENTS.map((ing) => {
    const dosed = series[ing.dosedKey] || [];
    const valve = series[ing.valveKey] || [];
    const flow = series[ing.flowKey] || [];
    const density = series[ing.densityKey] || [];
    const temp = series[ing.tempKey] || [];
    const totalKg = accumulate(dosed);
    const valveOpenSeconds = activeSeconds(valve, isOpen, unixStart, unixEnd);

    kpis[totalKgField(ing.id)] = round(totalKg, 1);
    kpis[valveSecondsField(ing.id)] = valveOpenSeconds;
    kpis[valvePctField(ing.id)] = round((valveOpenSeconds / duration) * 100, 1);
    kpis[avgFlowField(ing.id)] = averageFlowrateKgpm(flow, unixStart, unixEnd);
    // averageFlowrateKgpm is a generic time-weighted average of a numeric series.
    kpis[avgDensityField(ing.id)] = averageFlowrateKgpm(density, unixStart, unixEnd);
    kpis[avgTempField(ing.id)] = averageFlowrateKgpm(temp, unixStart, unixEnd);

    return { kgField: ing.kgField, map: dosedBySku(dosed, sku) };
  });

  return { kpis, skuBreakdown: mergeSkuBreakdown(byIngredient) };
}

function round(n, dp) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
