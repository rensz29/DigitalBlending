import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './normalize.js';
import { computeWaste } from './wasteMetrics.js';
import { WASTEWISE_PREFIX } from './tags.js';

const start = 1781532000;
const end = start + 28800; // 8h

// Normalized series designed so each forwardflow increment's midpoint lands in a
// known valve/mode/SKU state:
//   cycle 1 [ +600, +1800]  Production          -> counted (SKU-A)
//   cycle 2 [+3600, +5400]  Production then CIP  -> part counted (SKU-B), part CIP
//   cycle 3 [+6000, +6600]  CIP                  -> fully excluded (counted=false)
const series = {
  forwardflowTotalKg: [
    { t: start + 0, value: 100 },
    { t: start + 600, value: 110 }, // mid +300  valve Closed        -> ignored
    { t: start + 1200, value: 160 }, // mid +900  cycle1 Production  -> +50 SKU-A
    { t: start + 1800, value: 200 }, // mid +1500 cycle1 Production  -> +40 SKU-A
    { t: start + 3600, value: 260 }, // mid +2700 valve Closed       -> ignored
    { t: start + 4200, value: 300 }, // mid +3900 cycle2 Production  -> +40 SKU-B
    { t: start + 5400, value: 350 }, // mid +4800 cycle2 CIP         -> +50 excluded
    { t: start + 6600, value: 400 }, // mid +6000 cycle3 CIP         -> +50 excluded
  ],
  wasteValve: [
    { t: start + 0, value: 'Closed' },
    { t: start + 600, value: 'Open' },
    { t: start + 1800, value: 'Closed' },
    { t: start + 3600, value: 'Open' },
    { t: start + 5400, value: 'Closed' },
    { t: start + 6000, value: 'Open' },
    { t: start + 6600, value: 'Closed' },
  ],
  clModeDesc: [
    { t: start + 0, value: 'Production' },
    { t: start + 4200, value: 'CIP' },
  ],
  sku: [
    { t: start + 0, value: 'SKU-A' },
    { t: start + 3700, value: 'SKU-B' },
  ],
};

const range = { unixStart: start, unixEnd: end };

test('computeWaste totals only valve-open, non-CIP forwardflow', () => {
  const waste = computeWaste(series, range);
  assert.equal(waste.totalKg, 130); // 50 + 40 + 40
  assert.equal(waste.cipExcludedKg, 100); // 50 (cycle2 CIP) + 50 (cycle3 CIP)
  assert.equal(waste.cycleCount, 3);
});

test('computeWaste per-cycle breakdown splits CIP within a cycle', () => {
  const { cycles } = computeWaste(series, range);

  assert.equal(cycles[0].wasteKg, 90); // 50 + 40, all Production
  assert.equal(cycles[0].excludedCipKg, 0);
  assert.equal(cycles[0].counted, true);
  assert.equal(cycles[0].mode, 'Production');
  assert.equal(cycles[0].durationSec, 1200);

  assert.equal(cycles[1].wasteKg, 40); // Production part only
  assert.equal(cycles[1].excludedCipKg, 50); // CIP part excluded
  assert.equal(cycles[1].counted, true);

  assert.equal(cycles[2].wasteKg, 0); // entirely CIP
  assert.equal(cycles[2].excludedCipKg, 50);
  assert.equal(cycles[2].counted, false);
  assert.equal(cycles[2].mode, 'CIP');
});

test('computeWaste attributes waste to the active SKU', () => {
  const { bySku } = computeWaste(series, range);
  const map = Object.fromEntries(bySku.map((r) => [r.sku, r.kg]));
  assert.equal(map['SKU-A'], 90); // cycle1
  assert.equal(map['SKU-B'], 40); // cycle2 Production part
  assert.equal(bySku[0].sku, 'SKU-A'); // sorted desc
});

test('computeWaste trend buckets sum to the counted total', () => {
  const { trend, totalKg } = computeWaste(series, range);
  const sum = trend.reduce((acc, b) => acc + b.value, 0);
  assert.equal(Math.round(sum * 10) / 10, totalKg);
});

test('normalize maps Wastewise tags (second prefix) to short keys', () => {
  const raw = [
    { tagname: WASTEWISE_PREFIX + 'CL_Mode_Desc', values: [{ unixTime: start, value: 'Production' }] },
    { tagname: WASTEWISE_PREFIX + 'Overall_Forwardflow_Total_Kg', values: [{ unixTime: start, value: 100 }] },
    { tagname: WASTEWISE_PREFIX + 'Waste_Valve_Status', values: [{ unixTime: start, value: 'Open' }] },
  ];
  const s = normalize(raw);
  assert.equal(s.clModeDesc.length, 1);
  assert.equal(s.forwardflowTotalKg.length, 1);
  assert.equal(s.wasteValve.length, 1);
  assert.equal(s.forwardflowTotalKg[0].value, 100);
});
