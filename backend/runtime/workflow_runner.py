"""Executes workflows, streams events, and persists run output."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datastore.model import Agent, Message, Run, RunEvent, Workflow
from runtime.agent_factory import AgentFactory
from runtime.event_bus import RunEventBus, run_event_bus


class WorkflowRunner:
    def __init__(
        self,
        db: AsyncSession,
        agent_factory: AgentFactory | None = None,
        event_bus: RunEventBus | None = None,
    ) -> None:
        self.db = db
        self.agent_factory = agent_factory or AgentFactory()
        self.event_bus = event_bus or run_event_bus

    async def run(self, run_id: UUID) -> Run:
        run = await self.db.get(Run, run_id)
        if run is None:
            raise ValueError("Run not found")
        if run.workflow_id is None:
            raise ValueError("Run is not attached to a workflow")

        workflow = await self.db.get(Workflow, run.workflow_id)
        if workflow is None:
            raise ValueError("Workflow not found")

        run.status = "running"
        run.started_at = utcnow()
        await self._add_event(run, "run_started", content=run.input)

        prompt = run.input or ""
        output = ""
        try:
            for node in ordered_agent_nodes(workflow.nodes, workflow.edges):
                agent_config = await self._agent_for_node(node)
                output = await self._run_agent_node(run, agent_config, prompt)
                prompt = output or prompt

            run.status = "completed"
            run.output = output
            run.ended_at = utcnow()
            await self._add_event(run, "run_completed", content=output)
        except Exception as exc:
            run.status = "failed"
            run.output = str(exc)
            run.ended_at = utcnow()
            await self._add_event(run, "run_failed", content=str(exc))
            raise
        finally:
            await self.db.commit()

        return run

    async def _agent_for_node(self, node: dict[str, Any]) -> Agent:
        agent_id = node.get("agent_id")
        if agent_id:
            agent = await self.db.get(Agent, agent_id)
            if agent is None:
                raise ValueError(f"Agent not found for workflow node {node.get('id')}")
            return agent

        agent_role = node.get("agent_role")
        if agent_role:
            statement = select(Agent).where(Agent.role == agent_role).limit(1)
            agent = await self.db.scalar(statement)
            if agent is not None:
                return agent

        raise ValueError(f"Workflow node {node.get('id')} is not linked to an agent")

    async def _run_agent_node(self, run: Run, agent_config: Agent, prompt: str) -> str:
        await self._add_event(
            run,
            "agent_started",
            agent=agent_config,
            content=prompt,
            metadata={"model": agent_config.model, "tools": agent_config.tools},
        )

        strands_agent = self.agent_factory.build(agent_config)
        chunks: list[str] = []
        async for payload in strands_agent.stream_async(prompt):
            event = stream_payload_to_event(payload)
            content = event["content"]
            if event["event_type"] == "text_delta" and content:
                chunks.append(content)
            await self._add_event(
                run,
                event["event_type"],
                agent=agent_config,
                content=content,
                metadata=event["metadata"],
                tokens_used=event["tokens_used"],
                cost_usd=event["cost_usd"],
            )

        output = "".join(chunks).strip()
        await self._add_message(run, agent_config, output)
        await self._add_event(run, "agent_completed", agent=agent_config, content=output)
        return output

    async def _add_event(
        self,
        run: Run,
        event_type: str,
        *,
        agent: Agent | None = None,
        content: str | None = None,
        metadata: dict[str, Any] | None = None,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
    ) -> None:
        run.total_tokens += tokens_used
        run.total_cost_usd += cost_usd
        event = RunEvent(
            run_id=run.id,
            agent_id=agent.id if agent else None,
            agent_name=agent.name if agent else None,
            event_type=event_type,
            content=content,
            event_metadata=metadata or {},
            tokens_used=tokens_used,
            cost_usd=cost_usd,
        )
        self.db.add(event)
        await self.db.flush()
        await self.event_bus.publish(str(run.id), run_event_to_payload(event))

    async def _add_message(self, run: Run, agent: Agent, content: str) -> None:
        self.db.add(
            Message(
                run_id=run.id,
                agent_id=agent.id,
                channel=agent.channel,
                direction="inter_agent",
                content=content,
                sender_id=str(agent.id),
                message_metadata={"agent_name": agent.name},
            )
        )
        await self.db.flush()


def stream_payload_to_event(payload: Any) -> dict[str, Any]:
    if isinstance(payload, str):
        return {
            "event_type": "text_delta",
            "content": payload,
            "metadata": {},
            "tokens_used": 0,
            "cost_usd": 0.0,
        }
    if not isinstance(payload, dict):
        return {
            "event_type": "runtime_event",
            "content": str(payload),
            "metadata": {"payload_type": type(payload).__name__},
            "tokens_used": 0,
            "cost_usd": 0.0,
        }

    raw_type = payload.get("event_type") or payload.get("type") or payload.get("event") or ""
    raw_type_str = str(raw_type).lower()

    # Detect tool-related events from Strands stream
    tool_name = (
        payload.get("tool_name")
        or payload.get("name")
        or (payload.get("tool_use", {}) or {}).get("name")
    )
    tool_input = payload.get("tool_input") or payload.get("input") or (payload.get("tool_use", {}) or {}).get("input")
    tool_result = payload.get("tool_result") or payload.get("result") or payload.get("output")

    is_tool_call = (
        "tool" in raw_type_str
        or tool_name is not None
        or "tool_use" in payload
        or raw_type_str in ("tool_use", "tool_call", "tool_start", "tool_result", "tool_end")
    )

    if is_tool_call:
        event_type = "tool_call"
        content = str(tool_result or tool_input or tool_name or "")
        metadata = {
            "tool_name": tool_name,
            "tool_input": tool_input,
            "tool_result": tool_result,
            "raw_type": raw_type,
        }
    else:
        # Text delta or generic runtime event
        content = payload.get("text") or payload.get("data") or payload.get("delta") or payload.get("content")
        event_type = raw_type_str if raw_type_str else "runtime_event"
        # Normalize common Strands text event names
        if event_type in ("text", "content_block_delta", "delta", "output"):
            event_type = "text_delta"
        metadata = {
            key: value
            for key, value in payload.items()
            if key not in {"text", "data", "delta", "content", "usage"}
        }

    usage = payload.get("usage") if isinstance(payload.get("usage"), dict) else {}
    # Also check for token counts in Strands model response format
    input_tokens = int(usage.get("input_tokens", 0) or 0)
    output_tokens = int(usage.get("output_tokens", 0) or 0)
    tokens_used = int(
        usage.get("tokens", 0)
        or (input_tokens + output_tokens)
        or payload.get("tokens_used", 0)
        or 0
    )
    cost_usd = float(usage.get("cost_usd", payload.get("cost_usd", 0.0)) or 0.0)

    return {
        "event_type": event_type,
        "content": None if content is None else str(content),
        "metadata": metadata,
        "tokens_used": tokens_used,
        "cost_usd": cost_usd,
    }


def ordered_agent_nodes(
    nodes: list[dict[str, Any]], edges: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    agent_nodes = [node for node in nodes if node.get("type") == "agent"]
    agent_node_by_id = {node["id"]: node for node in agent_nodes if isinstance(node.get("id"), str)}
    if not agent_node_by_id:
        return []

    ordered_ids = [node["id"] for node in agent_nodes if node.get("id") in agent_node_by_id]
    outgoing: dict[str, list[str]] = {node_id: [] for node_id in ordered_ids}
    incoming_count: dict[str, int] = {node_id: 0 for node_id in ordered_ids}

    for edge in edges:
        if edge.get("feedback_loop") is True:
            continue
        source = edge.get("source")
        target = edge.get("target")
        if source in agent_node_by_id and target in agent_node_by_id:
            outgoing[source].append(target)
            incoming_count[target] += 1

    ready = [node_id for node_id in ordered_ids if incoming_count[node_id] == 0]
    result: list[str] = []

    while ready:
        node_id = ready.pop(0)
        result.append(node_id)
        for target in outgoing[node_id]:
            incoming_count[target] -= 1
            if incoming_count[target] == 0:
                ready.append(target)

    if len(result) != len(ordered_ids):
        unresolved = [node_id for node_id in ordered_ids if node_id not in result]
        raise ValueError(f"Workflow graph contains a cycle: {', '.join(unresolved)}")

    return [agent_node_by_id[node_id] for node_id in result]


def utcnow() -> datetime:
    return datetime.now(UTC)


def run_event_to_payload(event: RunEvent) -> dict[str, Any]:
    return {
        "type": event.event_type,
        "run_id": str(event.run_id),
        "agent_id": str(event.agent_id) if event.agent_id else None,
        "agent_name": event.agent_name,
        "content": event.content,
        "metadata": event.event_metadata,
        "tokens_used": event.tokens_used,
        "cost_usd": event.cost_usd,
    }
