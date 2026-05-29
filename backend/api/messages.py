from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from datastore.model import Agent, Message, Run
from datastore.schema import MessageCreate, MessageRead


router = APIRouter()


@router.post("/", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(payload: MessageCreate, db: AsyncSession = Depends(get_db)) -> MessageRead:
    if payload.run_id is not None and await db.get(Run, payload.run_id) is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if payload.agent_id is not None and await db.get(Agent, payload.agent_id) is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    values = payload.model_dump()
    message = Message(message_metadata=values.pop("metadata"), **values)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return MessageRead.model_validate(message)


@router.get("/", response_model=list[MessageRead])
async def list_messages(
    run_id: UUID | None = None,
    agent_id: UUID | None = None,
    channel: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[MessageRead]:
    statement = select(Message).order_by(Message.created_at.desc()).limit(limit).offset(offset)
    if run_id is not None:
        statement = statement.where(Message.run_id == run_id)
    if agent_id is not None:
        statement = statement.where(Message.agent_id == agent_id)
    if channel is not None:
        statement = statement.where(Message.channel == channel)
    messages = list((await db.scalars(statement)).all())
    return [MessageRead.model_validate(message) for message in messages]


@router.get("/{message_id}", response_model=MessageRead)
async def get_message(message_id: int, db: AsyncSession = Depends(get_db)) -> MessageRead:
    message = await db.get(Message, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return MessageRead.model_validate(message)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id: int, db: AsyncSession = Depends(get_db)) -> Response:
    message = await db.get(Message, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    await db.delete(message)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
