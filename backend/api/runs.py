"""FastAPI routes for workflow runs, execution, and run event persistence."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from datastore.model import Agent, Run, RunEvent, Workflow
from datastore.schema import RunCreate, RunEventCreate, RunEventRead, RunRead, RunUpdate
from runtime.event_bus import run_event_bus
from runtime.run_scheduler import cancel_scheduled_run, schedule_run
from runtime.workflow_runner import run_event_to_payload, utcnow


router = APIRouter()


async def get_run_or_404(run_id: UUID, db: AsyncSession) -> Run:
    run = await db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/", response_model=RunRead, status_code=status.HTTP_201_CREATED)
async def create_run(payload: RunCreate, db: AsyncSession = Depends(get_db)) -> Run:
    if payload.workflow_id is not None and await db.get(Workflow, payload.workflow_id) is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if payload.agent_id is not None and await db.get(Agent, payload.agent_id) is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    run = Run(**payload.model_dump())
    db.add(run)
    await db.flush()
    db.add(
        RunEvent(
            run_id=run.id,
            event_type="run_created",
            content=payload.input,
            event_metadata={
                "workflow_id": str(payload.workflow_id) if payload.workflow_id else None,
                "agent_id": str(payload.agent_id) if payload.agent_id else None,
            },
        )
    )
    await db.commit()
    await db.refresh(run)
    return run


@router.get("/", response_model=list[RunRead])
async def list_runs(
    workflow_id: UUID | None = None,
    agent_id: UUID | None = None,
    run_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[Run]:
    statement = select(Run).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    if workflow_id is not None:
        statement = statement.where(Run.workflow_id == workflow_id)
    if agent_id is not None:
        statement = statement.where(Run.agent_id == agent_id)
    if run_status is not None:
        statement = statement.where(Run.status == run_status)
    return list((await db.scalars(statement)).all())


@router.get("/{run_id}", response_model=RunRead)
async def get_run(run_id: UUID, db: AsyncSession = Depends(get_db)) -> Run:
    return await get_run_or_404(run_id, db)


@router.patch("/{run_id}", response_model=RunRead)
async def update_run(run_id: UUID, payload: RunUpdate, db: AsyncSession = Depends(get_db)) -> Run:
    run = await get_run_or_404(run_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(run, key, value)
    await db.commit()
    await db.refresh(run)
    return run


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_run(run_id: UUID, db: AsyncSession = Depends(get_db)) -> Response:
    run = await get_run_or_404(run_id, db)
    await db.delete(run)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{run_id}/execute", response_model=RunRead)
async def execute_run(
    run_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Run:
    run = await get_run_or_404(run_id, db)
    if run.status not in ("init", "failed"):
        raise HTTPException(status_code=400, detail=f"Run is already {run.status}")
    db.add(
        RunEvent(
            run_id=run.id,
            event_type="run_queued",
            content=run.input,
            event_metadata={"source": "execute_endpoint"},
        )
    )
    await db.commit()
    await db.refresh(run)
    schedule_run(run_id)
    return run


@router.post("/{run_id}/cancel", response_model=RunRead)
async def cancel_run(run_id: UUID, db: AsyncSession = Depends(get_db)) -> Run:
    run = await get_run_or_404(run_id, db)
    if run.status not in ("init", "pending", "running"):
        raise HTTPException(status_code=400, detail=f"Run is already {run.status}")

    task_was_cancelled = cancel_scheduled_run(run_id)
    run.status = "cancelled"
    run.output = run.output or "Run cancelled by user"
    run.ended_at = utcnow()
    event = RunEvent(
        run_id=run.id,
        event_type="run_cancelled",
        content=run.output,
        event_metadata={"task_cancelled": task_was_cancelled},
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    await db.refresh(run)
    await run_event_bus.publish(str(run.id), run_event_to_payload(event))
    return run


@router.post("/{run_id}/events", response_model=RunEventRead, status_code=status.HTTP_201_CREATED)
async def create_run_event(
    run_id: UUID, payload: RunEventCreate, db: AsyncSession = Depends(get_db)
) -> RunEventRead:
    await get_run_or_404(run_id, db)
    if payload.agent_id is not None and await db.get(Agent, payload.agent_id) is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    values = payload.model_dump()
    event = RunEvent(run_id=run_id, event_metadata=values.pop("metadata"), **values)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return RunEventRead.model_validate(event)


@router.get("/{run_id}/events", response_model=list[RunEventRead])
async def list_run_events(
    run_id: UUID,
    limit: int = Query(default=500, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
) -> list[RunEventRead]:
    await get_run_or_404(run_id, db)
    statement = (
        select(RunEvent)
        .where(RunEvent.run_id == run_id)
        .order_by(RunEvent.created_at, RunEvent.id)
        .limit(limit)
    )
    events = list((await db.scalars(statement)).all())
    return [RunEventRead.model_validate(event) for event in events]
