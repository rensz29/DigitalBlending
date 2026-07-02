import { Router } from 'express';
import { validateShiftRequest } from '../lib/fetchWasteForShift.js';
import { shiftRange, SHIFTS, formatLocalTime } from '../lib/shifts.js';
import { fetchHistorian } from '../lib/piClient.js';
import { normalize } from '../lib/normalize.js';
import { SHIFT_TAG_FULLNAMES, INGREDIENTS } from '../lib/tags.js';
import { listRecipes } from '../lib/recipesStore.js';
import { computeDosingErrorsByWindow } from '../lib/dosingErrorByWindow.js';

const router = Router();

// Dosing error graph is fetched separately to avoid pulling full shift-data series
// when the user only needs dosing windows.
router.get('/dosing-error-data', async (req, res) => {
  const { date, shift } = req.query;

  try {
    const { date: safeDate, shift: safeShift } = validateShiftRequest(date, shift);
    const range = shiftRange(safeDate, safeShift);

    const raw = await fetchHistorian(range.unixStart, range.unixEnd, SHIFT_TAG_FULLNAMES);
    const series = normalize(raw);
    const recipes = await listRecipes();
    const dosingErrorWindows = computeDosingErrorsByWindow(series, range, recipes);

    return res.json({
      date: safeDate,
      shift: safeShift,
      shiftLabel: SHIFTS[safeShift].label,
      range: {
        ...range,
        startLabel: formatLocalTime(range.unixStart),
        endLabel: formatLocalTime(range.unixEnd),
      },
      ingredients: INGREDIENTS,
      dosingErrorWindows,
    });
  } catch (err) {
    const status = err.status || err.response?.status || 502;
    return res.status(status).json({
      error: status >= 500 ? `Historian request failed: ${err.message}` : err.message,
    });
  }
});

export default router;
