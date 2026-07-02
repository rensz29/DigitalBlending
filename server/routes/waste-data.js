import { Router } from 'express';
import { fetchWasteForShift } from '../lib/fetchWasteForShift.js';

const router = Router();

// Wastewise is fetched separately (lazily, on tab open) so the History /
// ingredients query does not carry the Wastewise tags.
router.get('/waste-data', async (req, res) => {
  const { date, shift } = req.query;

  try {
    const payload = await fetchWasteForShift(date, shift);
    return res.json(payload);
  } catch (err) {
    const status = err.status || err.response?.status || 502;
    return res.status(status).json({
      error: status >= 500 ? `Historian request failed: ${err.message}` : err.message,
    });
  }
});

export default router;
