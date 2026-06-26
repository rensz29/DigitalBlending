# Digital Blending

A single full-stack app that merges two previously separate projects:

- **Digital Blending** — shift dashboard + recipe/price/status settings, sourced from the PI historian REST API.
- **OPC-UA Dashboard** — the drag-and-drop industrial tag dashboard extracted from the OPC-UA Tag Viewer (the "Classic" browse/table view was intentionally left out).

```
digital_twin/
  client/   React + Vite SPA (Dashboard, Recipe Settings, OPC-UA Dashboard)
  server/   Express API + OPC UA client + /ws WebSocket
```

## Architecture

- One React client (`client/`) with three nav pages:
  - `/` — Blending Dashboard
  - `/settings` — Recipe Settings
  - `/opcua` — OPC-UA drag-and-drop dashboard
- One Express server (`server/`) on port **3001** serving:
  - Blending API under `/api/*` (shift-data, recipes, ingredient-prices, cl-statuses)
  - OPC UA API under `/api/opcua/*` (status, connect, disconnect, tag-library, read, subscribe)
  - OPC UA live-value WebSocket at `/ws`
- The OPC-UA dashboard's styles are scoped to `.opcua-page` so the two themes don't collide.

## Configuration

Copy `server/.env.example` to `server/.env.local` and fill in:

```
# PI historian
PI_API_BASE=...
PI_BEARER_TOKEN=...
PI_TZ_OFFSET=8

# OPC UA server
OPCUA_HOST=10.156.116.3
OPCUA_PORT=48031
OPCUA_USERNAME=...
OPCUA_PASSWORD=...
```

## Run (development)

```bash
# terminal 1 — API + WebSocket on :3001
cd server && npm install && npm run dev

# terminal 2 — Vite dev server on :5173 (proxies /api and /ws to :3001)
cd client && npm install && npm run dev
```

Open http://localhost:5173.

On the **OPC-UA Dashboard** page, click **Connect**, then drag tags from the sidebar
onto the grid cells to add live widgets. Use the interval selector to change the poll
rate and the edit toolbar to resize the grid / remove widgets.

## Run (production)

```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start       # serves client/dist + APIs + /ws on :3001
```

Open http://localhost:3001.

## Run with Docker

Production deployment in a single container: the image builds the React client, then runs the Express server on port **5086** (static assets, APIs, and WebSocket).

### Prerequisites

- Docker Engine 24+ and Docker Compose v2

### Setup

1. Configure environment (same as local production):

```bash
cp server/.env.example server/.env.local
# Edit PI_API_BASE, PI_BEARER_TOKEN, OPCUA_HOST, OPCUA_PORT, OPCUA_USERNAME, OPCUA_PASSWORD
```

2. Build and start:

```bash
docker compose up --build -d
```

3. Open http://localhost:5086 (or `http://<host>:${PORT}` if you set `PORT` in the shell).

### Common commands

| Command | Action |
|---------|--------|
| `docker compose logs -f` | Tail container logs |
| `docker compose down` | Stop the container |
| `docker compose up --build -d` | Rebuild and restart after code changes |
| `docker compose down -v` | Stop and **delete** persisted recipe/price/status data |

### Plant network requirements

The container must be able to reach your plant systems:

- **PI historian** — host/port in `PI_API_BASE` (e.g. `10.156.116.179:4516`)
- **OPC UA server** — `OPCUA_HOST:OPCUA_PORT` (e.g. `10.156.116.3:48031`)

On a Linux host on the plant LAN, if default bridge networking cannot reach internal `10.x` subnets, use host networking (Linux only):

```yaml
# docker-compose.override.yml
services:
  digital-twin:
    network_mode: host
```

With `network_mode: host`, the app listens on port 5086 on the host directly (the `ports:` mapping in `docker-compose.yml` is ignored).

On WSL2 or Docker Desktop, containers may not reach corporate VLANs unless the host has VPN/routing to those subnets.

### Data persistence

Recipe, ingredient-price, and CL-status edits are stored under `server/data/` and persist in the `digital-twin-data` Docker volume. On first start, seed JSON files from the image are copied into the volume automatically.

To keep data as files on the host instead, replace the named volume in `docker-compose.yml`:

```yaml
volumes:
  - ./server/data:/app/server/data
```

## Tests

```bash
cd server && npm test
```
