import { Router } from 'express';
import { fetchWasteForShift, validateShiftRequest } from '../lib/fetchWasteForShift.js';
import {
  listRecords,
  getRecord,
  existsRecord,
  createRecord,
  tagRecord,
} from '../lib/wasteRecordsStore.js';

const router = Router();

router.get('/waste-records', async (req, res) => {
  try {
    const records = await listRecords(req.query);
    return res.json(records);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/waste-records/status', async (req, res) => {
  const { date, shift } = req.query;
  try {
    const { date: safeDate, shift: safeShift } = validateShiftRequest(date, shift);
    const record = await getRecord(safeDate, safeShift);
    if (!record) return res.json({ exists: false });
    return res.json({
      exists: true,
      tagged: record.tagged,
      source: record.source,
      savedAt: record.savedAt,
      tagReason: record.tagReason,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/waste-records/:date/:shift', async (req, res) => {
  const { date, shift } = req.params;
  try {
    const { date: safeDate, shift: safeShift } = validateShiftRequest(date, shift);
    const record = await getRecord(safeDate, safeShift);
    if (!record) {
      return res.status(404).json({ error: `Waste record for ${safeDate} shift ${safeShift} not found.` });
    }
    return res.json(record);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/waste-records', async (req, res) => {
  const { date, shift } = req.body || {};
  try {
    const { date: safeDate, shift: safeShift } = validateShiftRequest(date, shift);
    const alreadyExists = await existsRecord(safeDate, safeShift);
    if (alreadyExists) {
      return res.status(409).json({ error: `Waste record for ${safeDate} shift ${safeShift} already exists.` });
    }

    const payload = await fetchWasteForShift(safeDate, safeShift);
    const created = await createRecord({
      date: payload.date,
      shift: payload.shift,
      shiftLabel: payload.shiftLabel,
      range: payload.range,
      waste: payload.waste,
      source: 'manual',
    });
    return res.status(201).json(created);
  } catch (err) {
    const status = err.status || err.response?.status || 500;
    return res.status(status).json({
      error: status >= 500 ? `Failed to save waste record: ${err.message}` : err.message,
    });
  }
});

router.patch('/waste-records/:date/:shift', async (req, res) => {
  const { date, shift } = req.params;
  try {
    const updated = await tagRecord(date, shift, req.body || {});
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
