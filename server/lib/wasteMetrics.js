// Wastewise: total waste (kg) for a shift, computed from the waste valve, the
// Overall_Forwardflow_Total_Kg counter, and the CL mode description.
//
// Waste = sum of positive increments of forwardflowTotalKg over time where the
// waste valve is OPEN and the CL mode does NOT contain "CIP". CIP flow is
// cleaning fluid, not product waste, so it is excluded at sample granularity
// (a valve-open cycle that switches Production -> CIP counts only the Production
// portion).

import { valueAt, isOpen } from './metrics.js';
import { formatLocalTime } from './shifts.js';

const TREND_BUCKET_SECONDS = 900; // 15 min

// CL_Mode_Desc values: Idle / Start Production / Production / end prod / CIP.
function isCip(value) {
  return typeof value === 'string' && /cip/i.test(value);
}

function round(n, dp = 1) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

// Waste-valve open intervals within [start, end] (step / zero-order hold).
function openSegments(valve, start, end) {
  const segs = [];
  if (!valve || !valve.length) return segs;
  for (let i = 0; i < valve.length; i++) {
    const segStart = Math.max(valve[i].t, start);
    const next = i + 1 < valve.length ? valve[i + 1].t : end;
    const segEnd = Math.min(next, end);
    if (segEnd > segStart && isOpen(valve[i].value)) {
      segs.push({ start: segStart, end: segEnd });
    }
  }
  return segs;
}

export function computeWaste(series, range) {
  const { unixStart, unixEnd } = range;
  const flow = series.forwardflowTotalKg || [];
  const valve = series.wasteValve || [];
  const mode = series.clModeDesc || [];
  const sku = series.sku || [];

  let totalKg = 0;
  let cipExcludedKg = 0;
  const bySkuMap = new Map();

  // Fixed-width buckets for the trend chart.
  const buckets = [];
  for (let s = unixStart; s < unixEnd; s += TREND_BUCKET_SECONDS) {
    const e = Math.min(s + TREND_BUCKET_SECONDS, unixEnd);
    buckets.push({ start: s, mid: (s + e) / 2, value: 0 });
  }
  const bucketFor = (t) => {
    if (t < unixStart || t >= unixEnd) return null;
    const idx = Math.floor((t - unixStart) / TREND_BUCKET_SECONDS);
    return buckets[Math.min(idx, buckets.length - 1)] || null;
  };

  // Attribute each positive forwardflow increment by the state at its midpoint.
  for (let i = 1; i < flow.length; i++) {
    const d = Number(flow[i].value) - Number(flow[i - 1].value);
    if (!Number.isFinite(d) || d <= 0) continue;
    const mid = (flow[i - 1].t + flow[i].t) / 2;
    if (mid < unixStart || mid >= unixEnd) continue;
    if (!isOpen(valueAt(valve, mid))) continue; // only while waste valve open
    if (isCip(valueAt(mode, mid))) {
      cipExcludedKg += d; // cleaning flow — not product waste
      continue;
    }
    totalKg += d;
    const skuName = String(valueAt(sku, mid) ?? 'Unknown').trim() || 'Unknown';
    bySkuMap.set(skuName, (bySkuMap.get(skuName) || 0) + d);
    const b = bucketFor(mid);
    if (b) b.value += d;
  }

  // Per valve-open cycle breakdown (auditable rows behind the total).
  const cycles = openSegments(valve, unixStart, unixEnd).map((seg) => {
    let wasteKg = 0;
    let excludedCipKg = 0;
    for (let i = 1; i < flow.length; i++) {
      const d = Number(flow[i].value) - Number(flow[i - 1].value);
      if (!Number.isFinite(d) || d <= 0) continue;
      const mid = (flow[i - 1].t + flow[i].t) / 2;
      if (mid < seg.start || mid >= seg.end) continue;
      if (isCip(valueAt(mode, mid))) excludedCipKg += d;
      else wasteKg += d;
    }
    const modeLabel = String(valueAt(mode, seg.start) ?? '').trim() || '—';
    return {
      start: seg.start,
      end: seg.end,
      startLabel: formatLocalTime(seg.start),
      endLabel: formatLocalTime(seg.end),
      durationSec: seg.end - seg.start,
      mode: modeLabel,
      wasteKg: round(wasteKg),
      excludedCipKg: round(excludedCipKg),
      counted: wasteKg > 0,
    };
  });

  const bySku = [...bySkuMap.entries()]
    .map(([skuName, kg]) => ({ sku: skuName, kg: round(kg) }))
    .sort((a, b) => b.kg - a.kg);

  const trend = buckets.map((b) => ({
    t: b.mid,
    label: formatLocalTime(b.start),
    value: round(b.value),
  }));

  return {
    totalKg: round(totalKg),
    cipExcludedKg: round(cipExcludedKg),
    cycleCount: cycles.length,
    cycles,
    bySku,
    trend,
  };
}
