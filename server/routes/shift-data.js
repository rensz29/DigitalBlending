import { Router } from 'express';
import { shiftRange, SHIFTS, formatLocalTime } from '../lib/shifts.js';
import { fetchShiftData } from '../lib/piClient.js';
import { normalize } from '../lib/normalize.js';
import { computeMetrics } from '../lib/metrics.js';
import { INGREDIENTS } from '../lib/tags.js';
import { listRecipes } from '../lib/recipesStore.js';
import { compareToTargets } from '../lib/recipeComparison.js';
import { listClStatuses, getRunningCodes } from '../lib/clStatusStore.js';

const router = Router();

router.get('/shift-data', async (req, res) => {
  const { date, shift } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: 'Missing or invalid "date" (expected YYYY-MM-DD).',
    });
  }
  if (!SHIFTS[Number(shift)]) {
    return res.status(400).json({
      error: 'Missing or invalid "shift" (expected 1, 2, or 3).',
    });
  }

  let range;
  try {
    range = shiftRange(date, shift);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const raw = await fetchShiftData(range.unixStart, range.unixEnd);
    const series = normalize(raw);
    const clStatuses = await listClStatuses();
    const runningStatusCodes = getRunningCodes(clStatuses);
    const { kpis, skuBreakdown } = computeMetrics(series, range, { runningStatusCodes });
    const recipes = await listRecipes();
    const recipeComparison = compareToTargets(skuBreakdown, recipes);

    return res.json({
      date,
      shift: Number(shift),
      shiftLabel: SHIFTS[Number(shift)].label,
      range: {
        ...range,
        startLabel: formatLocalTime(range.unixStart),
        endLabel: formatLocalTime(range.unixEnd),
      },
      series,
      kpis,
      skuBreakdown,
      recipeComparison,
      clStatuses,
      ingredients: INGREDIENTS,
    });
  } catch (err) {
    const status = err.response?.status || 502;
    return res.status(status).json({
      error: `Historian request failed: ${err.message}`,
    });
  }
});

export default router;
