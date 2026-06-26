import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftRange } from './shifts.js';

// Known-good window from the original index.js: 2026-06-15 shift 3, Asia/Manila
// (22:00 -> 06:00 next day == 1781532000 -> 1781560800).
test('shift 3 matches the original index.js window', () => {
  assert.deepEqual(shiftRange('2026-06-15', 3, 8), {
    unixStart: 1781532000,
    unixEnd: 1781560800,
  });
});

test('each shift spans exactly 8 hours', () => {
  for (const shift of [1, 2, 3]) {
    const { unixStart, unixEnd } = shiftRange('2026-06-09', shift, 8);
    assert.equal(unixEnd - unixStart, 8 * 3600);
  }
});

test('shift 1 starts at 06:00 Manila == 22:00 UTC previous day', () => {
  const { unixStart } = shiftRange('2026-06-09', 1, 8);
  // 06:00 +08:00 == 2026-06-08T22:00:00Z
  assert.equal(unixStart, Math.floor(Date.parse('2026-06-08T22:00:00Z') / 1000));
});

test('shift 3 end rolls into the next day (06:00 Manila)', () => {
  const { unixEnd } = shiftRange('2026-06-09', 3, 8);
  // 06:00 next day +08:00 == 2026-06-09T22:00:00Z
  assert.equal(unixEnd, Math.floor(Date.parse('2026-06-09T22:00:00Z') / 1000));
});

test('shifts 1 and 2 are contiguous', () => {
  const s1 = shiftRange('2026-06-09', 1, 8);
  const s2 = shiftRange('2026-06-09', 2, 8);
  assert.equal(s1.unixEnd, s2.unixStart);
});
