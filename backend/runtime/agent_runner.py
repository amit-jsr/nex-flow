"""Executes a single agent as a first-class run."""

from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from datastore.model import Agent, Run
from runtime.agent_factory import AgentFactory
from runtime.event_bus import RunEventBus
from runtime.workflow_runner import WorkflowRunner, utcnow


class AgentRunner(WorkflowRunner):
    def __init__(
        self,
        db: AsyncSession,
        agent_factory: AgentFactory | None = None,
        event_bus: RunEventBus | None = None,
    ) -> None:
        super().__init__(db=db, agent_factory=agent_factory, event_bus=event_bus)

    async def run(self, run_id: UUID) -> Run:
        run = await self.db.get(Run, run_id)
        if run is None:
            raise ValueError("Run not found")
        if run.status == "cancelled":
            return run
        if run.agent_id is None:
            raise ValueError("Run is not attached to an agent")

        agent = await self.db.get(Agent, run.agent_id)
        if agent is None:
            raise ValueError("Agent not found")

        run.status = "running"
        run.started_at = utcnow()
        await self._add_event(run, "run_started", agent=agent, content=run.input)

        try:
            output = await self._run_agent_node(run, agent, run.input or "")
            run.status = "completed"
            run.output = output
            run.ended_at = utcnow()
            await self._add_event(run, "run_completed", agent=agent, content=output)
        except asyncio.CancelledError:
            run.status = "cancelled"
            run.output = run.output or "Run cancelled"
            run.ended_at = utcnow()
            raise
        except Exception as exc:
            run.status = "failed"
            run.output = str(exc)
            run.ended_at = utcnow()
            await self._add_event(run, "run_failed", agent=agent, content=str(exc))
            raise
        finally:
            await self.db.commit()

        return run
