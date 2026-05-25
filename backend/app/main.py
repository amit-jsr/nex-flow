from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import models  # noqa: F401
from app.config import settings
from app.database import create_tables, get_db
from app.routers import agents, messages, runs, telegram, tools, workflows, ws


@asynccontextmanager
async def lifespan(_: FastAPI):
    await create_tables()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(tools.router, prefix="/tools", tags=["tools"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])
app.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
app.include_router(ws.router, tags=["websocket"])


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
