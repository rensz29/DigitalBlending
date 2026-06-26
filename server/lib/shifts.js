// Shift time math for the Digital Blending line.
//
// The historian works in Asia/Manila (UTC+8, no DST). We convert a local
// calendar date + shift into a UTC unix-second window using a fixed offset,
// which avoids any DST ambiguity.
//
// Verified against the original index.js example (2026-06-15 shift 3):
//   shiftRange('2026-06-15', 3) === { unixStart: 1781532000, unixEnd: 1781560800 }

export const TZ_OFFSET = Number(process.env.PI_TZ_OFFSET ?? 8); // hours east of UTC

export const SHIFTS = {
  1: { startHour: 6, endHour: 14, label: 'Shift 1 (6am–2pm)' },
  2: { startHour: 14, endHour: 22, label: 'Shift 2 (2pm–10pm)' },
  // endHour 30 == 06:00 the following day (handled by Date.UTC normalization).
  3: { startHour: 22, endHour: 30, label: 'Shift 3 (10pm–6am)' },
};

export const SHIFT_LIST = Object.entries(SHIFTS).map(([id, s]) => ({
  id: Number(id),
  ...s,
}));

// Convert "YYYY-MM-DD" + local hour (may exceed 24) into unix seconds (UTC).
function localToUnix(dateStr, localHour, offset = TZ_OFFSET) {
  const [y, m, d] = dateStr.split('-').map(Number);
  // local hour H corresponds to UTC hour (H - offset); Date.UTC normalizes overflow.
  return Math.floor(Date.UTC(y, m - 1, d, localHour - offset, 0, 0) / 1000);
}

export function shiftRange(dateStr, shift, offset = TZ_OFFSET) {
  const def = SHIFTS[Number(shift)];
  if (!def) throw new Error(`Unknown shift: ${shift}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date (expected YYYY-MM-DD): ${dateStr}`);
  }
  return {
    unixStart: localToUnix(dateStr, def.startHour, offset),
    unixEnd: localToUnix(dateStr, def.endHour, offset),
  };
}

// Format a unix-second timestamp as a time string in plant-local (Manila) time.
export function formatLocalTime(unixSeconds, offset = TZ_OFFSET) {
  const d = new Date((unixSeconds + offset * 3600) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
