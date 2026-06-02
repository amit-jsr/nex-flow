"""Async SQLAlchemy engine, session, and table bootstrap helpers."""

from collections.abc import AsyncIterator

from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine

from configs.settings import settings
from datastore.model import Base
from datastore.model import Tool
from llm.tools import TOOL_CATALOG


engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global engine
    if engine is None:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.database_echo,
            pool_pre_ping=True,
        )
    return engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = async_sessionmaker(get_engine(), expire_on_commit=False)
    return SessionLocal


async def get_db() -> AsyncIterator[AsyncSession]:
    async with get_session_factory()() as session:
        yield session


async def create_tables() -> None:
    async with get_engine().begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await add_missing_run_columns(connection)


async def add_missing_run_columns(connection) -> None:
    def runs_columns(sync_connection) -> set[str]:
        return {column["name"] for column in inspect(sync_connection).get_columns("runs")}

    if "agent_id" in await connection.run_sync(runs_columns):
        return

    if connection.dialect.name == "postgresql":
        await connection.execute(
            text(
                "ALTER TABLE runs ADD COLUMN agent_id UUID "
                "REFERENCES agents(id) ON DELETE SET NULL"
            )
        )
    else:
        await connection.execute(text("ALTER TABLE runs ADD COLUMN agent_id CHAR(32)"))


async def seed_tool_catalog() -> None:
    async with get_session_factory()() as session:
        existing_keys = set((await session.scalars(select(Tool.key))).all())
        missing_tools = [
            Tool(
                key=tool["key"],
                name=tool["name"],
                source=tool["source"],
                category=tool["category"],
                provider=tool["provider"],
                status=tool["status"],
                description=tool["description"],
            )
            for tool in TOOL_CATALOG
            if tool["key"] not in existing_keys
        ]
        if missing_tools:
            session.add_all(missing_tools)
            await session.commit()
