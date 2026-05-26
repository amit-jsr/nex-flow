# NxFlow Platform Blueprint

Current implementation blueprint for the local NxFlow scaffold.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Execution Scope](#6-execution-scope)
7. [Telegram Bot Integration](#7-telegram-bot-integration)
8. [Frontend — Next.js](#8-frontend--nextjs)
9. [Real-time Monitoring](#9-real-time-monitoring)
10. [Tests](#10-tests)
11. [Local Setup](#11-local-setup)
12. [README Template](#12-readme-template)
13. [Demo Script](#13-demo-script)
14. [Evaluation Checklist](#14-evaluation-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                            │
│                                                                     │
│   Browser (Next.js)              External Webhooks                  │
│   - Console UI                   - POST /telegram/webhook           │
│   - Agents / workflows / runs    - Accepted for later dispatch      │
└────────────────┬─────────────────────────┬──────────────────────────┘
                 │  REST + WebSocket        │  HTTP Webhook
                 ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                              │
│                                                                     │
│  /agents      CRUD for agent configs                                │
│  /workflows   CRUD + create run records                             │
│  /runs        Execution history + logs                              │
│  /telegram    Webhook receiver                                      │
│  /ws          WebSocket connection acknowledgement                  │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER                             │
│                                                                     │
│  PostgreSQL                                                        │
│  - agents, tools, workflows                                        │
│  - runs, run_events, messages                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Current data flow:**

1. User creates agents, tools, workflows, runs, or messages through the API.
2. FastAPI validates the request with Pydantic schemas.
3. SQLAlchemy persists the record in PostgreSQL.
4. The frontend console remains local-demo data until API wiring is added.

---

## 2. Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Language | Python 3.11 | Stable FastAPI and SQLAlchemy support |
| Backend | FastAPI | Async, WebSocket, auto-docs |
| Frontend | Next.js 14 | App Router, easy WebSocket integration |
| Database | PostgreSQL + SQLAlchemy async | Reliable, JSONB for flexible config |
| Local services | Docker Compose | PostgreSQL only; app processes run locally |

---

## 3. Repository Structure

This project keeps a simple `backend/` and `frontend/` split. Backend modules
live directly under `backend/`, while the frontend keeps the standard Next.js
App Router inside `src/app`.

```
nxflow-platform/
├── backend/
│   ├── models/
│   │   ├── agent.py
│   │   ├── workflow.py
│   │   ├── run.py
│   │   └── message.py
│   ├── schemas/
│   │   ├── agent.py
│   │   ├── workflow.py
│   │   └── run.py
│   ├── api/
│   │   ├── deps.py
│   │   └── routers/
│   │       ├── agents.py
│   │       ├── workflows.py
│   │       ├── runs.py
│   │       ├── telegram.py
│   │       └── ws.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── tests/
│   │   ├── test_agents.py
│   │   ├── test_workflow_execution.py
│   │   └── test_telegram.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── workflows/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── runs/
│   │   │       └── [id]/page.tsx     # Live monitor
│   │   ├── components/
│   │   │   └── PlatformConsole.tsx
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Database Schema

```sql
CREATE TABLE agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(200),
    system_prompt   TEXT NOT NULL,
    model           VARCHAR(50) DEFAULT 'gpt-4o',
    tools           JSONB DEFAULT '[]',       -- ["web_search", "calculator"]
    memory_enabled  BOOLEAN DEFAULT TRUE,
    max_tokens      INT DEFAULT 2000,
    temperature     FLOAT DEFAULT 0.7,
    channel         VARCHAR(50),              -- 'telegram' | null
    guardrails      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    nodes       JSONB NOT NULL,   -- [{id, agent_id, position: {x,y}}]
    edges       JSONB NOT NULL,   -- [{id, source, target, condition}]
    is_template BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID REFERENCES workflows(id),
    status          VARCHAR(20) DEFAULT 'pending',
    input           TEXT,
    output          TEXT,
    total_tokens    INT DEFAULT 0,
    total_cost_usd  FLOAT DEFAULT 0.0,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE run_events (
    id          BIGSERIAL PRIMARY KEY,
    run_id      UUID REFERENCES runs(id),
    event_type  VARCHAR(50),    -- agent_start | tool_call | token | agent_end | error
    agent_name  VARCHAR(100),
    content     TEXT,
    metadata    JSONB DEFAULT '{}',
    tokens_used INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id          BIGSERIAL PRIMARY KEY,
    agent_id    UUID REFERENCES agents(id),
    channel     VARCHAR(50),
    direction   VARCHAR(10),    -- 'inbound' | 'outbound'
    content     TEXT NOT NULL,
    sender_id   VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Backend — FastAPI

### `backend/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import models
from config import settings
from database import create_tables, get_db
from api.routers import agents, messages, runs, telegram, tools, workflows, ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield

app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(agents.router,    prefix="/agents",    tags=["agents"])
app.include_router(tools.router,     prefix="/tools",     tags=["tools"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(runs.router,      prefix="/runs",      tags=["runs"])
app.include_router(messages.router,  prefix="/messages",  tags=["messages"])
app.include_router(telegram.router,  prefix="/telegram",  tags=["telegram"])
app.include_router(ws.router,        tags=["websocket"])

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
```

### `backend/api/routers/workflows.py` — run creation endpoint

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_db
from models import Run
from schemas import RunRead, WorkflowRunCreate

router = APIRouter()

@router.post("/{workflow_id}/runs", response_model=RunRead)
async def create_workflow_run(
    workflow_id: str,
    payload: WorkflowRunCreate,
    db: AsyncSession = Depends(get_db)
):
    run = Run(workflow_id=workflow_id, input=payload.input, status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run
```

---

## 6. Execution Scope

Agent execution is not implemented yet. Keep future execution, tool adapters,
and streaming logic outside the CRUD/API layer when they are added.

---

## 7. Telegram Bot Integration

The current implementation exposes the webhook endpoint. Bot dispatch can be
added later once execution is wired.

### `backend/api/routers/telegram.py`

```python
from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    return {"ok": True, "update_id": data.get("update_id")}
```

---

## 8. Frontend — Next.js

### Agent Form fields (`src/components/AgentForm.tsx`)

```typescript
interface AgentFormData {
  name: string;
  role: string;
  systemPrompt: string;
  model: "gpt-4o" | "gpt-4o-mini" | "claude-sonnet-4" | "claude-haiku-4";
  tools: string[];           // checkboxes: web_search, calculator, http_request
  memoryEnabled: boolean;
  maxTokens: number;         // slider 100–4000
  temperature: number;       // slider 0.0–1.0
  channel: "telegram" | "none";
  guardrails: { maxCallsPerHour: number };
}
```

### Workflow Builder (`src/components/WorkflowBuilder.tsx`)

```typescript
"use client";
import ReactFlow, {
  addEdge, useNodesState, useEdgesState,
  MiniMap, Controls, Background
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode from "./AgentNode";

const nodeTypes = { agentNode: AgentNode };

export default function WorkflowBuilder({ workflow, agents }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);

  // Drag agent from sidebar panel onto canvas
  const onDrop = (event) => {
    const agentId = event.dataTransfer.getData("agent_id");
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX, y: event.clientY
    });
    setNodes(n => [...n, {
      id: `node_${Date.now()}`,
      type: "agentNode",
      position,
      data: { agent: agents.find(a => a.id === agentId) }
    }]);
  };

  return (
    <div style={{ height: "70vh" }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={(p) => setEdges(e => addEdge({ ...p, animated: true }, e))}
        onDrop={onDrop} onDragOver={e => e.preventDefault()}
        nodeTypes={nodeTypes} fitView
      >
        <Background /><Controls /><MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Live Run Monitor (`src/components/RunMonitor.tsx`)

```typescript
"use client";
import { useEffect, useState, useRef } from "react";

export default function RunMonitor({ runId }: { runId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [tokens, setTokens] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/ws/runs/${runId}`
    );
    ws.onmessage = (e) => {
      const ev = JSON.parse(e.data);
      setEvents(prev => [...prev, ev]);
      setTokens(prev => prev + (ev.tokens_used ?? 0));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    return () => ws.close();
  }, [runId]);

  const colorClass = (type: string) => ({
    token:      "text-gray-300",
    tool_call:  "text-yellow-400",
    agent_end:  "text-green-400",
    error:      "text-red-400",
  }[type] ?? "text-gray-400");

  return (
    <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
      <div className="text-xs text-gray-500 mb-3">
        Tokens: {tokens} · Est. cost: ${(tokens * 0.000005).toFixed(4)}
      </div>
      {events.map((e, i) => (
        <div key={i} className={`mb-1 ${colorClass(e.event_type)}`}>
          {e.event_type === "tool_call" && <span className="opacity-60">[tool] </span>}
          {e.content}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

## 9. Real-time Monitoring

### WebSocket endpoint (`backend/api/routers/ws.py`)

```python
from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/ws/runs/{run_id}")
async def run_events_socket(websocket: WebSocket, run_id: str):
    await websocket.accept()
    await websocket.send_json({
        "type": "connected",
        "run_id": run_id,
        "detail": "Live run events are not configured yet.",
    })
    await websocket.close()
```

---

## 10. Tests

### `backend/tests/test_agents.py`

```python
from main import app
from models import Base
from schemas import AgentCreate

def test_agent_related_tables_are_registered() -> None:
    assert {"agents", "tools", "messages"} <= set(Base.metadata.tables)

def test_agent_and_tool_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/agents/" in paths
    assert "/tools/" in paths
    assert "/messages/" in paths

def test_agent_defaults_validate() -> None:
    agent = AgentCreate(name="Researcher", system_prompt="Research carefully.")
    assert agent.model == "gpt-4o"
    assert agent.memory_enabled is True
```

### `backend/tests/test_workflow_execution.py`

```python
from main import app
from schemas import WorkflowCreate, WorkflowRunCreate

def test_workflow_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/workflows/" in paths
    assert "/workflows/{workflow_id}/runs" in paths

def test_workflow_create_schema_defaults() -> None:
    workflow = WorkflowCreate(name="Research Flow")
    assert workflow.nodes == []
    assert workflow.edges == []

def test_workflow_run_schema_requires_input() -> None:
    run = WorkflowRunCreate(input="Research this topic")
    assert run.input == "Research this topic"
```

### `backend/tests/test_telegram.py`

```python
from main import app

def test_telegram_route_is_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/telegram/webhook" in paths
```

---

## 11. Local Setup

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nxflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-nxflow}
      POSTGRES_USER: ${POSTGRES_USER:-nxflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nxflow}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### `.env.example`

```bash
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=123456:ABC-...
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app   # from: npx ngrok http 8000
```

### `backend/requirements.txt`

```
fastapi>=0.111.0
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
pydantic-settings
pytest
pytest-asyncio
```

### Setup

```bash
git clone https://github.com/yourname/nxflow-platform
cd nxflow-platform
cp .env.example .env

docker compose up -d postgres

PYTHONPATH=backend uvicorn main:app --reload --port 8000

cd frontend
npm install
npm run dev
```

---

## 12. README Template

```markdown
# NxFlow Agent Platform

## Architecture

[Paste architecture diagram here — use Excalidraw or Mermaid]

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy async
- **Frontend:** Next.js 14, React, TypeScript
- **Persistence:** PostgreSQL

## Quick Start

\`\`\`bash
cp .env.example .env   # fill in your keys
docker compose up -d postgres
PYTHONPATH=backend uvicorn main:app --reload --port 8000
cd frontend && npm run dev
\`\`\`
Visit http://localhost:3000

## Demo

[Link to video or GIF]
```

---

## 13. Demo Script (5 minutes)

```
0:00–0:30  SETUP
  - Show terminal: docker compose up -d postgres
  - Browser opens http://localhost:3000 — dashboard loads

0:30–1:30  CREATE AGENTS
  - New Agent → "Researcher"
    · Tools: web_search ✓
    · Model: gpt-4o
    · Memory: enabled
  - New Agent → "Summarizer"
    · Tools: none
    · Model: gpt-4o-mini
  - New Agent → "Assistant" (Telegram-facing)
    · Channel: Telegram
    · Tools: web_search ✓

1:30–2:30  BUILD WORKFLOW
  - New Workflow → "Research & Summarize"
  - Drag Researcher + Summarizer onto canvas
  - Connect Researcher → Summarizer
  - Save

2:30–3:30  TRIGGER FROM WEB UI
  - Click "Run Workflow"
  - Input: "What are the latest developments in AI agents?"
  - Switch to Runs
  - Show run history and simulated execution logs
  - Show final output + cost estimate

3:30–4:30  TELEGRAM WEBHOOK
  - Open API docs for /telegram/webhook
  - Send a sample update payload
  - Show accepted response and persisted routes

4:30–5:00  WRAP UP
  - Show run history table
  - Show inter-agent message log
  - Show token/cost tracking
```

---

## 14. Evaluation Checklist

### Working Demo — 40%
- [ ] Agents, tools, workflows, runs, and messages persist through the API
- [ ] Telegram webhook accepts update payloads
- [ ] Web UI triggers workflow demo state and shows run history
- [ ] Message history persisted and visible in UI
- [ ] Demo video recorded (≥ 3 minutes)

### Architecture & Code Quality — 30%
- [ ] Clear separation: api / persistence / frontend console
- [ ] No blocking calls — async throughout
- [ ] Tests pass: agent CRUD, workflow execution, Telegram webhook
- [ ] All secrets in `.env`, none hardcoded

### UI/UX & Configurability — 20%
- [ ] Agent form covers: name, role, prompt, model, tools, channel, guardrails
- [ ] Visual workflow builder
- [ ] Drag-and-drop agents onto canvas
- [ ] Conditional edges configurable
- [ ] Run monitor shows status, logs, token count, and cost estimate

### Documentation — 10%
- [ ] README has architecture diagram
- [ ] Local setup commands are documented and reproducible
