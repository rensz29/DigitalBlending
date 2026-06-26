import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('parseClStatusCode handles number and string forms', async () => {
  const { parseClStatusCode } = await import('./clStatusStore.js');
  assert.equal(parseClStatusCode(10), 10);
  assert.equal(parseClStatusCode('10'), 10);
  assert.equal(parseClStatusCode('[10] Continuous Batch'), 10);
  assert.equal(parseClStatusCode('Running'), null);
  assert.equal(parseClStatusCode(null), null);
});

test('validateClStatuses rejects duplicate codes and bad colors', async () => {
  const { validateClStatuses } = await import('./clStatusStore.js');
  assert.match(
    validateClStatuses([
      { code: 0, label: 'Idle', color: '#64748b', countsAsRunning: false },
      { code: 0, label: 'Dup', color: '#64748b', countsAsRunning: false },
    ]),
    /Duplicate/
  );
  assert.match(
    validateClStatuses([{ code: 1, label: 'Bad', color: 'red', countsAsRunning: true }]),
    /hex color/
  );
});

test('getRunningCodes returns configured codes', async () => {
  const { getRunningCodes } = await import('./clStatusStore.js');
  const codes = getRunningCodes([
    { code: 0, countsAsRunning: false },
    { code: 10, countsAsRunning: true },
    { code: 11, countsAsRunning: false },
    { code: 17, countsAsRunning: true },
  ]);
  assert.deepEqual([...codes].sort(), [10, 17]);
});

test('updateClStatuses round-trip', async () => {
  const realDataFile = path.join(__dirname, '../data/cl-statuses.json');
  const backup = await fs.readFile(realDataFile, 'utf8');

  try {
    const { listClStatuses, updateClStatuses } = await import('./clStatusStore.js');
    const original = await listClStatuses();
    const updated = original.map((s) =>
      s.code === 10 ? { ...s, color: '#00ff00', countsAsRunning: false } : s
    );
    await updateClStatuses(updated);
    const fetched = await listClStatuses();
    const batch = fetched.find((s) => s.code === 10);
    assert.equal(batch.color, '#00ff00');
    assert.equal(batch.countsAsRunning, false);
  } finally {
    await fs.writeFile(realDataFile, backup, 'utf8');
  }
});
