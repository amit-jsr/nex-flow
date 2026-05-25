from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Tool
from app.schemas import ToolCreate, ToolRead, ToolUpdate


router = APIRouter()


async def get_tool_or_404(tool_id: UUID, db: AsyncSession) -> Tool:
    tool = await db.get(Tool, tool_id)
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


async def commit_tool(db: AsyncSession, tool: Tool) -> Tool:
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Tool key already exists") from exc
    await db.refresh(tool)
    return tool


@router.post("/", response_model=ToolRead, status_code=status.HTTP_201_CREATED)
async def create_tool(payload: ToolCreate, db: AsyncSession = Depends(get_db)) -> Tool:
    tool = Tool(**payload.model_dump())
    db.add(tool)
    return await commit_tool(db, tool)


@router.get("/", response_model=list[ToolRead])
async def list_tools(
    source: str | None = None,
    tool_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[Tool]:
    statement = select(Tool).order_by(Tool.name).limit(limit).offset(offset)
    if source is not None:
        statement = statement.where(Tool.source == source)
    if tool_status is not None:
        statement = statement.where(Tool.status == tool_status)
    return list((await db.scalars(statement)).all())


@router.get("/{tool_id}", response_model=ToolRead)
async def get_tool(tool_id: UUID, db: AsyncSession = Depends(get_db)) -> Tool:
    return await get_tool_or_404(tool_id, db)


@router.patch("/{tool_id}", response_model=ToolRead)
async def update_tool(
    tool_id: UUID, payload: ToolUpdate, db: AsyncSession = Depends(get_db)
) -> Tool:
    tool = await get_tool_or_404(tool_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tool, key, value)
    return await commit_tool(db, tool)


@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(tool_id: UUID, db: AsyncSession = Depends(get_db)) -> Response:
    tool = await get_tool_or_404(tool_id, db)
    await db.delete(tool)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
