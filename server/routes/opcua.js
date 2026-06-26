import { Router } from "express";
import * as opcua from "../lib/opcua-client.js";

const router = Router();

router.get("/status", (_req, res) => {
  res.json(opcua.getStatus());
});

router.post("/connect", async (_req, res) => {
  try {
    const status = await opcua.connect();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/disconnect", async (_req, res) => {
  try {
    const status = await opcua.disconnect();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/browse", async (req, res) => {
  try {
    const { nodeId } = req.query;
    const nodes = await opcua.browse(nodeId);
    res.json({ nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/plant-root", async (_req, res) => {
  try {
    const node = await opcua.getPlantRoot();
    res.json({ node });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tag-library", async (_req, res) => {
  try {
    const library = await opcua.getTagLibrary();
    res.json(library);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const { results, truncated } = await opcua.searchTags(q || "");
    res.json({ results, truncated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/read", async (req, res) => {
  try {
    const { nodeIds } = req.body;
    const values = await opcua.readValues(nodeIds);
    res.json({ values });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/subscribe", async (req, res) => {
  try {
    const { nodeIds } = req.body;
    const result = await opcua.subscribe(nodeIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
