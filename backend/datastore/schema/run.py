"""Pydantic schemas for workflow run and run event payloads."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from datastore.schema.common import ReadSchema


RunStatus = Literal["pending", "running", "completed", "failed", "cancelled"]


class RunCreate(BaseModel):
    workflow_id: UUID | None = None
    status: RunStatus = "pending"
    input: str | None = None


class WorkflowRunCreate(BaseModel):
    input: str | None = None
    execute: bool = False


class RunUpdate(BaseModel):
    status: RunStatus | None = None
    output: str | None = None
    total_tokens: int | None = Field(default=None, ge=0)
    total_cost_usd: float | None = Field(default=None, ge=0)
    started_at: datetime | None = None
    ended_at: datetime | None = None


class RunRead(ReadSchema):
    id: UUID
    workflow_id: UUID | None
    status: str
    input: str | None
    output: str | None
    total_tokens: int
    total_cost_usd: float
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime


class RunEventCreate(BaseModel):
    agent_id: UUID | None = None
    event_type: str = Field(min_length=1, max_length=50)
    agent_name: str | None = Field(default=None, max_length=100)
    content: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    tokens_used: int = Field(default=0, ge=0)
    cost_usd: float = Field(default=0.0, ge=0)


class RunEventRead(RunEventCreate, ReadSchema):
    id: int
    run_id: UUID
    created_at: datetime

    @classmethod
    def model_validate(cls, obj: Any, **kwargs: Any) -> "RunEventRead":
        if hasattr(obj, "event_metadata"):
            values = {
                "id": obj.id,
                "run_id": obj.run_id,
                "agent_id": obj.agent_id,
                "event_type": obj.event_type,
                "agent_name": obj.agent_name,
                "content": obj.content,
                "metadata": obj.event_metadata,
                "tokens_used": obj.tokens_used,
                "cost_usd": obj.cost_usd,
                "created_at": obj.created_at,
            }
            return super().model_validate(values, **kwargs)
        return super().model_validate(obj, **kwargs)
