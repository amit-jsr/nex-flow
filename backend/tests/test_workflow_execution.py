import pytest
from pydantic import ValidationError

from main import app
from datastore.model import Base
from datastore.schema import MessageCreate, RunEventCreate, WorkflowCreate
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
