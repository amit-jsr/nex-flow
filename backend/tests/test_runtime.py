"""Tests for the runtime tool registry, agent factory, and event bus."""

import pytest

from datastore.model import Agent
from runtime.event_bus import RunEventBus
from runtime.agent_factory import AgentFactory
from runtime.tool_registry import ToolRegistry, calculator
from runtime.workflow_runner import ordered_agent_nodes, stream_payload_to_event


class FakeStrandsAgent:
    def __init__(self, **kwargs):
        self.kwargs = kwargs


def test_tool_registry_resolves_configured_tools() -> None:
    registry = ToolRegistry()
    assert calculator("2 + 3 * 4") == 14
    assert len(registry.resolve(["calculator", "web_search"])) == 2


def test_tool_registry_rejects_unknown_tools() -> None:
    with pytest.raises(ValueError, match="Unknown tool"):
        ToolRegistry().resolve(["does_not_exist"])


def test_agent_factory_builds_strands_agent_from_config() -> None:
    agent_config = Agent(
        name="Researcher",
        role="researcher",
        system_prompt="Research carefully.",
        model="gpt-4o",
        tools=["calculator"],
        skills=["source review"],
        interaction_rules={"tone": "concise"},
        guardrails={"no_secrets": True},
    )

    agent = AgentFactory(agent_class=FakeStrandsAgent).build(agent_config)

    assert agent.kwargs["model"] == "gpt-4o"
    assert len(agent.kwargs["tools"]) == 1
    assert "Role: researcher" in agent.kwargs["system_prompt"]
    assert "source review" in agent.kwargs["system_prompt"]
    assert agent.kwargs["callback_handler"] is None


def test_stream_payload_to_event_normalizes_text_and_usage() -> None:
    event = stream_payload_to_event(
        {
            "type": "text_delta",
            "data": "hello",
            "usage": {"tokens": 7, "cost_usd": 0.001},
        }
    )

    assert event == {
        "event_type": "text_delta",
        "content": "hello",
        "metadata": {"type": "text_delta"},
        "tokens_used": 7,
        "cost_usd": 0.001,
    }


@pytest.mark.asyncio
async def test_run_event_bus_publishes_to_subscribers() -> None:
    bus = RunEventBus()
    queue = bus.subscribe("run-1")

    await bus.publish("run-1", {"type": "agent_started"})

    assert await queue.get() == {"type": "agent_started"}
    bus.unsubscribe("run-1", queue)


def test_ordered_agent_nodes_uses_graph_edges() -> None:
    nodes = [
        {"id": "summarizer", "type": "agent"},
        {"id": "researcher", "type": "agent"},
        {"id": "note", "type": "annotation"},
    ]
    edges = [{"source": "researcher", "target": "summarizer"}]

    ordered = ordered_agent_nodes(nodes, edges)

    assert [node["id"] for node in ordered] == ["researcher", "summarizer"]


def test_ordered_agent_nodes_ignores_feedback_edges_for_initial_pass() -> None:
    nodes = [
        {"id": "answerer", "type": "agent"},
        {"id": "fact-checker", "type": "agent"},
    ]
    edges = [
        {"source": "answerer", "target": "fact-checker"},
        {"source": "fact-checker", "target": "answerer", "feedback_loop": True},
    ]

    ordered = ordered_agent_nodes(nodes, edges)

    assert [node["id"] for node in ordered] == ["answerer", "fact-checker"]


def test_ordered_agent_nodes_rejects_non_feedback_cycles() -> None:
    nodes = [
        {"id": "a", "type": "agent"},
        {"id": "b", "type": "agent"},
    ]
    edges = [
        {"source": "a", "target": "b"},
        {"source": "b", "target": "a"},
    ]

    with pytest.raises(ValueError, match="cycle"):
        ordered_agent_nodes(nodes, edges)


def test_stream_payload_detects_tool_call_by_tool_name() -> None:
    from runtime.workflow_runner import stream_payload_to_event

    payload = {
        "type": "tool_use",
        "name": "web_search",
        "input": {"query": "latest AI news"},
    }
    event = stream_payload_to_event(payload)
    assert event["event_type"] == "tool_call"
    assert event["metadata"]["tool_name"] == "web_search"
    assert event["metadata"]["tool_input"] == {"query": "latest AI news"}


def test_stream_payload_detects_tool_call_by_tool_use_key() -> None:
    from runtime.workflow_runner import stream_payload_to_event

    payload = {
        "tool_use": {"name": "calculator", "input": "2+2"},
    }
    event = stream_payload_to_event(payload)
    assert event["event_type"] == "tool_call"
    assert event["metadata"]["tool_name"] == "calculator"


def test_stream_payload_parses_token_usage() -> None:
    from runtime.workflow_runner import stream_payload_to_event

    payload = {
        "type": "message_delta",
        "text": "final answer",
        "usage": {"input_tokens": 100, "output_tokens": 50},
    }
    event = stream_payload_to_event(payload)
    assert event["tokens_used"] == 150


def test_stream_payload_string_is_text_delta() -> None:
    from runtime.workflow_runner import stream_payload_to_event

    event = stream_payload_to_event("hello world")
    assert event["event_type"] == "text_delta"
    assert event["content"] == "hello world"
