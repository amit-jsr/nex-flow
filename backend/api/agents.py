from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from datastore.model import Agent
from datastore.schema import AgentCreate, AgentRead, AgentUpdate


router = APIRouter()


async def get_agent_or_404(agent_id: UUID, db: AsyncSession) -> Agent:
    agent = await db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)) -> Agent:
    agent = Agent(**payload.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/", response_model=list[AgentRead])
async def list_agents(
    role: str | None = None,
    channel: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[Agent]:
    statement = select(Agent).order_by(Agent.created_at.desc()).limit(limit).offset(offset)
    if role is not None:
        statement = statement.where(Agent.role == role)
    if channel is not None:
        statement = statement.where(Agent.channel == channel)
    return list((await db.scalars(statement)).all())


@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)) -> Agent:
    return await get_agent_or_404(agent_id, db)


@router.patch("/{agent_id}", response_model=AgentRead)
async def update_agent(
    agent_id: UUID, payload: AgentUpdate, db: AsyncSession = Depends(get_db)
) -> Agent:
    agent = await get_agent_or_404(agent_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, key, value)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)) -> Response:
    agent = await get_agent_or_404(agent_id, db)
    await db.delete(agent)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
