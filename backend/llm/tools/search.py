"""Web search tool implementation used by agent execution."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from llm.tools.basic import _strands_tool


@_strands_tool
def web_search(query: str) -> str:
    """Prepare a web search request for the configured search integration."""

    return f"Search requested: {query}"
