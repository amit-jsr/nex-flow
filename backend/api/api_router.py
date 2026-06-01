"""Central API router that composes all versioned backend route modules."""

from fastapi import APIRouter

from api import agents, messages, runs, telegram, tools, workflows, ws


api_router = APIRouter()
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(runs.router, prefix="/runs", tags=["runs"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
api_router.include_router(ws.router, tags=["websocket"])

__all__ = ["api_router"]
