import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/waste-records.json');

function normalizeShift(shift) {
  const value = Number(shift);
  if (!Number.isInteger(value) || value < 1 || value > 3) return null;
  return value;
}

function validateDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function compareDesc(a, b) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return b.shift - a.shift;
}

function normalizeRecord(record) {
  return {
    date: record.date,
    shift: record.shift,
    shiftLabel: record.shiftLabel,
    range: record.range,
    waste: record.waste,
    source: record.source === 'auto' ? 'auto' : 'manual',
    savedAt: record.savedAt || new Date().toISOString(),
    tagged: Boolean(record.tagged),
    tagReason: record.tagReason ?? null,
    taggedAt: record.taggedAt ?? null,
  };
}

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(records) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}

function recordMatchesFilters(record, filters) {
  if (filters.dateFrom && record.date < filters.dateFrom) return false;
  if (filters.dateTo && record.date > filters.dateTo) return false;
  if (filters.shift && record.shift !== filters.shift) return false;
  if (filters.source && record.source !== filters.source) return false;
  if (typeof filters.tagged === 'boolean' && record.tagged !== filters.tagged) return false;
  return true;
}

export async function listRecords(filters = {}) {
  const parsed = {
    dateFrom: validateDate(filters.dateFrom) ? filters.dateFrom : null,
    dateTo: validateDate(filters.dateTo) ? filters.dateTo : null,
    shift: normalizeShift(filters.shift),
    source: filters.source === 'manual' || filters.source === 'auto' ? filters.source : null,
    tagged:
      typeof filters.tagged === 'boolean'
        ? filters.tagged
        : filters.tagged === 'true'
          ? true
          : filters.tagged === 'false'
            ? false
            : null,
  };

  const records = await readAll();
  return records.filter((r) => recordMatchesFilters(r, parsed)).sort(compareDesc);
}

export async function getRecord(date, shift) {
  if (!validateDate(date)) return null;
  const shiftId = normalizeShift(shift);
  if (!shiftId) return null;
  const records = await readAll();
  return records.find((record) => record.date === date && record.shift === shiftId) || null;
}

export async function existsRecord(date, shift) {
  const found = await getRecord(date, shift);
  return Boolean(found);
}

export async function createRecord(payload) {
  if (!validateDate(payload?.date)) {
    const err = new Error('Invalid date (expected YYYY-MM-DD).');
    err.status = 400;
    throw err;
  }

  const shift = normalizeShift(payload?.shift);
  if (!shift) {
    const err = new Error('Invalid shift (expected 1, 2, or 3).');
    err.status = 400;
    throw err;
  }

  const records = await readAll();
  const duplicate = records.find((r) => r.date === payload.date && r.shift === shift);
  if (duplicate) {
    const err = new Error(`Waste record for ${payload.date} shift ${shift} already exists.`);
    err.status = 409;
    throw err;
  }

  const record = normalizeRecord({
    ...payload,
    shift,
    tagged: false,
    tagReason: null,
    taggedAt: null,
  });
  records.push(record);
  await writeAll(records.sort(compareDesc));
  return record;
}

export async function tagRecord(date, shift, payload) {
  if (!validateDate(date)) {
    const err = new Error('Invalid date (expected YYYY-MM-DD).');
    err.status = 400;
    throw err;
  }
  const shiftId = normalizeShift(shift);
  if (!shiftId) {
    const err = new Error('Invalid shift (expected 1, 2, or 3).');
    err.status = 400;
    throw err;
  }

  const tagReason = String(payload?.tagReason || '').trim();
  if (!tagReason) {
    const err = new Error('Tag reason is required.');
    err.status = 400;
    throw err;
  }

  const records = await readAll();
  const index = records.findIndex((record) => record.date === date && record.shift === shiftId);
  if (index === -1) {
    const err = new Error(`Waste record for ${date} shift ${shiftId} not found.`);
    err.status = 404;
    throw err;
  }

  records[index] = {
    ...records[index],
    tagged: true,
    tagReason,
    taggedAt: new Date().toISOString(),
  };
  await writeAll(records.sort(compareDesc));
  return records[index];
}
