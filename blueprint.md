# Yuno AI Engineer Challenge — Solution Blueprint (Strands Agents)

> **Agent Framework: Strands Agents 1.0 (AWS)**
> Model-driven, minimal boilerplate, native multi-agent patterns, MCP support, async-ready.
> Follow this document top to bottom to build the full platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Agent Runtime — Strands](#6-agent-runtime--strands)
7. [Telegram Bot Integration](#7-telegram-bot-integration)
8. [Frontend — Next.js](#8-frontend--nextjs)
9. [Real-time Monitoring](#9-real-time-monitoring)
10. [Pre-built Workflow Templates](#10-pre-built-workflow-templates)
11. [Tests](#11-tests)
12. [Docker & Local Setup](#12-docker--local-setup)
13. [README Template](#13-readme-template)
14. [Demo Script](#14-demo-script)
15. [Evaluation Checklist](#15-evaluation-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                            │
│                                                                     │
│   Browser (Next.js)              Telegram Bot                       │
│   - Agent CRUD UI                - /start, /ask                     │
│   - Workflow Builder             - Sends messages to API            │
│   - Live Monitoring              - Receives agent replies           │
└────────────────┬─────────────────────────┬──────────────────────────┘
                 │  REST + WebSocket        │  HTTP Webhook
                 ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                              │
│                                                                     │
│  /agents      CRUD for agent configs                                │
│  /workflows   CRUD + trigger runs                                   │
│  /runs        Execution history + logs                              │
│  /telegram    Webhook receiver                                      │
│  /ws          WebSocket live log stream                             │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STRANDS AGENTS 1.0 RUNTIME                        │
│                                                                     │
│  Orchestrator Agent  ──tool──►  Specialist Agent A                  │
│       (Agent-as-Tool pattern)   Specialist Agent B                  │
│                                                                     │
│  Each agent: system_prompt + tools + model (any provider)           │
│  Tools: web_search, calculator, http_request, custom @tool fns      │
│  Memory: session_manager backed by Redis                            │
│  Streaming: stream_async() → Redis pub/sub → WebSocket              │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER                             │
│                                                                     │
│  PostgreSQL                        Redis                            │
│  - agents, workflows               - Agent session memory           │
│  - runs, run_events                - Pub/sub for live log stream    │
│  - messages                        - Rate-limit counters            │
└─────────────────────────────────────────────────────────────────────┘
```

**Multi-agent data flow:**

1. User sends message → Telegram or Web UI
2. FastAPI creates `Run` record → calls Strands orchestrator
3. Orchestrator uses specialist agents as tools (Agent-as-Tool pattern)
4. Each step streams tokens → Redis pub/sub channel
5. WebSocket pushes events live to browser
6. Final reply stored in DB + sent back to Telegram

---

## 2. Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Language | Python 3.11 | Strands is Python-native |
| Backend | FastAPI | Async, WebSocket, auto-docs |
| **Agent Framework** | **Strands Agents 1.0** | Minimal code, Agent-as-Tool multi-agent, native async streaming, MCP support, OpenAI/Anthropic/Bedrock compatible |
| LLM | OpenAI GPT-4o (per-agent config) | Best tool-calling; Strands supports any provider |
| Frontend | Next.js 14 | App Router, easy WebSocket integration |
| Workflow Builder | React Flow | Node-graph UI, MIT licensed |
| Database | PostgreSQL + SQLAlchemy async | Reliable, JSONB for flexible config |
| Cache / Memory | Redis | Pub/sub for streaming, session memory store |
| Messaging | Telegram (python-telegram-bot) | No business approval, clean API |
| Containers | Docker Compose | Single `docker compose up` |
| Styling | Tailwind + shadcn/ui | Fast, professional |

**Why Strands over LangGraph:**
- **10x less boilerplate** — an agent is just `Agent(system_prompt=..., tools=[...])`
- **Agent-as-Tool is built-in** — no manual graph wiring needed for multi-agent
- **Native async streaming** — `stream_async()` fits FastAPI/WebSocket perfectly
- **Model-agnostic** — swap OpenAI for Bedrock/Anthropic with one line
- **MCP native** — free access to thousands of community tools
- **Production-proven** — used in Amazon Q Developer and AWS Glue

---

## 3. Repository Structure

```
yuno-agent-platform/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── agent.py
│   │   │   ├── workflow.py
│   │   │   ├── run.py
│   │   │   └── message.py
│   │   ├── schemas/
│   │   │   ├── agent.py
│   │   │   ├── workflow.py
│   │   │   └── run.py
│   │   ├── routers/
│   │   │   ├── agents.py
│   │   │   ├── workflows.py
│   │   │   ├── runs.py
│   │   │   ├── telegram.py
│   │   │   └── ws.py
│   │   ├── runtime/
│   │   │   ├── agent_factory.py      # Builds Strands Agent from DB config
│   │   │   ├── workflow_runner.py    # Orchestrates multi-agent runs
│   │   │   ├── tools/
│   │   │   │   ├── web_search.py     # @tool decorated functions
│   │   │   │   ├── calculator.py
│   │   │   │   └── http_request.py
│   │   │   └── memory.py            # Redis session manager
│   │   ├── channels/
│   │   │   └── telegram_bot.py
│   │   └── templates/
│   │       ├── research_workflow.py
│   │       └── qa_workflow.py
│   ├── tests/
│   │   ├── test_agents.py
│   │   ├── test_workflow_execution.py
│   │   └── test_telegram.py
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Dashboard
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── workflows/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx         # React Flow builder
│   │   └── runs/
│   │       └── [id]/page.tsx         # Live monitor
│   ├── components/
│   │   ├── AgentForm.tsx
│   │   ├── WorkflowBuilder.tsx
│   │   ├── AgentNode.tsx
│   │   ├── RunMonitor.tsx
│   │   └── TokenUsageBar.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── useWebSocket.ts
│   ├── Dockerfile
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

### `backend/app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import agents, workflows, runs, telegram, ws
from app.channels.telegram_bot import setup_telegram_webhook

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await setup_telegram_webhook()
    yield

app = FastAPI(title="Yuno Agent Platform", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(agents.router,    prefix="/agents",    tags=["agents"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(runs.router,      prefix="/runs",      tags=["runs"])
app.include_router(telegram.router,  prefix="/telegram",  tags=["telegram"])
app.include_router(ws.router,        tags=["websocket"])
```

### `backend/app/routers/workflows.py` — trigger endpoint

```python
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.runtime.workflow_runner import run_workflow
from app import crud

router = APIRouter()

@router.post("/{workflow_id}/run")
async def trigger_workflow(
    workflow_id: str,
    body: RunRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    run = await crud.create_run(db, workflow_id, body.input)
    background.add_task(run_workflow, run.id, workflow_id, body.input)
    return run
```

---

## 6. Agent Runtime — Strands

This is where Strands shines. The entire multi-agent orchestration is ~50 lines.

### `backend/app/runtime/agent_factory.py`

```python
from strands import Agent
from strands.models import BedrockModel
from strands_tools import calculator, file_read, file_write
from openai import AsyncOpenAI
from app.runtime.tools import web_search, http_request
from app.runtime.memory import get_redis_session_manager

TOOL_REGISTRY = {
    "web_search":   web_search,
    "calculator":   calculator,
    "http_request": http_request,
    "file_read":    file_read,
    "file_write":   file_write,
}

def build_agent(agent_config: dict, session_id: str | None = None) -> Agent:
    """Build a live Strands Agent from a DB agent config dict."""
    tools = [TOOL_REGISTRY[t] for t in agent_config["tools"] if t in TOOL_REGISTRY]

    kwargs = dict(
        system_prompt=agent_config["system_prompt"],
        tools=tools,
        max_tokens=agent_config.get("max_tokens", 2000),
    )

    # Model provider selection (per-agent config)
    model_name = agent_config.get("model", "gpt-4o")
    if model_name.startswith("gpt"):
        from strands.models.openai import OpenAIModel
        kwargs["model"] = OpenAIModel(model_id=model_name)
    elif model_name.startswith("claude"):
        from strands.models.anthropic import AnthropicModel
        kwargs["model"] = AnthropicModel(model_id=model_name)
    # else: defaults to Bedrock Claude Sonnet 4

    # Attach Redis session memory if enabled
    if agent_config.get("memory_enabled") and session_id:
        kwargs["session_manager"] = get_redis_session_manager(session_id)

    return Agent(**kwargs)
```

### `backend/app/runtime/workflow_runner.py`

```python
import asyncio, json
from strands import Agent, tool
from app.runtime.agent_factory import build_agent
from app.runtime.memory import redis_publish
from app import crud

async def run_workflow(run_id: str, workflow_id: str, user_input: str):
    """
    Executes a workflow using the Agent-as-Tool pattern.
    The first node is the orchestrator; all other nodes become tools it can call.
    """
    async with get_db_context() as db:
        await crud.set_run_status(db, run_id, "running")
        workflow = await crud.get_workflow(db, workflow_id)
        agent_configs = await crud.get_agents_for_workflow(db, workflow)

    nodes = workflow["nodes"]
    edges = workflow["edges"]

    # Build specialist agents and wrap them as @tool functions
    specialist_tools = []
    for node in nodes[1:]:                         # skip first = orchestrator
        cfg = next(a for a in agent_configs if a["id"] == node["agent_id"])
        specialist = build_agent(cfg, session_id=f"{run_id}:{cfg['id']}")

        # Dynamically create a @tool-decorated function for this specialist
        agent_tool = _make_agent_tool(specialist, cfg["name"], cfg["role"])
        specialist_tools.append(agent_tool)

    # Build the orchestrator with specialists as tools
    orchestrator_cfg = next(
        a for a in agent_configs if a["id"] == nodes[0]["agent_id"]
    )
    orchestrator = build_agent(
        orchestrator_cfg,
        session_id=f"{run_id}:{orchestrator_cfg['id']}"
    )
    orchestrator.tools.extend(specialist_tools)

    # Stream execution and publish each event to Redis
    output_parts = []
    async for event in orchestrator.stream_async(user_input):
        await _handle_stream_event(run_id, event, output_parts)

    final_output = "".join(output_parts)
    async with get_db_context() as db:
        await crud.complete_run(db, run_id, final_output)


def _make_agent_tool(agent: Agent, name: str, role: str):
    """Wraps a Strands Agent as a @tool that an orchestrator can call."""
    from strands import tool

    # Use closure to capture agent reference
    def agent_fn(query: str) -> str:
        f"""Delegate to {name}: {role}. Input: the task or question to answer."""
        result = agent(query)
        return str(result)

    agent_fn.__name__ = name.lower().replace(" ", "_")
    agent_fn.__doc__ = f"{role}. Use for: {role}"
    return tool(agent_fn)


async def _handle_stream_event(run_id: str, event: dict, output_parts: list):
    """Publishes stream events to Redis pub/sub for WebSocket delivery."""
    if "data" in event:
        output_parts.append(event["data"])
        await redis_publish(run_id, {
            "event_type": "token",
            "content": event["data"],
        })
    elif "tool_use" in event:
        await redis_publish(run_id, {
            "event_type": "tool_call",
            "content": f"Using tool: {event['tool_use']['name']}",
            "metadata": event["tool_use"],
        })
    elif event.get("stop_reason"):
        await redis_publish(run_id, {
            "event_type": "agent_end",
            "content": "Agent finished.",
        })
```

### `backend/app/runtime/tools/web_search.py`

```python
from strands import tool
import httpx

@tool
def web_search(query: str) -> str:
    """Search the web for current information about a topic."""
    # Use SerpAPI or DuckDuckGo API
    response = httpx.get(
        "https://api.duckduckgo.com/",
        params={"q": query, "format": "json", "no_html": 1}
    )
    data = response.json()
    results = data.get("RelatedTopics", [])[:5]
    return "\n".join(r.get("Text", "") for r in results if "Text" in r)
```

### `backend/app/runtime/memory.py`

```python
import redis.asyncio as aioredis
import json
from strands.session import SessionManager

_redis = aioredis.from_url("redis://localhost:6379")

def get_redis_session_manager(session_id: str) -> SessionManager:
    """Returns a Strands SessionManager backed by Redis."""
    # Strands 1.0 SessionManager can be subclassed to use any backend
    return RedisSessionManager(session_id)

async def redis_publish(run_id: str, event: dict):
    await _redis.publish(f"run:{run_id}", json.dumps(event))


class RedisSessionManager(SessionManager):
    def __init__(self, session_id: str):
        self.session_id = session_id

    async def get_session(self):
        data = await _redis.get(f"session:{self.session_id}")
        return json.loads(data) if data else {}

    async def save_session(self, state: dict):
        await _redis.set(
            f"session:{self.session_id}",
            json.dumps(state),
            ex=86400  # 24h TTL
        )
```

---

## 7. Telegram Bot Integration

### `backend/app/channels/telegram_bot.py`

```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.config import settings
from app.runtime.agent_factory import build_agent

bot_app: Application = None

async def setup_telegram_webhook():
    global bot_app
    if not settings.TELEGRAM_BOT_TOKEN:
        return
    bot_app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    bot_app.add_handler(CommandHandler("start", handle_start))
    bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    await bot_app.bot.set_webhook(f"{settings.PUBLIC_URL}/telegram/webhook")
    await bot_app.initialize()

async def handle_start(update: Update, context):
    await update.message.reply_text(
        "👋 Hi! I'm your AI assistant. Ask me anything."
    )

async def handle_message(update: Update, context):
    user_input = update.message.text
    chat_id = str(update.message.chat_id)

    # Load the agent configured with channel='telegram'
    agent_config = await get_telegram_agent_config()   # from DB
    agent = build_agent(agent_config, session_id=f"tg:{chat_id}")

    # Collect streamed response
    reply_parts = []
    async for event in agent.stream_async(user_input):
        if "data" in event:
            reply_parts.append(event["data"])

    reply = "".join(reply_parts)
    await context.bot.send_message(chat_id=chat_id, text=reply)

    # Persist message history
    await save_message(agent_config["id"], "telegram", "inbound",  user_input, chat_id)
    await save_message(agent_config["id"], "telegram", "outbound", reply,      "agent")
```

### `backend/app/routers/telegram.py`

```python
from fastapi import APIRouter, Request
from app.channels.telegram_bot import bot_app
from telegram import Update

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    update = Update.de_json(data, bot_app.bot)
    await bot_app.process_update(update)
    return {"ok": True}
```

---

## 8. Frontend — Next.js

### Agent Form fields (`components/AgentForm.tsx`)

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

### Workflow Builder (`components/WorkflowBuilder.tsx`)

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

### Live Run Monitor (`components/RunMonitor.tsx`)

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

### WebSocket endpoint (`backend/app/routers/ws.py`)

```python
from fastapi import APIRouter, WebSocket
import redis.asyncio as aioredis

router = APIRouter()

@router.websocket("/ws/runs/{run_id}")
async def run_websocket(websocket: WebSocket, run_id: str):
    await websocket.accept()
    redis = aioredis.from_url("redis://localhost:6379")
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"run:{run_id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"].decode())
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(f"run:{run_id}")
        await websocket.close()
```

---

## 10. Pre-built Workflow Templates

### Template 1: Research & Summarize

```
[User Input]
     │
     ▼
Orchestrator Agent
  (has researcher + summarizer as tools)
     ├──tool──► Researcher Agent  (web_search tool)
     │               returns raw findings
     └──tool──► Summarizer Agent  (no tools)
                     returns clean prose
     │
     ▼
[Final Answer]
```

**Seed config:**

```python
RESEARCH_TEMPLATE = {
    "name": "Research & Summarize",
    "is_template": True,
    "nodes": [
        {
            "id": "orchestrator",
            "label": "Executive Assistant",
            "system_prompt": (
                "You coordinate research and writing tasks. "
                "Use the researcher to gather facts, then the summarizer to write the final answer."
            ),
            "tools": [],
            "model": "gpt-4o"
        },
        {
            "id": "researcher",
            "label": "Researcher",
            "system_prompt": "You are a research specialist. Use web_search to find accurate, up-to-date facts. Return raw findings.",
            "tools": ["web_search"],
            "model": "gpt-4o"
        },
        {
            "id": "summarizer",
            "label": "Summarizer",
            "system_prompt": "You are a professional writer. Take research findings and write a clear 3-paragraph summary.",
            "tools": [],
            "model": "gpt-4o-mini"
        }
    ],
    "edges": [
        {"source": "orchestrator", "target": "researcher"},
        {"source": "orchestrator", "target": "summarizer"}
    ]
}
```

### Template 2: Q&A with Fact Check

```
[User Question]
      │
      ▼
Orchestrator Agent
      ├──tool──► Answerer Agent     (generates answer)
      └──tool──► Fact-Checker Agent (web_search to verify)
      │
      ▼
Synthesizes verified final answer
```

**Fact-Checker system prompt:**
```
You receive a question and a proposed answer.
Use web_search to verify the key claims.
Return JSON: {"verdict": "verified"|"disputed", "corrections": "..."|null}
```

---

## 11. Tests

### `backend/tests/test_agents.py`

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_agent():
    async with AsyncClient(app=app, base_url="http://test") as c:
        res = await c.post("/agents/", json={
            "name": "Test Agent",
            "system_prompt": "You are helpful.",
            "model": "gpt-4o-mini",
            "tools": [],
        })
    assert res.status_code == 201
    assert res.json()["name"] == "Test Agent"

@pytest.mark.asyncio
async def test_list_agents():
    async with AsyncClient(app=app, base_url="http://test") as c:
        res = await c.get("/agents/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_delete_agent():
    async with AsyncClient(app=app, base_url="http://test") as c:
        create = await c.post("/agents/", json={
            "name": "Delete Me", "system_prompt": "test", "model": "gpt-4o-mini"
        })
        delete = await c.delete(f"/agents/{create.json()['id']}")
    assert delete.status_code == 204
```

### `backend/tests/test_workflow_execution.py`

```python
@pytest.mark.asyncio
async def test_two_agent_workflow(mock_openai):
    """Verify orchestrator delegates to a specialist and returns combined output."""
    researcher_cfg = {
        "id": "r1", "name": "Researcher",
        "system_prompt": "Research facts.",
        "model": "gpt-4o-mini", "tools": [], "memory_enabled": False
    }
    orchestrator_cfg = {
        "id": "o1", "name": "Orchestrator",
        "system_prompt": "Coordinate. Use researcher tool.",
        "model": "gpt-4o-mini", "tools": [], "memory_enabled": False
    }
    workflow = {
        "nodes": [
            {"id": "n1", "agent_id": "o1"},
            {"id": "n2", "agent_id": "r1"}
        ],
        "edges": [{"source": "n1", "target": "n2"}]
    }

    # run_workflow is tested with mocked LLM
    result = await run_workflow_in_memory("test-run-1", workflow,
                                          [orchestrator_cfg, researcher_cfg],
                                          "Explain photosynthesis")
    assert result["output"] is not None
    assert len(result["events"]) >= 2
```

### `backend/tests/test_telegram.py`

```python
@pytest.mark.asyncio
async def test_telegram_webhook():
    async with AsyncClient(app=app, base_url="http://test") as c:
        res = await c.post("/telegram/webhook", json={
            "update_id": 1,
            "message": {
                "message_id": 1,
                "chat": {"id": 999, "type": "private"},
                "text": "Hello",
                "date": 1700000000,
                "from": {"id": 42, "is_bot": False, "first_name": "Test"}
            }
        })
    assert res.status_code == 200
    assert res.json() == {"ok": True}
```

---

## 12. Docker & Local Setup

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: yuno
      POSTGRES_USER: yuno
      POSTGRES_PASSWORD: yuno
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://yuno:yuno@postgres/yuno
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      PUBLIC_URL: ${PUBLIC_URL}
    depends_on: [postgres, redis]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_WS_URL: ws://localhost:8000
    depends_on: [backend]

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
alembic
redis[asyncio]
strands-agents>=1.0.0
strands-agents-tools
openai
python-telegram-bot>=20.0
pydantic-settings
httpx
pytest
pytest-asyncio
```

### Setup

```bash
git clone https://github.com/yourname/yuno-agent-platform
cd yuno-agent-platform
cp .env.example .env
# Fill OPENAI_API_KEY and TELEGRAM_BOT_TOKEN

# Expose localhost for Telegram webhook
npx ngrok http 8000
# Paste the https:// URL into .env as PUBLIC_URL

docker compose up --build

# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

---

## 13. README Template

```markdown
# Yuno AI Agent Orchestration Platform

## Architecture

[Paste architecture diagram here — use Excalidraw or Mermaid]

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy async, Alembic
- **Agent Runtime:** Strands Agents 1.0 — chosen for minimal boilerplate,
  built-in Agent-as-Tool multi-agent pattern, native async streaming,
  MCP support, and model-agnostic design
- **LLM:** OpenAI GPT-4o (configurable per agent; supports Anthropic, Bedrock)
- **Frontend:** Next.js 14, React Flow, Tailwind CSS, shadcn/ui
- **Persistence:** PostgreSQL + Redis
- **Messaging:** Telegram Bot API

## Why Strands Agents?

Strands was chosen over LangGraph and CrewAI because:
1. **Minimal code:** An agent is `Agent(system_prompt=..., tools=[...])`
2. **Agent-as-Tool pattern:** Multi-agent orchestration without graph wiring
3. **Native async streaming:** `stream_async()` fits WebSocket delivery perfectly
4. **Model-agnostic:** One line to swap between OpenAI, Anthropic, Bedrock
5. **Production-proven:** Powers Amazon Q Developer and AWS Glue

## Quick Start

\`\`\`bash
cp .env.example .env   # fill in your keys
npx ngrok http 8000    # get PUBLIC_URL for Telegram webhook
docker compose up --build
\`\`\`
Visit http://localhost:3000

## Adding a New Workflow Template

1. Create `backend/app/templates/my_template.py`
2. Define `TEMPLATE_CONFIG = {"name": ..., "nodes": [...], "edges": [...]}`
3. Run `python scripts/seed_template.py my_template`
4. Template appears in the UI under "Start from template"

## Adding a New Messaging Channel

1. Create `backend/app/channels/my_channel.py`
2. Implement `setup_webhook()` and `handle_message()`
3. Add a `POST /my_channel/webhook` router
4. Set `channel="my_channel"` on an agent config via the UI

## Demo

[Link to video or GIF]
```

---

## 14. Demo Script (5 minutes)

```
0:00–0:30  SETUP
  - Show terminal: docker compose up
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
  - Switch to Live Monitor tab
  - Show tokens streaming in real time
  - Show tool_call event for web_search
  - Show final output + cost estimate

3:30–4:30  TELEGRAM DEMO
  - Open Telegram, message the bot:
    "Summarize the top 3 AI news stories today"
  - Show bot typing... then reply appears
  - Switch to web UI → run appears in history

4:30–5:00  WRAP UP
  - Show run history table
  - Show inter-agent message log
  - Show token/cost tracking
```

---

## 15. Evaluation Checklist

### Working Demo — 40%
- [ ] 2+ agents complete a real task via Agent-as-Tool
- [ ] Telegram bot receives and replies conversationally
- [ ] Web UI triggers workflow + shows live token stream
- [ ] Message history persisted and visible in UI
- [ ] Demo video recorded (≥ 3 minutes)

### Architecture & Code Quality — 30%
- [ ] Clear separation: routers / runtime / persistence
- [ ] No blocking calls — async throughout
- [ ] Strands `stream_async()` used for real-time delivery
- [ ] Tests pass: agent CRUD, workflow execution, Telegram webhook
- [ ] All secrets in `.env`, none hardcoded

### UI/UX & Configurability — 20%
- [ ] Agent form covers: name, role, prompt, model, tools, channel, guardrails
- [ ] React Flow visual workflow builder
- [ ] Drag-and-drop agents onto canvas
- [ ] Conditional edges configurable
- [ ] 2 pre-built templates available at first launch
- [ ] Live monitor with token count + cost estimate

### Documentation — 10%
- [ ] README has architecture diagram
- [ ] `docker compose up --build` is the only setup step
- [ ] Strands choice justified in README
- [ ] Guide for adding new templates
- [ ] Guide for adding new messaging channels
