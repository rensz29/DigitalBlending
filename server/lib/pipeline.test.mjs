import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './normalize.js';
import { computeMetrics } from './metrics.js';
import { TAG_PREFIX } from './tags.js';

// Synthetic 8-hour shift (1781532000 -> 1781560800). Values chosen so the
// expected KPIs are easy to verify by hand. Shape mirrors the assumed historian
// response (array of { tagname, values: [{ unixTime, value }] }).
const start = 1781532000;
const end = 1781560800;

const raw = [
  {
    tagname: TAG_PREFIX + 'ESM_Dosed_In_Premix_Kg',
    values: [
      { unixTime: start, value: 0 },
      { unixTime: start + 3600, value: 50 }, // +50 while SKU-A
      { unixTime: start + 7200, value: 120 }, // +70 while SKU-B
    ],
  },
  {
    tagname: TAG_PREFIX + 'Oil_Dosed_To_Premix_Kg',
    values: [
      { unixTime: start, value: 0 },
      { unixTime: start + 3600, value: 12 }, // +12 while SKU-A
      { unixTime: start + 7200, value: 20 }, // +8 while SKU-B
    ],
  },
  {
    tagname: TAG_PREFIX + 'WV_Dosed_To_Premix_Kg',
    values: [
      { unixTime: start, value: 0 },
      { unixTime: start + 3600, value: 5 }, // +5 while SKU-A
      { unixTime: start + 7200, value: 20 }, // +15 while SKU-B
    ],
  },
  {
    tagname: TAG_PREFIX + 'Starch_Dosed_To_Premix_Kg',
    values: [
      { unixTime: start, value: 0 },
      { unixTime: start + 3600, value: 3 }, // +3 while SKU-A
      { unixTime: start + 7200, value: 8 }, // +5 while SKU-B
    ],
  },
  {
    tagname: TAG_PREFIX + 'SKU_Running',
    values: [
      { unixTime: start, value: 'SKU-A' },
      { unixTime: start + 3600, value: 'SKU-B' },
    ],
  },
  {
    tagname: TAG_PREFIX + 'ESM_Dosing_Valve',
    values: [
      { unixTime: start, value: 'Open' },
      { unixTime: start + 1800, value: 'Closed' }, // open for 30 min
    ],
  },
  {
    tagname: TAG_PREFIX + 'Oil_Dosing_Valve',
    values: [
      { unixTime: start, value: 'Open' },
      { unixTime: start + 900, value: 'Closed' }, // open for 15 min
    ],
  },
  {
    tagname: TAG_PREFIX + 'WV_Dosing_Valve',
    values: [
      { unixTime: start + 3600, value: 'Open' },
      { unixTime: start + 5400, value: 'Closed' }, // open for 30 min during SKU-B
    ],
  },
  {
    tagname: TAG_PREFIX + 'Starch_Dosing_Valve',
    values: [
      { unixTime: start, value: 'Open' },
      { unixTime: start + 600, value: 'Closed' }, // open for 10 min
    ],
  },
  {
    tagname: TAG_PREFIX + 'CL_Status',
    values: [
      { unixTime: start, value: 'Running' },
      { unixTime: start + 14400, value: 'Stopped' }, // running first 4h of 8h
    ],
  },
  {
    tagname: TAG_PREFIX + 'ESM_Flowmeter_Flowrate_Kgpm',
    values: [
      { unixTime: start, value: 10 },
      { unixTime: start + 14400, value: 20 }, // 10 kg/min for 4h, then 20 for 4h
    ],
  },
];

test('normalize maps tags to short keys and sorts points', () => {
  const series = normalize(raw);
  assert.equal(series.esmDosed.length, 3);
  assert.equal(series.oilDosed.length, 3);
  assert.equal(series.wvDosed.length, 3);
  assert.equal(series.starchDosed.length, 3);
  assert.equal(series.sku.length, 2);
  assert.equal(series.esmDosed[0].t, start);
});

test('computeMetrics derives expected KPIs', () => {
  const series = normalize(raw);
  const { kpis, skuBreakdown } = computeMetrics(series, {
    unixStart: start,
    unixEnd: end,
  });

  assert.equal(kpis.totalEsmKg, 120); // 50 + 70
  assert.equal(kpis.totalOilKg, 20); // 12 + 8
  assert.equal(kpis.totalWvKg, 20); // 5 + 15
  assert.equal(kpis.totalStarchKg, 8); // 3 + 5
  assert.equal(kpis.runningPct, 50); // 4h running of 8h
  assert.equal(kpis.valveOpenSeconds, 1800); // 30 min ESM open
  assert.equal(kpis.oilValveOpenSeconds, 900); // 15 min
  assert.equal(kpis.wvValveOpenSeconds, 1800); // 30 min
  assert.equal(kpis.starchValveOpenSeconds, 600); // 10 min
  assert.equal(kpis.skuCount, 2);

  const bySku = Object.fromEntries(skuBreakdown.map((r) => [r.sku, r]));
  assert.equal(bySku['SKU-A'].esmKg, 50);
  assert.equal(bySku['SKU-B'].esmKg, 70);
  assert.equal(bySku['SKU-A'].oilKg, 12);
  assert.equal(bySku['SKU-B'].oilKg, 8);
  assert.equal(bySku['SKU-A'].wvKg, 5);
  assert.equal(bySku['SKU-B'].wvKg, 15);
  assert.equal(bySku['SKU-A'].starchKg, 3);
  assert.equal(bySku['SKU-B'].starchKg, 5);
  assert.equal(kpis.avgEsmFlowKgpm, 15); // time-weighted avg of 10 and 20 over 8h
});
