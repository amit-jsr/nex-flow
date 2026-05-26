from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from models import Run, RunEvent, Workflow
from schemas import RunCreate, RunEventCreate, RunEventRead, RunRead, RunUpdate


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
    run = Run(**payload.model_dump())
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


@router.get("/", response_model=list[RunRead])
async def list_runs(
    workflow_id: UUID | None = None,
    run_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[Run]:
    statement = select(Run).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    if workflow_id is not None:
        statement = statement.where(Run.workflow_id == workflow_id)
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


@router.post("/{run_id}/events", response_model=RunEventRead, status_code=status.HTTP_201_CREATED)
async def create_run_event(
    run_id: UUID, payload: RunEventCreate, db: AsyncSession = Depends(get_db)
) -> RunEventRead:
    await get_run_or_404(run_id, db)
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
