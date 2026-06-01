# NxFlow Agent Platform

NxFlow is a local-first AI agent orchestration platform for creating agents, wiring them into workflows, running real tasks, monitoring live execution, and chatting with at least one agent through Telegram.

It uses:

- Next.js for the frontend
- FastAPI + SQLAlchemy for the backend
- PostgreSQL for persistence
- Strands Agents as the only agent runtime

## Architecture

```text
Browser UI                     Telegram Bot
  |                                 |
  | REST + WebSocket                | Webhook
  v                                 v
FastAPI backend
  |-- Agents API        (CRUD + provider/model config)
  |-- Workflows API     (CRUD + templates + run trigger)
  |-- Runs API          (CRUD + execute + events)
  |-- Messages API      (CRUD + channel filter)
  |-- Tools API         (CRUD)
  |-- Telegram webhook  (inbound parse + execute + outbound reply)
  |-- WebSocket stream  (/ws/runs/{run_id})
  |-- Health check      (/health)
  |
  v
Strands Agents runtime
  |-- AgentFactory:    builds Strands Agent from DB config
  |-- WorkflowRunner:  topological sort + sequential async pipeline
  |-- ToolRegistry:    calculator, web_search, http_request
  |-- EventBus:        publishes run events to WebSocket subscribers
  |
  v
PostgreSQL persistence
  |-- agents
  |-- tools
  |-- workflows
  |-- runs
  |-- run_events
  |-- messages
```

## Why Strands

NxFlow uses Strands Agents only, intentionally. The runtime stays small and inspectable while still executing real agent logic:

- Agents are created from persisted configs: prompt, role, provider, model, tools, memory, channel, guardrails, limits.
- Workflows run as a sequential async pipeline, so each agent's output becomes the next agent's input.
- `stream_async()` gives live event streaming for the browser and persisted run logs.
- Tool calls are runtime actions, not mocked UI behavior.

This is why the project does not add LangGraph, CrewAI, AutoGen, or openclaw.

## Quick Start

### 1. Copy env and start Postgres

```bash
cp .env.example .env
docker compose up -d postgres
```

### 2. Start the backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend uvicorn main:app --reload --port 8000
```

Backend URLs:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

## Daily Development

From repo root:

```bash
# backend tests
PYTHONPATH=backend pytest backend/tests

# frontend build
cd frontend && npm run build

# stop DB but keep data
docker compose down

# stop DB and delete all DB data
docker compose down -v
```

## Environment Variables

Use `.env.example` as the source of truth.

### Database

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DATABASE_URL`

### OpenAI

- `OPENAI_API_KEY`

### Anthropic

- `ANTHROPIC_API_KEY`

### xAI / Grok

- `XAI_API_KEY`
- `XAI_BASE_URL` - default: `https://api.x.ai/v1`
- `XAI_DEFAULT_MODEL` - default: `grok-4.3`

### AWS Bedrock

- `AWS_BEDROCK_REGION` - default: `us-east-1`

### Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DEFAULT_AGENT_ID`
- `TELEGRAM_DEFAULT_WORKFLOW_ID`

## Current Features

- Agent CRUD with provider, model, tools, memory, schedule, skills, rules, guardrails, and limits
- Workflow CRUD with template support and graph validation
- Run execution with persisted `run_events`
- Live monitoring via WebSocket
- Per-event and total token/cost tracking
- Telegram inbound/outbound messaging
- Frontend wiring for agents, workflows, runs, messages, and Telegram

## Demo Checklist

The intended demo flow is:

1. Create or edit agents
2. Build a workflow from the template or the visual builder
3. Trigger a run
4. Watch the run monitor update live
5. Send a Telegram message and see the real reply come back

Demo video link:

- `Pending upload`

## How To Add a Workflow Template

1. Add a new template entry in `backend/templates/__init__.py`.
2. Define a `name`, `description`, `nodes`, `edges`, and `is_template: true`.
3. If the template needs new metadata, keep it in node `ui` data or workflow `description`.
4. Add or update backend tests that assert the template key/name is exposed.
5. Verify it appears in `GET /workflows/templates` and the UI template picker.

## How To Add a Messaging Channel

1. Add channel parsing and reply helpers under `backend/channels/`.
2. Update the webhook or inbound route in `backend/api/`.
3. Persist inbound and outbound messages in `backend/api/messages.py` or the channel handler.
4. Add environment settings in `backend/configs/settings.py` for tokens and default IDs.
5. Add tests for inbound parsing and outbound message construction.
6. Wire the channel into the frontend message view if it needs to be visible there.

## Project Structure

```text
frontend/
  src/
    app/               Next.js routes (dashboard, agents, workflows, runs)
    components/
      PlatformConsole.tsx

backend/
  api/                 FastAPI route modules
  channels/            Telegram helpers
  configs/             Settings and env config
  datastore/
    database.py        Async engine/session + table init
    model.py           SQLAlchemy models
    schema/            Pydantic request/response models
  runtime/             Strands orchestration pieces
  templates/           Built-in workflow templates
  tests/               Pytest suite
```
