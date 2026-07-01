import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import shiftDataRouter from './routes/shift-data.js';
import wasteDataRouter from './routes/waste-data.js';
import recipesRouter from './routes/recipes.js';
import ingredientPricesRouter from './routes/ingredient-prices.js';
import clStatusesRouter from './routes/cl-statuses.js';
import opcuaRouter from './routes/opcua.js';
import * as opcua from './lib/opcua-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  app.use(cors());
}

app.use(express.json());

// Digital Blending (PI historian) API
app.use('/api', shiftDataRouter);
app.use('/api', wasteDataRouter);
app.use('/api', recipesRouter);
app.use('/api', ingredientPricesRouter);
app.use('/api', clStatusesRouter);

// OPC UA API (namespaced)
app.use('/api/opcua', opcuaRouter);

if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = createServer(app);

// OPC UA live-value WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

opcua.setOnChangeCallback((payload) => {
  broadcast(payload);
});

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.send(JSON.stringify({ type: 'status', ...opcua.getStatus() }));

  ws.on('message', async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === 'subscribe' && Array.isArray(message.nodeIds)) {
        const result = await opcua.subscribe(message.nodeIds);
        ws.send(JSON.stringify({ type: 'subscribed', ...result }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(`OPC UA WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`OPC UA target endpoint: ${opcua.getStatus().endpoint}`);
});
