import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDosingErrorsByWindow } from './dosingErrorByWindow.js';

const range = { unixStart: 0, unixEnd: 120 };

const series = {
  sku: [
    { t: 0, value: 'SKU-A' },
    { t: 50, value: 'SKU-B' },
    { t: 90, value: 'SKU-X' },
  ],
  valve: [
    { t: 0, value: 'Closed' },
    { t: 10, value: 'Open' },
    { t: 30, value: 'Closed' },
  ],
  oilValve: [
    { t: 0, value: 'Closed' },
    { t: 60, value: 'Open' },
    { t: 80, value: 'Closed' },
  ],
  wvValve: [
    { t: 0, value: 'Closed' },
    { t: 95, value: 'Open' },
    { t: 110, value: 'Closed' },
  ],
  starchValve: [{ t: 0, value: 'Closed' }],

  esmDosed: [
    { t: 0, value: 0 },
    { t: 20, value: 5 },
    { t: 40, value: 5 },
  ],
  oilDosed: [
    { t: 0, value: 0 },
    { t: 22, value: 3 },
    { t: 70, value: 4 },
  ],
  wvDosed: [
    { t: 0, value: 0 },
    { t: 24, value: 2 },
    { t: 100, value: 3 },
  ],
  starchDosed: [
    { t: 0, value: 0 },
    { t: 72, value: 1 },
  ],
};

const recipes = [
  { product: 'SKU-A', esm: 50, oil: 30, wv: 20, starch: 0 },
  { product: 'SKU-B', esm: 40, oil: 0, wv: 40, starch: 20 },
];

test('computeDosingErrorsByWindow computes per-valve windows and relative errors', () => {
  const rows = computeDosingErrorsByWindow(series, range, recipes);
  assert.equal(rows.length, 3);

  const esm = rows.find((r) => r.ingredientId === 'esm');
  assert.equal(esm.windowStart, 10);
  assert.equal(esm.windowEnd, 30);
  assert.equal(esm.sku, 'SKU-A');
  assert.equal(esm.windowTotalKg, 10);
  assert.equal(esm.actual.esm, 50);
  assert.equal(esm.actual.oil, 30);
  assert.equal(esm.actual.wv, 20);
  assert.equal(esm.errorPct.esm, 0);
  assert.equal(esm.errorPct.oil, 0);
  assert.equal(esm.errorPct.wv, 0);

  const oil = rows.find((r) => r.ingredientId === 'oil');
  assert.equal(oil.sku, 'SKU-B');
  assert.equal(oil.windowTotalKg, 1);
  assert.equal(oil.actual.oil, 0);
  assert.equal(oil.actual.wv, 100);
  assert.equal(oil.target.oil, 0);
  assert.equal(oil.errorPct.oil, null); // target zero -> no relative error

  const wv = rows.find((r) => r.ingredientId === 'wv');
  assert.equal(wv.sku, 'SKU-X');
  assert.equal(wv.hasTarget, false);
  assert.equal(wv.errorPct, null);
});

test('computeDosingErrorsByWindow marks no-dosing windows', () => {
  const zeroSeries = {
    ...series,
    wvDosed: [{ t: 0, value: 0 }, { t: 120, value: 0 }],
  };
  const rows = computeDosingErrorsByWindow(zeroSeries, range, recipes);
  const wv = rows.find((r) => r.ingredientId === 'wv');
  assert.equal(wv.noDosing, true);
  assert.equal(wv.windowTotalKg, 0);
});
