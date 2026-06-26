import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/cl-statuses.json');

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

export function parseClStatusCode(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const str = String(value).trim();
  if (!str) return null;

  const bracket = str.match(/^\[(\d+)\]/);
  if (bracket) return Number(bracket[1]);

  const asNum = Number(str);
  if (Number.isFinite(asNum) && /^\d+$/.test(str)) return Math.trunc(asNum);

  return null;
}

export function getRunningCodes(statuses) {
  return new Set(
    (statuses || []).filter((s) => s.countsAsRunning).map((s) => Number(s.code))
  );
}

export function getStatusMap(statuses) {
  return new Map(
    (statuses || []).map((s) => [
      Number(s.code),
      { label: s.label, color: s.color, countsAsRunning: Boolean(s.countsAsRunning) },
    ])
  );
}

export function validateClStatuses(statuses) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return 'At least one status is required.';
  }

  const codes = new Set();
  for (const status of statuses) {
    const code = Number(status.code);
    if (!Number.isInteger(code) || code < 0) {
      return 'Each status must have a non-negative integer code.';
    }
    if (codes.has(code)) {
      return `Duplicate status code ${code}.`;
    }
    codes.add(code);

    const label = String(status.label ?? '').trim();
    if (!label) {
      return `Status [${code}] must have a label.`;
    }

    const color = String(status.color ?? '').trim();
    if (!HEX_COLOR.test(color)) {
      return `Status [${code}] must have a valid hex color (e.g. #34d399).`;
    }

    if (typeof status.countsAsRunning !== 'boolean') {
      return `Status [${code}] countsAsRunning must be true or false.`;
    }
  }

  return null;
}

function normalizeStatus(status) {
  return {
    code: Number(status.code),
    label: String(status.label).trim(),
    color: String(status.color).trim().toLowerCase(),
    countsAsRunning: Boolean(status.countsAsRunning),
    updatedAt: new Date().toISOString(),
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

async function writeAll(statuses) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(statuses, null, 2)}\n`, 'utf8');
}

export async function listClStatuses() {
  const statuses = await readAll();
  return statuses.sort((a, b) => a.code - b.code);
}

export async function updateClStatuses(statuses) {
  const error = validateClStatuses(statuses);
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  const normalized = statuses.map(normalizeStatus).sort((a, b) => a.code - b.code);
  await writeAll(normalized);
  return normalized;
}
