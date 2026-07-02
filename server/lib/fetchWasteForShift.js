import { shiftRange, SHIFTS, formatLocalTime } from './shifts.js';
import { fetchHistorian } from './piClient.js';
import { normalize } from './normalize.js';
import { computeWaste } from './wasteMetrics.js';
import { WASTE_TAG_FULLNAMES } from './tags.js';

export function validateShiftRequest(date, shift) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const err = new Error('Missing or invalid "date" (expected YYYY-MM-DD).');
    err.status = 400;
    throw err;
  }

  const shiftId = Number(shift);
  if (!SHIFTS[shiftId]) {
    const err = new Error('Missing or invalid "shift" (expected 1, 2, or 3).');
    err.status = 400;
    throw err;
  }

  return { date, shift: shiftId };
}

export async function fetchWasteForShift(date, shift) {
  const { date: safeDate, shift: safeShift } = validateShiftRequest(date, shift);
  const range = shiftRange(safeDate, safeShift);
  const raw = await fetchHistorian(range.unixStart, range.unixEnd, WASTE_TAG_FULLNAMES);
  const series = normalize(raw);
  const waste = computeWaste(series, range);

  return {
    date: safeDate,
    shift: safeShift,
    shiftLabel: SHIFTS[safeShift].label,
    range: {
      ...range,
      startLabel: formatLocalTime(range.unixStart),
      endLabel: formatLocalTime(range.unixEnd),
    },
    waste,
  };
}
