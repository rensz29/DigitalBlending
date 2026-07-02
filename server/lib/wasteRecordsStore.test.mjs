import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const realDataFile = path.join(__dirname, '../data/waste-records.json');

test('create/list/get/tag waste records', async () => {
  const backup = await fs.readFile(realDataFile, 'utf8');
  try {
    const { createRecord, listRecords, getRecord, tagRecord } = await import('./wasteRecordsStore.js');
    const testDate = `2099-12-${String((Date.now() % 27) + 1).padStart(2, '0')}`;
    const testShift = 2;

    const created = await createRecord({
      date: testDate,
      shift: testShift,
      shiftLabel: 'Shift 2 (2pm–10pm)',
      range: { unixStart: 1, unixEnd: 2, startLabel: '14:00', endLabel: '22:00' },
      waste: { totalKg: 12.3, cycleCount: 2, bySku: [], cycles: [], trend: [] },
      source: 'manual',
    });
    assert.equal(created.tagged, false);

    const fetched = await getRecord(testDate, testShift);
    assert.equal(fetched.waste.totalKg, 12.3);

    const tagged = await tagRecord(testDate, testShift, { tagReason: 'Changeover' });
    assert.equal(tagged.tagged, true);
    assert.equal(tagged.tagReason, 'Changeover');

    const taggedList = await listRecords({ tagged: 'true' });
    assert.equal(taggedList.some((row) => row.date === testDate && row.shift === testShift), true);
  } finally {
    await fs.writeFile(realDataFile, backup, 'utf8');
  }
});

test('createRecord rejects duplicates', async () => {
  const backup = await fs.readFile(realDataFile, 'utf8');
  try {
    const { createRecord } = await import('./wasteRecordsStore.js');
    const testDate = `2099-11-${String((Date.now() % 27) + 1).padStart(2, '0')}`;
    const payload = {
      date: testDate,
      shift: 1,
      shiftLabel: 'Shift 1 (6am–2pm)',
      range: { unixStart: 1, unixEnd: 2, startLabel: '06:00', endLabel: '14:00' },
      waste: { totalKg: 3.2, cycleCount: 1, bySku: [], cycles: [], trend: [] },
      source: 'manual',
    };
    await createRecord(payload);
    await assert.rejects(() => createRecord(payload), /already exists/);
  } finally {
    await fs.writeFile(realDataFile, backup, 'utf8');
  }
});
