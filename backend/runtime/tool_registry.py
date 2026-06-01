"""Resolves tool names into callable Strands tools for runtime execution."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from llm.tools import calculator, http_request, web_search


ToolCallable = Callable[..., Any]


class ToolRegistry:
    def __init__(self, tools: dict[str, ToolCallable] | None = None) -> None:
        self._tools = tools or {
            "calculator": calculator,
            "web_search": web_search,
            "http_request": http_request,
        }

    def get(self, key: str) -> ToolCallable:
        try:
            return self._tools[key]
        except KeyError as exc:
            raise ValueError(f"Unknown tool: {key}") from exc

    def resolve(self, tool_keys: list[str]) -> list[ToolCallable]:
        return [self.get(key) for key in tool_keys]

    def keys(self) -> list[str]:
        return sorted(self._tools)
