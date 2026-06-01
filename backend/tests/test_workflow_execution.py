"""Tests for workflow execution, streaming, and event persistence."""

import pytest
from pydantic import ValidationError
from uuid import UUID

from main import app
from datastore.model import Agent, Base, Run, Workflow
from datastore.schema import MessageCreate, RunEventCreate, WorkflowCreate
from runtime.workflow_runner import WorkflowRunner
from templates import WORKFLOW_TEMPLATES


def test_workflow_run_tables_are_registered() -> None:
    assert {"workflows", "runs", "run_events"} <= set(Base.metadata.tables)


def test_observability_columns_are_registered() -> None:
    run_event_columns = set(Base.metadata.tables["run_events"].columns.keys())
    message_columns = set(Base.metadata.tables["messages"].columns.keys())
    assert {"agent_id", "metadata", "tokens_used", "cost_usd"} <= run_event_columns
    assert {"run_id", "agent_id", "metadata"} <= message_columns


def test_workflow_run_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/workflows/" in paths
    assert "/workflows/templates" in paths
    assert "/workflows/templates/{template_key}" in paths
    assert "/workflows/{workflow_id}/runs" in paths
    assert "/runs/" in paths
    assert "/runs/{run_id}/execute" in paths
    assert "/runs/{run_id}/events" in paths
    assert "/ws/runs/{run_id}" in paths


def test_workflow_payload_defaults_validate() -> None:
    workflow = WorkflowCreate(name="Research Flow")
    assert workflow.nodes == []
    assert workflow.edges == []


def test_observability_payload_defaults_validate() -> None:
    event = RunEventCreate(event_type="agent_start")
    message = MessageCreate(direction="inter_agent", content="Draft ready")
    assert event.metadata == {}
    assert event.tokens_used == 0
    assert event.cost_usd == 0
    assert message.metadata == {}
    assert message.direction == "inter_agent"


def test_workflow_run_payload_can_request_immediate_execution() -> None:
    from datastore.schema import WorkflowRunCreate

    payload = WorkflowRunCreate(input="research this", execute=True)
    assert payload.input == "research this"
    assert payload.execute is True


def test_workflow_graph_validation_allows_conditions_and_feedback_loops() -> None:
    workflow = WorkflowCreate(
        name="Review Flow",
        nodes=[{"id": "draft", "type": "agent"}, {"id": "review", "type": "agent"}],
        edges=[
            {
                "id": "review-feedback",
                "source": "review",
                "target": "draft",
                "condition": "needs_revision",
                "feedback_loop": True,
            }
        ],
    )
    assert workflow.edges[0]["feedback_loop"] is True


def test_workflow_graph_validation_rejects_missing_node_ids() -> None:
    with pytest.raises(ValidationError):
        WorkflowCreate(name="Broken Flow", nodes=[{"type": "agent"}])


def test_workflow_graph_validation_rejects_duplicate_node_ids() -> None:
    with pytest.raises(ValidationError):
        WorkflowCreate(
            name="Broken Flow",
            nodes=[{"id": "agent", "type": "agent"}, {"id": "agent", "type": "agent"}],
        )


def test_required_workflow_templates_are_available() -> None:
    template_names = {template["name"] for template in WORKFLOW_TEMPLATES}
    assert {"Research and Summarize", "Answer and Fact Check"} <= template_names


class FakeStreamAgent:
    def __init__(self, response: list[dict[str, object]]) -> None:
        self.response = response
        self.calls: list[str] = []

    async def stream_async(self, prompt: str):
        self.calls.append(prompt)
        for payload in self.response:
            yield payload


class FakeAgentFactory:
    def __init__(self, responses: list[list[dict[str, object]]]) -> None:
        self.responses = responses
        self.index = 0
        self.stream_agents: list[FakeStreamAgent] = []

    def build(self, agent_config: Agent) -> FakeStreamAgent:
        agent = FakeStreamAgent(self.responses[self.index])
        self.index += 1
        self.stream_agents.append(agent)
        return agent


class FakeSession:
    def __init__(self, objects: dict[type[object], dict[object, object]]) -> None:
        self.objects = objects
        self.added: list[object] = []
        self.flushed = 0
        self.committed = 0

    async def get(self, model: type[object], key: object):
        return self.objects.get(model, {}).get(key)

    async def scalar(self, statement):  # pragma: no cover - not used in this test
        raise AssertionError("scalar should not be called")

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        self.flushed += 1

    async def commit(self) -> None:
        self.committed += 1


@pytest.mark.asyncio
async def test_workflow_runner_executes_two_agents_in_sequence() -> None:
    researcher = Agent(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        name="Researcher",
        role="researcher",
        system_prompt="Research carefully.",
        provider="grok",
        model="grok-3",
        tools=[],
        skills=[],
        interaction_rules={},
        guardrails={},
    )
    summarizer = Agent(
        id=UUID("22222222-2222-2222-2222-222222222222"),
        name="Summarizer",
        role="summarizer",
        system_prompt="Summarize clearly.",
        provider="grok",
        model="grok-3",
        tools=[],
        skills=[],
        interaction_rules={},
        guardrails={},
    )
    workflow = Workflow(
        id=UUID("33333333-3333-3333-3333-333333333333"),
        name="Research Flow",
        nodes=[
            {"id": "researcher", "type": "agent", "agent_id": researcher.id},
            {"id": "summarizer", "type": "agent", "agent_id": summarizer.id},
        ],
        edges=[{"source": "researcher", "target": "summarizer"}],
    )
    run = Run(
        id=UUID("44444444-4444-4444-4444-444444444444"),
        workflow_id=workflow.id,
        status="pending",
        input="What is NxFlow?",
        total_tokens=0,
        total_cost_usd=0.0,
    )

    responses = [
        [{"type": "text_delta", "text": "research notes ", "usage": {"tokens": 5, "cost_usd": 0.01}}],
        [{"type": "text_delta", "text": "final summary", "usage": {"input_tokens": 3, "output_tokens": 2}}],
    ]
    session = FakeSession(
        {
            Agent: {researcher.id: researcher, summarizer.id: summarizer},
            Workflow: {workflow.id: workflow},
            Run: {run.id: run},
        }
    )
    runner = WorkflowRunner(db=session, agent_factory=FakeAgentFactory(responses))

    result = await runner.run(run.id)

    assert result.status == "completed"
    assert result.output == "final summary"
    assert result.total_tokens == 10
    assert result.total_cost_usd == 0.01
    assert len([obj for obj in session.added if obj.__class__.__name__ == "RunEvent"]) == 8
    assert len([obj for obj in session.added if obj.__class__.__name__ == "Message"]) == 2
