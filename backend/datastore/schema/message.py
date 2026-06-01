"""Pydantic schemas for message create and read payloads."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from datastore.schema.common import ReadSchema


class MessageCreate(BaseModel):
    run_id: UUID | None = None
    agent_id: UUID | None = None
    channel: str | None = Field(default=None, max_length=50)
    direction: Literal["inbound", "outbound", "inter_agent"] | None = None
    content: str = Field(min_length=1)
    sender_id: str | None = Field(default=None, max_length=100)
    metadata: dict[str, Any] = Field(default_factory=dict)


class MessageRead(MessageCreate, ReadSchema):
    id: int
    created_at: datetime

    @classmethod
    def model_validate(cls, obj: Any, **kwargs: Any) -> "MessageRead":
        if hasattr(obj, "message_metadata"):
            values = {
                "id": obj.id,
                "run_id": obj.run_id,
                "agent_id": obj.agent_id,
                "channel": obj.channel,
                "direction": obj.direction,
                "content": obj.content,
                "sender_id": obj.sender_id,
                "metadata": obj.message_metadata,
                "created_at": obj.created_at,
            }
            return super().model_validate(values, **kwargs)
        return super().model_validate(obj, **kwargs)
