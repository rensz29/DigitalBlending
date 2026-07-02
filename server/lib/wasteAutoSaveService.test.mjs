import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidateShifts, runWasteAutoSaveCycle } from './wasteAutoSaveService.js';

test('buildCandidateShifts returns expected shift windows count', () => {
  const now = Math.floor(Date.UTC(2026, 6, 2, 4, 0, 0) / 1000);
  const candidates = buildCandidateShifts(now, 2);
  assert.equal(candidates.length, 6);
});

test('runWasteAutoSaveCycle saves only positive unsaved waste', async () => {
  const created = [];
  const existing = new Set(['2026-07-01|2']);

  await runWasteAutoSaveCycle({
    nowUnixSeconds: Math.floor(Date.UTC(2026, 6, 2, 6, 0, 0) / 1000),
    graceSeconds: 0,
    lookbackDays: 2,
    logger: { info() {}, warn() {} },
    existsRecordFn: async (date, shift) => existing.has(`${date}|${shift}`),
    fetchWasteForShiftFn: async (date, shift) => ({
      date,
      shift,
      shiftLabel: `Shift ${shift}`,
      range: { unixStart: 1, unixEnd: 2, startLabel: '00:00', endLabel: '01:00' },
      waste: { totalKg: shift === 1 ? 5 : 0, cycleCount: 1, bySku: [], cycles: [], trend: [] },
    }),
    createRecordFn: async (payload) => {
      created.push(payload);
      return payload;
    },
  });

  assert.equal(created.length >= 1, true);
  assert.equal(created.every((item) => item.waste.totalKg > 0), true);
  assert.equal(created.every((item) => item.source === 'auto'), true);
});
