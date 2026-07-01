import { Router } from 'express';
import { shiftRange, SHIFTS, formatLocalTime } from '../lib/shifts.js';
import { fetchHistorian } from '../lib/piClient.js';
import { normalize } from '../lib/normalize.js';
import { computeWaste } from '../lib/wasteMetrics.js';
import { WASTE_TAG_FULLNAMES } from '../lib/tags.js';

const router = Router();

// Wastewise is fetched separately (lazily, on tab open) so the History /
// ingredients query does not carry the Wastewise tags.
router.get('/waste-data', async (req, res) => {
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
    const raw = await fetchHistorian(range.unixStart, range.unixEnd, WASTE_TAG_FULLNAMES);
    const series = normalize(raw);
    const waste = computeWaste(series, range);

    return res.json({
      date,
      shift: Number(shift),
      shiftLabel: SHIFTS[Number(shift)].label,
      range: {
        ...range,
        startLabel: formatLocalTime(range.unixStart),
        endLabel: formatLocalTime(range.unixEnd),
      },
      waste,
    });
  } catch (err) {
    const status = err.response?.status || 502;
    return res.status(status).json({
      error: `Historian request failed: ${err.message}`,
    });
  }
});

export default router;
