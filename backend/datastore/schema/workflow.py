"""Pydantic schemas for workflow create, update, read, and template payloads."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from datastore.schema.common import ReadSchema


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    is_template: bool = False

    @model_validator(mode="after")
    def validate_graph_shape(self) -> "WorkflowCreate":
        validate_workflow_graph(self.nodes, self.edges)
        return self


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    nodes: list[dict[str, Any]] | None = None
    edges: list[dict[str, Any]] | None = None
    is_template: bool | None = None

    @model_validator(mode="after")
    def validate_graph_shape(self) -> "WorkflowUpdate":
        if self.nodes is not None or self.edges is not None:
            validate_workflow_graph(self.nodes or [], self.edges or [])
        return self


class WorkflowRead(WorkflowCreate, ReadSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class WorkflowTemplateRead(BaseModel):
    key: str
    name: str
    description: str
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


def validate_workflow_graph(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> None:
    node_ids: set[str] = set()
    for index, node in enumerate(nodes):
        node_id = node.get("id")
        if not isinstance(node_id, str) or not node_id:
            raise ValueError(f"Workflow node at index {index} must include a non-empty id")
        if node_id in node_ids:
            raise ValueError(f"Workflow node at index {index} has duplicate id {node_id}")
        node_ids.add(node_id)

    for index, edge in enumerate(edges):
        source = edge.get("source")
        target = edge.get("target")
        if not isinstance(source, str) or not source:
            raise ValueError(f"Workflow edge at index {index} must include a non-empty source")
        if not isinstance(target, str) or not target:
            raise ValueError(f"Workflow edge at index {index} must include a non-empty target")
        if node_ids and (source not in node_ids or target not in node_ids):
            raise ValueError(f"Workflow edge at index {index} references an unknown node")
