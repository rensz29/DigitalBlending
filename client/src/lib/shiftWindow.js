import { fmtTime, TZ_OFFSET } from './timeBuckets.js';

const SHIFT_START_HOUR = { 1: 6, 2: 14, 3: 22 };

export function localTimeToUnix(dateStr, hhmm, offset = TZ_OFFSET) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d, hh - offset, mm, 0) / 1000);
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(
    next.getUTCDate()
  ).padStart(2, '0')}`;
}

function dateForTimeOnShift(dateStr, shift, hhmm) {
  const [hh] = hhmm.split(':').map(Number);
  const startHour = SHIFT_START_HOUR[Number(shift)] ?? 6;
  if (Number(shift) === 3 && hh < startHour) {
    return addDays(dateStr, 1);
  }
  return dateStr;
}

export function viewRangeFromTimes(shiftRange, date, shift, fromTime, toTime) {
  if (!fromTime || !toTime) {
    return { error: 'From and To times are required.' };
  }

  const fromDate = dateForTimeOnShift(date, shift, fromTime);
  const toDate = dateForTimeOnShift(date, shift, toTime);
  const unixStart = localTimeToUnix(fromDate, fromTime);
  const unixEnd = localTimeToUnix(toDate, toTime);

  if (unixStart >= unixEnd) {
    return { error: 'End time must be after start time.' };
  }

  if (unixStart < shiftRange.unixStart || unixEnd > shiftRange.unixEnd) {
    return { error: 'Time window must be within the loaded shift.' };
  }

  return {
    unixStart,
    unixEnd,
    startLabel: fmtTime(unixStart),
    endLabel: fmtTime(unixEnd),
  };
}

export function isFullShift(viewRange, shiftRange) {
  if (!viewRange || !shiftRange) return true;
  return (
    viewRange.unixStart === shiftRange.unixStart && viewRange.unixEnd === shiftRange.unixEnd
  );
}
