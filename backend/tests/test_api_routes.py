"""Integration-style tests covering the backend API route surface."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import BackgroundTasks
from fastapi import WebSocketDisconnect

from api import agents as agents_api
from api import messages as messages_api
from api import runs as runs_api
from api import tools as tools_api
from api import telegram as telegram_api
from api import workflows as workflows_api
from api import ws as ws_api
from datastore.model import Agent, Message, Run, RunEvent, Tool, Workflow
from datastore.schema import (
    AgentCreate,
    AgentUpdate,
    MessageCreate,
    RunCreate,
    RunEventCreate,
    RunUpdate,
    ToolCreate,
    ToolUpdate,
    WorkflowCreate,
    WorkflowRunCreate,
    WorkflowUpdate,
)


class ScalarResult:
    def __init__(self, items: list[object]) -> None:
        self._items = items

    def all(self) -> list[object]:
        return self._items


class FakeDB:
    def __init__(self) -> None:
        self.objects: dict[type[object], dict[object, object]] = {}
        self.scalars_items: list[object] = []
        self.added: list[object] = []
        self.deleted: list[object] = []
        self.committed = 0
        self.flushed = 0
        self.refreshed: list[object] = []
        self.rollback_called = False
        self._id_counter = 1

    def register(self, obj: object, key: object | None = None) -> None:
        model = type(obj)
        self.objects.setdefault(model, {})[key or getattr(obj, "id")] = obj

    async def get(self, model: type[object], key: object):
        model_objects = self.objects.get(model, {})
        if key in model_objects:
            return model_objects[key]
        for obj in model_objects.values():
            obj_key = getattr(obj, "id", None)
            if obj_key == key or str(obj_key) == str(key):
                return obj
        return None

    async def scalars(self, statement):  # pragma: no cover - exercised via route calls
        return ScalarResult(self.scalars_items)

    def add(self, obj: object) -> None:
        self.added.append(obj)
        now = datetime.now(UTC)
        if hasattr(obj, "id") and getattr(obj, "id") is None:
            setattr(obj, "id", self._id_counter)
            self._id_counter += 1
        if hasattr(obj, "created_at") and getattr(obj, "created_at") is None:
            setattr(obj, "created_at", now)
        if hasattr(obj, "updated_at") and getattr(obj, "updated_at") is None:
            setattr(obj, "updated_at", now)
        key = getattr(obj, "id", None)
        if key is not None:
            self.objects.setdefault(type(obj), {})[key] = obj

    async def commit(self) -> None:
        self.committed += 1

    async def refresh(self, obj: object) -> None:
        self.refreshed.append(obj)

    async def flush(self) -> None:
        self.flushed += 1

    async def delete(self, obj: object) -> None:
        self.deleted.append(obj)

    async def rollback(self) -> None:
        self.rollback_called = True


class FailingCommitDB(FakeDB):
    async def commit(self) -> None:
        from sqlalchemy.exc import IntegrityError

        raise IntegrityError("statement", "params", Exception("duplicate"))


def _uuid(value: str) -> UUID:
    return UUID(value)


@pytest.mark.asyncio
async def test_agent_routes_cover_crud_and_filters() -> None:
    db = FakeDB()
    agent = Agent(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Researcher",
        role="researcher",
        system_prompt="Research carefully.",
        provider="grok",
        model="grok-3",
        created_at=datetime.now(UTC),
    )
    db.scalars_items = [agent]
    db.register(agent)

    created = await agents_api.create_agent(
        AgentCreate(name="Researcher", system_prompt="Research carefully."),
        db=db,
    )
    assert created.name == "Researcher"

    listed = await agents_api.list_agents(role="researcher", channel=None, limit=100, offset=0, db=db)
    assert listed == [agent]

    scheduled: list[UUID] = []
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(agents_api, "schedule_run", scheduled.append)
    try:
        run = await agents_api.create_agent_run(
            agent.id,
            WorkflowRunCreate(input="hello agent", execute=True),
            BackgroundTasks(),
            db=db,
        )
    finally:
        monkeypatch.undo()
    assert run.agent_id == agent.id
    assert scheduled == [run.id]

    with pytest.raises(Exception, match="Agent not found"):
        await agents_api.get_agent(_uuid("22222222-2222-2222-2222-222222222222"), db=FakeDB())


@pytest.mark.asyncio
async def test_message_routes_cover_crud_and_filters() -> None:
    db = FakeDB()
    run = Run(id=_uuid("11111111-1111-1111-1111-111111111111"), status="init")
    agent = Agent(
        id=_uuid("22222222-2222-2222-2222-222222222222"),
        name="Researcher",
        system_prompt="Research carefully.",
        provider="grok",
        model="grok-3",
        created_at=datetime.now(UTC),
    )
    message = Message(
        id=1,
        run_id=run.id,
        agent_id=agent.id,
        channel="telegram",
        direction="inbound",
        content="Hello",
        sender_id="123",
        message_metadata={"origin": "chat"},
        created_at=datetime.now(UTC),
    )
    db.register(run)
    db.register(agent)
    db.scalars_items = [message]

    created = await messages_api.create_message(
        MessageCreate(
            run_id=run.id,
            agent_id=agent.id,
            channel="telegram",
            direction="inbound",
            content="Hello",
            sender_id="123",
            metadata={"origin": "chat"},
        ),
        db=db,
    )
    assert created.content == "Hello"

    listed = await messages_api.list_messages(
        run_id=run.id,
        agent_id=agent.id,
        channel="telegram",
        limit=100,
        offset=0,
        db=db,
    )
    assert listed[0].content == "Hello"

    await messages_api.delete_message(message.id, db=db)
    assert db.deleted

    with pytest.raises(Exception, match="Run not found"):
        await messages_api.create_message(
            MessageCreate(run_id=_uuid("33333333-3333-3333-3333-333333333333"), content="bad"),
            db=FakeDB(),
        )


@pytest.mark.asyncio
async def test_tool_routes_cover_crud_and_conflict() -> None:
    db = FakeDB()
    tool = Tool(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        key="web_search",
        name="Web Search",
        source="custom",
        status="available",
        configuration={},
        created_at=datetime.now(UTC),
    )
    db.scalars_items = [tool]

    created = await tools_api.create_tool(
        ToolCreate(key="web_search", name="Web Search"),
        db=db,
    )
    assert created.key == "web_search"

    listed = await tools_api.list_tools(source="custom", tool_status="available", limit=100, offset=0, db=db)
    assert listed == [tool]

    with pytest.raises(Exception, match="Tool key already exists"):
        await tools_api.create_tool(ToolCreate(key="dup", name="Duplicate"), db=FailingCommitDB())


@pytest.mark.asyncio
async def test_workflow_routes_cover_templates_and_runs() -> None:
    db = FakeDB()
    workflow = Workflow(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Research Flow",
        nodes=[{"id": "researcher", "type": "agent"}],
        edges=[],
        created_at=datetime.now(UTC),
    )
    run = Run(id=_uuid("22222222-2222-2222-2222-222222222222"), workflow_id=workflow.id, status="init")
    db.register(workflow)
    db.register(run)
    db.scalars_items = [workflow]

    created = await workflows_api.create_workflow(
        WorkflowCreate(name="Research Flow", nodes=[{"id": "researcher", "type": "agent"}]),
        db=db,
    )
    assert created.name == "Research Flow"

    listed = await workflows_api.list_workflows(is_template=None, limit=100, offset=0, db=db)
    assert listed == [workflow]

    templates = await workflows_api.list_workflow_templates()
    assert len(templates) >= 2

    templated = await workflows_api.create_workflow_from_template("research-and-summarize", db=db)
    assert templated.is_template is True

    fetched = await workflows_api.get_workflow(workflow.id, db=db)
    assert fetched.id == workflow.id

    updated = await workflows_api.update_workflow(
        workflow.id,
        WorkflowUpdate(name="Updated Flow", nodes=[{"id": "researcher", "type": "agent"}]),
        db=db,
    )
    assert updated.name == "Updated Flow"

    run_created = await workflows_api.create_workflow_run(
        workflow.id,
        WorkflowRunCreate(input="hello", execute=False),
        background_tasks=BackgroundTasks(),
        db=db,
    )
    assert run_created.workflow_id == workflow.id

    await workflows_api.delete_workflow(workflow.id, db=db)
    assert db.deleted[-1] is workflow


@pytest.mark.asyncio
async def test_workflow_run_execute_schedules_runtime(monkeypatch) -> None:
    db = FakeDB()
    workflow = Workflow(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Research Flow",
        nodes=[{"id": "researcher", "type": "agent"}],
        edges=[],
    )
    db.register(workflow)
    scheduled: list[tuple[UUID, datetime | None]] = []

    def fake_schedule_run(run_id: UUID, run_at: datetime | None = None):
        scheduled.append((run_id, run_at))

    monkeypatch.setattr(workflows_api, "schedule_run", fake_schedule_run)

    run = await workflows_api.create_workflow_run(
        workflow.id,
        WorkflowRunCreate(input="hello", execute=True),
        background_tasks=BackgroundTasks(),
        db=db,
    )

    assert scheduled == [(run.id, None)]
    queued_events = [event for event in db.added if isinstance(event, RunEvent)]
    assert queued_events[-1].event_type == "run_queued"


@pytest.mark.asyncio
async def test_workflow_run_can_be_scheduled(monkeypatch) -> None:
    db = FakeDB()
    workflow = Workflow(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Research Flow",
        nodes=[{"id": "researcher", "type": "agent"}],
        edges=[],
    )
    db.register(workflow)
    scheduled: list[tuple[UUID, datetime | None]] = []

    def fake_schedule_run(run_id: UUID, run_at: datetime | None = None):
        scheduled.append((run_id, run_at))

    monkeypatch.setattr(workflows_api, "schedule_run", fake_schedule_run)
    scheduled_at = datetime.now(UTC) + timedelta(minutes=15)

    run = await workflows_api.create_workflow_run(
        workflow.id,
        WorkflowRunCreate(input="hello later", scheduled_at=scheduled_at),
        background_tasks=BackgroundTasks(),
        db=db,
    )

    assert run.status == "pending"
    assert run.scheduled_at == scheduled_at
    assert scheduled == [(run.id, scheduled_at)]
    scheduled_events = [event for event in db.added if isinstance(event, RunEvent)]
    assert scheduled_events[-1].event_type == "run_scheduled"
    assert scheduled_events[-1].event_metadata["scheduled_at"] == scheduled_at.isoformat()


@pytest.mark.asyncio
async def test_run_routes_cover_crud_and_events() -> None:
    db = FakeDB()
    workflow = Workflow(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Research Flow",
        nodes=[{"id": "researcher", "type": "agent"}],
        edges=[],
    )
    run = Run(
        id=_uuid("22222222-2222-2222-2222-222222222222"),
        workflow_id=workflow.id,
        status="init",
        input="hello",
        total_tokens=0,
        total_cost_usd=0.0,
        created_at=datetime.now(UTC),
    )
    event = RunEvent(
        id=1,
        run_id=run.id,
        event_type="text_delta",
        content="hi",
        event_metadata={},
        tokens_used=3,
        cost_usd=0.01,
        created_at=datetime.now(UTC),
    )
    db.register(workflow)
    db.register(run)
    db.scalars_items = [run, event]

    created = await runs_api.create_run(RunCreate(workflow_id=workflow.id, input="hello"), db=db)
    assert created.workflow_id == workflow.id

    db.scalars_items = [run]
    listed = await runs_api.list_runs(workflow_id=workflow.id, run_status=None, limit=100, offset=0, db=db)
    assert listed == [run]

    fetched = await runs_api.get_run(run.id, db=db)
    assert fetched.id == run.id

    updated = await runs_api.update_run(run.id, RunUpdate(status="running", total_tokens=5), db=db)
    assert updated.status == "running"

    cancelled = await runs_api.cancel_run(run.id, db=db)
    assert cancelled.status == "cancelled"
    cancel_events = [event for event in db.added if isinstance(event, RunEvent) and event.event_type == "run_cancelled"]
    assert cancel_events

    await runs_api.create_run_event(
        run.id,
        RunEventCreate(event_type="text_delta", content="hi"),
        db=db,
    )
    db.scalars_items = [event]
    listed_events = await runs_api.list_run_events(run.id, limit=500, db=db)
    assert listed_events[0].event_type == "text_delta"

    await runs_api.delete_run(run.id, db=db)
    assert db.deleted


@pytest.mark.asyncio
async def test_execute_run_schedules_runtime(monkeypatch) -> None:
    db = FakeDB()
    run = Run(
        id=_uuid("22222222-2222-2222-2222-222222222222"),
        status="init",
        input="hello",
        total_tokens=0,
        total_cost_usd=0.0,
        created_at=datetime.now(UTC),
    )
    db.register(run)
    scheduled: list[UUID] = []
    monkeypatch.setattr(runs_api, "schedule_run", scheduled.append)

    executed = await runs_api.execute_run(run.id, background_tasks=BackgroundTasks(), db=db)

    assert executed.id == run.id
    assert scheduled == [run.id]
    queued_events = [event for event in db.added if isinstance(event, RunEvent)]
    assert queued_events[-1].event_type == "run_queued"


@pytest.mark.asyncio
async def test_telegram_route_and_websocket_flow() -> None:
    class FakeTelegramClient:
        def __init__(self, token: str) -> None:
            self.token = token
            self.sent: list[tuple[str, str]] = []

        async def send_message(self, chat_id: str, text: str) -> None:
            self.sent.append((chat_id, text))

        def build_send_message_request(self, chat_id: str, text: str):  # pragma: no cover
            return SimpleNamespace(url="", payload={})

    class FakeWebSocket:
        def __init__(self) -> None:
            self.sent: list[dict[str, object]] = []

        async def accept(self) -> None:
            return None

        async def send_json(self, payload: dict[str, object]) -> None:
            self.sent.append(payload)

    class Queue:
        def __init__(self, items: list[dict[str, object]]) -> None:
            self.items = items
            self.calls = 0

        async def get(self):
            if self.calls == 0:
                self.calls += 1
                return self.items[0]
            raise WebSocketDisconnect()

    db = FakeDB()
    workflow = Workflow(
        id=_uuid("11111111-1111-1111-1111-111111111111"),
        name="Telegram Flow",
        nodes=[{"id": "researcher", "type": "agent"}],
        edges=[],
        created_at=datetime.now(UTC),
    )
    agent = Agent(
        id=_uuid("33333333-3333-3333-3333-333333333333"),
        name="Researcher",
        system_prompt="Research carefully.",
        provider="grok",
        model="grok-3",
        created_at=datetime.now(UTC),
    )
    db.register(workflow)
    db.register(agent)

    original_client = telegram_api.TelegramBotClient
    telegram_api.TelegramBotClient = FakeTelegramClient  # type: ignore[assignment]
    try:
        telegram_api.settings.telegram_bot_token = None
        telegram_api.settings.telegram_default_agent_id = str(agent.id)
        telegram_api.settings.telegram_default_workflow_id = str(workflow.id)

        response = await telegram_api.receive_update(
            {
                "update_id": 1,
                "message": {
                    "message_id": 10,
                    "chat": {"id": 99},
                    "from": {"id": 88},
                    "text": "/start",
                },
            },
            background_tasks=BackgroundTasks(),
            db=db,
        )
        assert response["command"] == "start"
        assert response["run_id"] is not None

        response = await telegram_api.receive_update(
            {
                "update_id": 2,
                "message": {
                    "message_id": 11,
                    "chat": {"id": 99},
                    "from": {"id": 88},
                    "text": "hello",
                },
            },
            background_tasks=BackgroundTasks(),
            db=db,
        )
        assert response["accepted"] is True

        ws = FakeWebSocket()
        queue = Queue([{"type": "run_started"}])
        original_subscribe = ws_api.run_event_bus.subscribe
        original_unsubscribe = ws_api.run_event_bus.unsubscribe
        ws_api.run_event_bus.subscribe = lambda run_id: queue  # type: ignore[assignment]
        ws_api.run_event_bus.unsubscribe = lambda run_id, q: None  # type: ignore[assignment]
        try:
            await ws_api.run_events_socket(ws, "run-123")
        finally:
            ws_api.run_event_bus.subscribe = original_subscribe  # type: ignore[assignment]
            ws_api.run_event_bus.unsubscribe = original_unsubscribe  # type: ignore[assignment]

        assert ws.sent[0]["type"] == "connected"
        assert ws.sent[1]["type"] == "run_started"
    finally:
        telegram_api.TelegramBotClient = original_client  # type: ignore[assignment]
