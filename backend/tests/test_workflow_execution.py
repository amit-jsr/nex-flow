from main import app
from models import Base
from schemas import WorkflowCreate


def test_workflow_run_tables_are_registered() -> None:
    assert {"workflows", "runs", "run_events"} <= set(Base.metadata.tables)


def test_workflow_run_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/workflows/" in paths
    assert "/workflows/{workflow_id}/runs" in paths
    assert "/runs/" in paths
    assert "/runs/{run_id}/events" in paths
    assert "/ws/runs/{run_id}" in paths


def test_workflow_payload_defaults_validate() -> None:
    workflow = WorkflowCreate(name="Research Flow")
    assert workflow.nodes == []
    assert workflow.edges == []
