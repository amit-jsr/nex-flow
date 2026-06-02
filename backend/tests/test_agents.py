"""Tests for agent API behavior and agent schema validation."""

from main import app
from datastore.model import Base
from datastore.schema import AgentCreate


def test_agent_related_tables_are_registered() -> None:
    assert {"agents", "tools", "messages"} <= set(Base.metadata.tables)


def test_agent_config_columns_are_registered() -> None:
    agent_columns = set(Base.metadata.tables["agents"].columns.keys())
    assert {
        "schedule",
        "memory_config",
        "skills",
        "interaction_rules",
        "guardrails",
        "limits",
    } <= agent_columns


def test_agent_and_tool_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/agents/" in paths
    assert "/tools/" in paths
    assert "/messages/" in paths


def test_agent_defaults_validate() -> None:
    agent = AgentCreate(name="Researcher", system_prompt="Research carefully.")
    assert agent.provider == "groq"
    assert agent.model == "openai/gpt-oss-20b"
    assert agent.memory_enabled is True
    assert agent.schedule == {}
    assert agent.memory_config == {}
    assert agent.skills == []
    assert agent.interaction_rules == {}
    assert agent.limits.max_tool_calls == 25
    assert agent.limits.timeout_seconds == 300
    assert agent.limits.max_tokens == agent.max_tokens
    assert agent.limits.temperature == agent.temperature


def test_grok_model_names_validate() -> None:
    agent = AgentCreate(
        name="Grok researcher",
        system_prompt="Reason carefully.",
        model="openai/gpt-oss-20b",
    )
    assert agent.model == "openai/gpt-oss-20b"
