// Turn the raw historian response into a predictable per-tag shape:
//   { esmDosed: [{ t, value }], sku: [...], valve: [...], clStatus: [...] }
// where `t` is unix seconds (number) and `value` is number|string|boolean.

import { TAGS, keyForTagname } from './tags.js';

const TIME_FIELDS = ['unixTime', 'timestamp', 'time', 'Time', 't', 'ts', 'x'];
const VALUE_FIELDS = ['value', 'Value', 'val', 'v', 'y'];

function pick(obj, fields) {
  for (const f of fields) {
    if (obj[f] !== undefined && obj[f] !== null) return obj[f];
  }
  return undefined;
}

// Coerce a timestamp (unix seconds, unix ms, or ISO string) to unix seconds.
function toUnixSeconds(raw) {
  if (typeof raw === 'number') {
    return raw > 1e12 ? Math.floor(raw / 1000) : Math.floor(raw);
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

function coerceValue(raw) {
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return raw;
}

function normalizePoint(point) {
  // Array form: [time, value]
  if (Array.isArray(point)) {
    const t = toUnixSeconds(point[0]);
    return t === null ? null : { t, value: coerceValue(point[1]) };
  }
  if (point && typeof point === 'object') {
    const t = toUnixSeconds(pick(point, TIME_FIELDS));
    const value = coerceValue(pick(point, VALUE_FIELDS));
    return t === null ? null : { t, value };
  }
  return null;
}

function extractSeriesList(raw) {
  if (Array.isArray(raw)) return raw;
  // Historian envelope: { s, e, tl: [ { t: { n }, d: [...] } ] }
  if (raw && Array.isArray(raw.tl)) return raw.tl;
  if (raw && Array.isArray(raw.data)) return raw.data;
  if (raw && Array.isArray(raw.results)) return raw.results;
  if (raw && Array.isArray(raw.items)) return raw.items;
  return [];
}

// The series-level tagname can be a string (tagname/tag/name) or a nested
// object — the historian uses { t: { n: '<fullname>' } }.
function extractTagname(entry) {
  const raw = entry.tagname || entry.tag || entry.name || entry.t;
  if (raw && typeof raw === 'object') {
    return raw.n || raw.name || raw.tagname || '';
  }
  return raw || '';
}

function extractPoints(seriesEntry) {
  const list =
    seriesEntry.d ||
    seriesEntry.values ||
    seriesEntry.data ||
    seriesEntry.points ||
    seriesEntry.samples ||
    [];
  return list.map(normalizePoint).filter(Boolean).sort((a, b) => a.t - b.t);
}

export function normalize(raw) {
  const out = {};
  TAGS.forEach((t) => {
    out[t.key] = [];
  });

  for (const entry of extractSeriesList(raw)) {
    const tagname = extractTagname(entry);
    const key = keyForTagname(tagname);
    if (key) out[key] = extractPoints(entry);
  }

  return out;
}
