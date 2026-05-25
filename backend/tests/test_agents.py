from app.main import app
from app.models import Base
from app.schemas import AgentCreate


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


def test_grok_model_names_validate() -> None:
    agent = AgentCreate(
        name="Grok researcher",
        system_prompt="Reason carefully.",
        model="grok-4.3",
    )
    assert agent.model == "grok-4.3"
