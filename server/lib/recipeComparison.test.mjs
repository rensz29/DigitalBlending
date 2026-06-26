import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareToTargets, isWithinTolerance, VARIANCE_TOLERANCE_PP } from './recipeComparison.js';

test('compareToTargets computes actual % from kg', () => {
  const result = compareToTargets(
    [{ sku: 'SKU-A', esmKg: 50, oilKg: 12, wvKg: 5, starchKg: 3 }],
    []
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].totalKg, 70);
  assert.equal(result[0].actual.esm, 71.43);
  assert.equal(result[0].actual.oil, 17.14);
  assert.equal(result[0].actual.wv, 7.14);
  assert.equal(result[0].actual.starch, 4.29);
  assert.equal(result[0].hasTarget, false);
  assert.equal(result[0].variance, null);
});

test('compareToTargets joins target recipe by product name', () => {
  const result = compareToTargets(
    [{ sku: 'LCM', esmKg: 14.52, oilKg: 73.77, wvKg: 11.71, starchKg: 0 }],
    [{ product: 'LCM', esm: 14.52, oil: 73.77, starch: 0, wv: 11.71 }]
  );

  assert.equal(result[0].hasTarget, true);
  assert.deepEqual(result[0].target, {
    esm: 14.52,
    oil: 73.77,
    starch: 0,
    wv: 11.71,
  });
  assert.equal(result[0].actual.esm, 14.52);
  assert.equal(result[0].actual.oil, 73.77);
  assert.deepEqual(result[0].variance, { esm: 0, oil: 0, starch: 0, wv: 0 });
});

test('compareToTargets handles missing recipe', () => {
  const result = compareToTargets(
    [{ sku: 'UNKNOWN', esmKg: 10, oilKg: 20, wvKg: 30, starchKg: 40 }],
    [{ product: 'LCM', esm: 14.52, oil: 73.77, starch: 0, wv: 11.71 }]
  );

  assert.equal(result[0].hasTarget, false);
  assert.equal(result[0].target, null);
  assert.equal(result[0].variance, null);
});

test('compareToTargets handles zero total kg', () => {
  const result = compareToTargets(
    [{ sku: 'LCM', esmKg: 0, oilKg: 0, wvKg: 0, starchKg: 0 }],
    [{ product: 'LCM', esm: 14.52, oil: 73.77, starch: 0, wv: 11.71 }]
  );

  assert.equal(result[0].totalKg, 0);
  assert.equal(result[0].actual.esm, null);
  assert.equal(result[0].actual.oil, null);
  assert.equal(result[0].hasTarget, true);
  assert.equal(result[0].variance, null);
});

test('compareToTargets computes variance as actual minus target', () => {
  const result = compareToTargets(
    [{ sku: 'SKU-A', esmKg: 50, oilKg: 12, wvKg: 5, starchKg: 3 }],
    [{ product: 'SKU-A', esm: 10, oil: 20, starch: 30, wv: 40 }]
  );

  assert.equal(result[0].variance.esm, round(71.43 - 10, 2));
  assert.equal(result[0].variance.oil, round(17.14 - 20, 2));
  assert.equal(result[0].variance.wv, round(7.14 - 40, 2));
  assert.equal(result[0].variance.starch, round(4.29 - 30, 2));
});

test('isWithinTolerance respects configured threshold', () => {
  assert.equal(isWithinTolerance(1.5), true);
  assert.equal(isWithinTolerance(-2), true);
  assert.equal(isWithinTolerance(2.01), false);
  assert.equal(VARIANCE_TOLERANCE_PP, 2);
});

function round(n, dp) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
