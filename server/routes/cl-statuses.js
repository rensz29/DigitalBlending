import { Router } from 'express';
import { listClStatuses, updateClStatuses } from '../lib/clStatusStore.js';

const router = Router();

router.get('/cl-statuses', async (_req, res) => {
  try {
    const statuses = await listClStatuses();
    return res.json(statuses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/cl-statuses', async (req, res) => {
  try {
    const statuses = await updateClStatuses(req.body);
    return res.json(statuses);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
