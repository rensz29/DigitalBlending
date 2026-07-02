import { TZ_OFFSET, shiftRange } from './shifts.js';
import { fetchWasteForShift } from './fetchWasteForShift.js';
import { existsRecord, createRecord } from './wasteRecordsStore.js';

const DEFAULT_INTERVAL_MS = Number(process.env.WASTE_AUTO_SAVE_INTERVAL_MS || 5 * 60 * 1000);
const DEFAULT_GRACE_SECONDS = Number(process.env.WASTE_AUTO_SAVE_GRACE_SECONDS || 10 * 60);

function toManilaDateString(unixSeconds, offsetHours = TZ_OFFSET) {
  const d = new Date((unixSeconds + offsetHours * 3600) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBefore(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d - days, 0, 0, 0);
  return toManilaDateString(Math.floor(utc / 1000), 0);
}

export function buildCandidateShifts(nowUnixSeconds, lookbackDays = 2) {
  const dates = [];
  const today = toManilaDateString(nowUnixSeconds);
  for (let i = 0; i < lookbackDays; i++) {
    dates.push(daysBefore(today, i));
  }

  const candidates = [];
  for (const date of dates) {
    for (const shift of [1, 2, 3]) {
      const range = shiftRange(date, shift);
      candidates.push({ date, shift, range });
    }
  }
  return candidates;
}

export async function runWasteAutoSaveCycle({
  nowUnixSeconds = Math.floor(Date.now() / 1000),
  graceSeconds = DEFAULT_GRACE_SECONDS,
  lookbackDays = 2,
  logger = console,
  fetchWasteForShiftFn = fetchWasteForShift,
  existsRecordFn = existsRecord,
  createRecordFn = createRecord,
} = {}) {
  const candidates = buildCandidateShifts(nowUnixSeconds, lookbackDays);

  for (const item of candidates) {
    if (nowUnixSeconds <= item.range.unixEnd + graceSeconds) continue;

    const alreadySaved = await existsRecordFn(item.date, item.shift);
    if (alreadySaved) continue;

    try {
      const payload = await fetchWasteForShiftFn(item.date, item.shift);
      if (!payload.waste || Number(payload.waste.totalKg || 0) <= 0) continue;

      const created = await createRecordFn({
        date: payload.date,
        shift: payload.shift,
        shiftLabel: payload.shiftLabel,
        range: payload.range,
        waste: payload.waste,
        source: 'auto',
      });
      logger.info?.(
        `[waste-auto-save] saved ${created.date} shift ${created.shift} (${created.waste.totalKg} kg)`
      );
    } catch (err) {
      logger.warn?.(
        `[waste-auto-save] failed ${item.date} shift ${item.shift}: ${err.message}`
      );
    }
  }
}

export function startWasteAutoSaveService({
  intervalMs = DEFAULT_INTERVAL_MS,
  runOnStart = true,
  logger = console,
} = {}) {
  let timer = null;
  const tick = () => runWasteAutoSaveCycle({ logger });

  if (runOnStart) {
    tick();
  }

  timer = setInterval(tick, intervalMs);

  logger.info?.(
    `[waste-auto-save] started (interval=${intervalMs}ms, grace=${DEFAULT_GRACE_SECONDS}s)`
  );

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      logger.info?.('[waste-auto-save] stopped');
    }
  };
}
