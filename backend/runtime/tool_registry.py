"""Resolves tool names into callable Strands tools for runtime execution."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from llm.tools import (
    TOOL_CATALOG,
    calculator,
    current_time,
    http_batch_request,
    http_request,
    json_parse,
    memory_lookup,
    text_extract,
    web_search,
)


ToolCallable = Callable[..., Any]


class ToolRegistry:
    def __init__(self, tools: dict[str, ToolCallable] | None = None) -> None:
        tool_map = {
            "calculator": calculator,
            "current_time": current_time,
            "http_batch_request": http_batch_request,
            "json_parse": json_parse,
            "web_search": web_search,
            "http_request": http_request,
            "memory_lookup": memory_lookup,
            "text_extract": text_extract,
        }
        self._tools = tools or {tool["key"]: tool_map[tool["key"]] for tool in TOOL_CATALOG}

    def get(self, key: str) -> ToolCallable:
        try:
            return self._tools[key]
        except KeyError as exc:
            raise ValueError(f"Unknown tool: {key}") from exc

    def resolve(self, tool_keys: list[str]) -> list[ToolCallable]:
        return [self.get(key) for key in tool_keys]

    def keys(self) -> list[str]:
        return sorted(self._tools)
