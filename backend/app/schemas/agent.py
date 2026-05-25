from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ReadSchema


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: str | None = Field(default=None, max_length=200)
    system_prompt: str = Field(min_length=1)
    model: str = Field(default="gpt-4o", max_length=50)
    tools: list[str] = Field(default_factory=list)
    memory_enabled: bool = True
    max_tokens: int = Field(default=2000, ge=1)
    temperature: float = Field(default=0.7, ge=0, le=2)
    channel: str | None = Field(default=None, max_length=50)
    guardrails: dict[str, Any] = Field(default_factory=dict)


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: str | None = Field(default=None, max_length=200)
    system_prompt: str | None = Field(default=None, min_length=1)
    model: str | None = Field(default=None, max_length=50)
    tools: list[str] | None = None
    memory_enabled: bool | None = None
    max_tokens: int | None = Field(default=None, ge=1)
    temperature: float | None = Field(default=None, ge=0, le=2)
    channel: str | None = Field(default=None, max_length=50)
    guardrails: dict[str, Any] | None = None


class AgentRead(AgentCreate, ReadSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
