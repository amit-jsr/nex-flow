"""Shared Pydantic base classes for read and update schemas."""

from pydantic import BaseModel, ConfigDict


class ReadSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
