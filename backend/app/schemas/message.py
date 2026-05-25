from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ReadSchema


class MessageCreate(BaseModel):
    agent_id: UUID | None = None
    channel: str | None = Field(default=None, max_length=50)
    direction: Literal["inbound", "outbound"] | None = None
    content: str = Field(min_length=1)
    sender_id: str | None = Field(default=None, max_length=100)


class MessageRead(MessageCreate, ReadSchema):
    id: int
    created_at: datetime
