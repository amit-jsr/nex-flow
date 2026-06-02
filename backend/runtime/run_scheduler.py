"""Schedules workflow runs and resumes queued work after API restarts."""

from __future__ import annotations

import asyncio
import logging
from uuid import UUID

from sqlalchemy import select

from datastore.model import Run, RunEvent
from runtime.agent_runner import AgentRunner
from runtime.workflow_runner import WorkflowRunner, utcnow


logger = logging.getLogger(__name__)
MAX_CONCURRENT_RUNS = 10
_scheduled_run_ids: set[UUID] = set()
_scheduled_tasks: dict[UUID, asyncio.Task[None]] = {}


def schedule_run(run_id: UUID) -> asyncio.Task[None] | None:
    """Start a run immediately when capacity is available.

    If all runtime slots are busy, the run stays persisted as run_queued and
    will be picked up by drain_queued_runs when a running task finishes.
    """
    if run_id in _scheduled_run_ids:
        return None
    if len(_scheduled_run_ids) >= MAX_CONCURRENT_RUNS:
        logger.info("Run %s left queued because runtime capacity is full", run_id)
        return None
    return _start_run_task(run_id)


async def drain_queued_runs() -> list[UUID]:
    """Start as many queued runs as current capacity allows."""
    available_slots = MAX_CONCURRENT_RUNS - len(_scheduled_run_ids)
    if available_slots <= 0:
        return []

    from datastore.database import get_session_factory

    async with get_session_factory()() as db:
        queued_event_exists = (
            select(RunEvent.id)
            .where(RunEvent.run_id == Run.id, RunEvent.event_type == "run_queued")
            .exists()
        )
        statement = (
            select(Run.id)
            .where(Run.status.in_(("init", "pending")), queued_event_exists)
            .order_by(Run.created_at)
            .limit(available_slots)
        )
        if _scheduled_run_ids:
            statement = statement.where(Run.id.notin_(list(_scheduled_run_ids)))
        run_ids = list((await db.scalars(statement)).all())

    started_run_ids: list[UUID] = []
    for run_id in run_ids:
        if schedule_run(run_id) is not None:
            started_run_ids.append(run_id)
    return started_run_ids


def _start_run_task(run_id: UUID) -> asyncio.Task[None]:
    _scheduled_run_ids.add(run_id)
    task = asyncio.create_task(execute_run_background(run_id))
    _scheduled_tasks[run_id] = task
    task.add_done_callback(lambda done_task: _finish_scheduled_run(run_id, done_task))
    return task


def cancel_scheduled_run(run_id: UUID) -> bool:
    """Cancel an in-memory run task when it is currently executing."""
    task = _scheduled_tasks.get(run_id)
    if task is None or task.done():
        _scheduled_run_ids.discard(run_id)
        _scheduled_tasks.pop(run_id, None)
        return False
    task.cancel()
    return True


async def execute_run_background(run_id: UUID) -> None:
    """Execute a run with its own database session and persist early failures."""
    from datastore.database import get_session_factory

    try:
        async with get_session_factory()() as db:
            try:
                run = await db.get(Run, run_id)
                if run is None:
                    raise ValueError("Run not found")
                if run.agent_id is not None:
                    await AgentRunner(db).run(run_id)
                else:
                    await WorkflowRunner(db).run(run_id)
            except Exception as exc:
                await db.rollback()
                await _persist_failed_run(db, run_id, exc)
    except Exception:
        logger.exception("Run %s crashed before a failure event could be persisted", run_id)


async def resume_queued_runs(limit: int = 100) -> list[UUID]:
    """Resume initialized runs that were queued before a server reload or crash."""
    started_run_ids = await drain_queued_runs()
    if started_run_ids:
        logger.info("Resumed %d queued workflow run(s)", len(started_run_ids))
    return started_run_ids[:limit]


async def _persist_failed_run(db, run_id: UUID, exc: Exception) -> None:
    run = await db.get(Run, run_id)
    if run is None or run.status == "failed":
        return
    run.status = "failed"
    run.output = str(exc)
    run.ended_at = utcnow()
    db.add(
        RunEvent(
            run_id=run_id,
            event_type="run_failed",
            content=str(exc),
            event_metadata={"source": "run_scheduler"},
        )
    )
    await db.commit()


def _finish_scheduled_run(run_id: UUID, task: asyncio.Task[None]) -> None:
    _scheduled_run_ids.discard(run_id)
    _scheduled_tasks.pop(run_id, None)
    try:
        asyncio.create_task(drain_queued_runs())
    except RuntimeError:
        logger.debug("No running event loop available to drain queued runs")
    try:
        task.result()
    except asyncio.CancelledError:
        logger.info("Run %s task was cancelled", run_id)
    except Exception:
        logger.exception("Run %s task failed unexpectedly", run_id)
