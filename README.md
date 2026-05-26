# NxFlow Agent Platform

Full-stack scaffold for configuring agents, persisting workflows, and monitoring agent runs.

## Run The Frontend

```bash
cd frontend & npm run dev
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build The Frontend

```bash
cd frontend
npm run build
npm run start
```

## Project Structure

```text
frontend/
  app/
    layout.tsx          App shell metadata
    page.tsx            Dashboard route
    agents/
      page.tsx
      [id]/page.tsx
    workflows/
      page.tsx
      [id]/page.tsx
    runs/
      [id]/page.tsx
    tools/page.tsx      Existing tool catalog route
  components/
    PlatformConsole.tsx Preserved interactive console shell
    AgentForm.tsx
    WorkflowBuilder.tsx
    AgentNode.tsx
    RunMonitor.tsx
    TokenUsageBar.tsx
  lib/
    api.ts              Typed backend API access
    useWebSocket.ts     Live run event hook
  Dockerfile
backend/
  app/
    main.py             FastAPI application and startup schema creation
    config.py           Environment-driven application settings
    database.py         Async SQLAlchemy engine/session setup
    models/             SQLAlchemy domain models
      agent.py
      workflow.py
      run.py
      message.py
      tool.py           Persistent tool catalog used by the UI
    schemas/            Pydantic API request/response schemas
    routers/            CRUD/query, Telegram, and WebSocket endpoints
    runtime/            Agent/workflow/tool extension points
    channels/           External channel integrations
    templates/          Starter workflow definitions
  tests/
    test_agents.py
    test_workflow_execution.py
    test_telegram.py
  alembic/              Migration home for the next schema phase
  Dockerfile
  requirements.txt
```

## Backend Dependencies

The FastAPI backend data layer is scaffolded and its Python dependencies are listed in `backend/requirements.txt`.

Recommended Python version:

```text
Python 3.11+
```

Install backend dependencies later with:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Persistent PostgreSQL

Local persistent storage is configured with Docker Compose. It stores data in the named `postgres_data` Docker volume, so records remain available across container restarts.

Start PostgreSQL:

```bash
docker compose up -d postgres
docker compose ps
```

Default local connection string:

```text
postgresql+asyncpg://nxflow:nxflow@localhost:5432/nxflow
```

Use `.env.example` as the template when changing local credentials or port settings.

## Model Provider Keys

NxFlow can store provider configuration for OpenAI, Anthropic, AWS Bedrock, and xAI/Grok. Grok uses xAI's OpenAI-compatible API endpoint:

```text
XAI_API_KEY=your_xai_key
XAI_BASE_URL=https://api.x.ai/v1
XAI_DEFAULT_MODEL=grok-4.3
```

Stop the database without deleting its data:

```bash
docker compose down
```

Only run `docker compose down -v` when you intentionally want to delete the local PostgreSQL data volume.

## Run The Backend

With PostgreSQL running, launch the API from the repository root:

```bash
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

On startup, SQLAlchemy creates these persistent tables if they do not exist:

```text
agents
tools
workflows
runs
run_events
messages
```

Open the generated API documentation:

```text
http://localhost:8000/docs
```

Example basic operations:

```bash
curl -X POST http://localhost:8000/agents/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Researcher","system_prompt":"Research carefully.","tools":["web_search"]}'

curl http://localhost:8000/agents/

curl -X POST http://localhost:8000/tools/ \
  -H "Content-Type: application/json" \
  -d '{"key":"web_search","name":"Web Search","source":"integration","status":"connected"}'

curl -X POST http://localhost:8000/workflows/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Research Flow","nodes":[],"edges":[]}'

curl http://localhost:8000/runs/
```

## API Scope

The backend currently provides persistent CRUD/query storage. The frontend route and typed integration modules are in place; the preserved console still uses its local demo data until API wiring is completed. Telegram and WebSocket route entry points are present, while agent execution, LLM calls, and Redis live streaming are later layers.

- `GET /agents`
- `POST /agents`
- `GET /tools`
- `POST /tools`
- `GET /workflows`
- `POST /workflows/{workflow_id}/runs`
- `GET /runs/{run_id}`
- `POST /runs/{run_id}/events`
- `GET /messages`
- `POST /telegram/webhook`
- `WS /ws/runs/{run_id}`
