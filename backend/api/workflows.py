from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from datastore.model import Run, Workflow
from datastore.schema import (
    RunRead,
    WorkflowCreate,
    WorkflowRead,
    WorkflowRunCreate,
    WorkflowTemplateRead,
    WorkflowUpdate,
)
from runtime.workflow_runner import WorkflowRunner
from templates import WORKFLOW_TEMPLATES, get_workflow_template


router = APIRouter()


async def get_workflow_or_404(workflow_id: UUID, db: AsyncSession) -> Workflow:
    workflow = await db.get(Workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("/", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    payload: WorkflowCreate, db: AsyncSession = Depends(get_db)
) -> Workflow:
    workflow = Workflow(**payload.model_dump())
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/", response_model=list[WorkflowRead])
async def list_workflows(
    is_template: bool | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[Workflow]:
    statement = select(Workflow).order_by(Workflow.created_at.desc()).limit(limit).offset(offset)
    if is_template is not None:
        statement = statement.where(Workflow.is_template == is_template)
    return list((await db.scalars(statement)).all())


@router.get("/templates", response_model=list[WorkflowTemplateRead])
async def list_workflow_templates() -> list[dict]:
    return WORKFLOW_TEMPLATES


@router.post(
    "/templates/{template_key}",
    response_model=WorkflowRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_workflow_from_template(
    template_key: str, db: AsyncSession = Depends(get_db)
) -> Workflow:
    template = get_workflow_template(template_key)
    if template is None:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    workflow = Workflow(
        name=template["name"],
        description=template["description"],
        nodes=template["nodes"],
        edges=template["edges"],
        is_template=True,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(workflow_id: UUID, db: AsyncSession = Depends(get_db)) -> Workflow:
    return await get_workflow_or_404(workflow_id, db)


@router.patch("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workflow_id: UUID, payload: WorkflowUpdate, db: AsyncSession = Depends(get_db)
) -> Workflow:
    workflow = await get_workflow_or_404(workflow_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(workflow, key, value)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: UUID, db: AsyncSession = Depends(get_db)) -> Response:
    workflow = await get_workflow_or_404(workflow_id, db)
    await db.delete(workflow)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{workflow_id}/runs", response_model=RunRead, status_code=status.HTTP_201_CREATED)
async def create_workflow_run(
    workflow_id: UUID,
    payload: WorkflowRunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Run:
    await get_workflow_or_404(workflow_id, db)
    run = Run(workflow_id=workflow_id, input=payload.input, status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)
    if payload.execute:
        background_tasks.add_task(_run_in_background, run.id)
    return run


async def _run_in_background(run_id: UUID) -> None:
    from datastore.database import get_session_factory
    async with get_session_factory()() as db:
        try:
            await WorkflowRunner(db).run(run_id)
        except Exception:
            pass
