from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from schemas.common import ReadSchema


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    is_template: bool = False


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    nodes: list[dict[str, Any]] | None = None
    edges: list[dict[str, Any]] | None = None
    is_template: bool | None = None


class WorkflowRead(WorkflowCreate, ReadSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
