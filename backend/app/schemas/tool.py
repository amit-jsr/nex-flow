from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ReadSchema


ToolStatus = Literal["available", "connected", "needs_setup", "disabled"]


class ToolCreate(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=100)
    source: str = Field(default="custom", max_length=50)
    category: str | None = Field(default=None, max_length=50)
    provider: str | None = Field(default=None, max_length=100)
    status: ToolStatus = "available"
    description: str | None = None
    configuration: dict[str, Any] = Field(default_factory=dict)


class ToolUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    source: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=50)
    provider: str | None = Field(default=None, max_length=100)
    status: ToolStatus | None = None
    description: str | None = None
    configuration: dict[str, Any] | None = None


class ToolRead(ToolCreate, ReadSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
