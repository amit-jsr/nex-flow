# NxFlow Agent Platform

NxFlow is a local-first full-stack app for building AI agents, wiring them into workflows, running executions, and monitoring run events/messages.

Current stack:

- Frontend: Next.js (`frontend/`)
- Backend: FastAPI + SQLAlchemy async (`backend/`)
- Database: PostgreSQL (Docker Compose)
- Runtime direction: Strands Agents

## Quick Start

### 1) Clone env and start Postgres

```bash
cp .env.example .env
docker compose up -d postgres
docker compose ps
```

### 2) Start backend (port 8000)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend uvicorn main:app --reload --port 8000
```

Backend URLs:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

### 3) Start frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

## Daily Development Commands

From repo root:

```bash
# backend tests
PYTHONPATH=backend pytest backend/tests

# stop DB (keep data)
docker compose down

# stop DB and delete all DB data
docker compose down -v
```

From `frontend/`:

```bash
npm run build
npm run start
```

## Environment Variables

Use `.env.example` as the baseline.

Required for local DB:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DATABASE_URL`

Optional model/channel configuration:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`
- `XAI_BASE_URL` (default: `https://api.x.ai/v1`)
- `XAI_DEFAULT_MODEL` (default: `grok-4.3`)
- `AWS_BEDROCK_REGION` (default: `us-east-1`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DEFAULT_AGENT_ID`
- `TELEGRAM_DEFAULT_WORKFLOW_ID`

## Current Implementation Status

Implemented:

- Persistent CRUD for agents, tools, workflows, runs, run events, and messages
- Workflow templates (`GET /workflows/templates`)
- Run execution trigger (`POST /runs/{run_id}/execute`)
- Run event persistence + WebSocket stream (`WS /ws/runs/{run_id}`)
- Telegram webhook parsing + message persistence + outbound reply support
- Frontend wired to backend for loading/saving core data with fallback behavior

In progress:

- Full runtime hardening and deeper execution controls
- Remaining frontend API wiring (for example delete flows and broader message views)

## API Surface (Current)

- `GET/POST/PATCH/DELETE /agents`
- `GET/POST/PATCH/DELETE /tools`
- `GET/POST/PATCH/DELETE /workflows`
- `GET /workflows/templates`
- `POST /workflows/{workflow_id}/runs`
- `GET/POST/PATCH/DELETE /runs`
- `POST /runs/{run_id}/execute`
- `GET/POST /runs/{run_id}/events`
- `GET/POST/PATCH/DELETE /messages`
- `POST /telegram/webhook`
- `WS /ws/runs/{run_id}`

## Project Structure

```text
frontend/
  src/
    app/               Next.js routes (dashboard, agents, workflows, runs)
    components/
      PlatformConsole.tsx

backend/
  api/                 FastAPI route modules
  channels/            Telegram channel helpers
  configs/             Settings and env config
  datastore/
    database.py        Async engine/session + table init
    model.py           SQLAlchemy models
    schema/            Pydantic request/response models
  runtime/             Strands runtime orchestration pieces
  templates/           Built-in workflow templates
  tests/               Pytest suite
```
