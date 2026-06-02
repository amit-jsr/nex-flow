"""Pydantic schemas for agent create, update, and read payloads."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from datastore.schema.common import ReadSchema


class AgentLimits(BaseModel):
    max_tool_calls: int = Field(default=25, ge=1)
    timeout_seconds: int = Field(default=300, ge=1)
    max_tokens: int = Field(default=2000, ge=1)
    temperature: float = Field(default=0.7, ge=0, le=2)


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: str | None = Field(default=None, max_length=200)
    system_prompt: str = Field(min_length=1)
    provider: str = Field(default="groq", max_length=50)
    model: str = Field(default="openai/gpt-oss-20b", max_length=100)
    tools: list[str] = Field(default_factory=list)
    schedule: dict[str, Any] = Field(default_factory=dict)
    memory_enabled: bool = True
    memory_config: dict[str, Any] = Field(default_factory=dict)
    skills: list[str] = Field(default_factory=list)
    interaction_rules: dict[str, Any] = Field(default_factory=dict)
    max_tokens: int = Field(default=2000, ge=1)
    temperature: float = Field(default=0.7, ge=0, le=2)
    channel: str | None = Field(default=None, max_length=50)
    guardrails: dict[str, Any] = Field(default_factory=dict)
    limits: AgentLimits = Field(default_factory=AgentLimits)

    @model_validator(mode="after")
    def sync_limits_with_legacy_fields(self) -> "AgentCreate":
        self.limits.max_tokens = self.max_tokens
        self.limits.temperature = self.temperature
        return self


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: str | None = Field(default=None, max_length=200)
    system_prompt: str | None = Field(default=None, min_length=1)
    provider: str | None = Field(default=None, max_length=50)
    model: str | None = Field(default=None, max_length=100)
    tools: list[str] | None = None
    schedule: dict[str, Any] | None = None
    memory_enabled: bool | None = None
    memory_config: dict[str, Any] | None = None
    skills: list[str] | None = None
    interaction_rules: dict[str, Any] | None = None
    max_tokens: int | None = Field(default=None, ge=1)
    temperature: float | None = Field(default=None, ge=0, le=2)
    channel: str | None = Field(default=None, max_length=50)
    guardrails: dict[str, Any] | None = None
    limits: AgentLimits | None = None


class AgentRead(AgentCreate, ReadSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
