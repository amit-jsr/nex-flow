"""HTTP request tool implementation used by agent execution."""

from __future__ import annotations

from llm.tools.basic import _strands_tool


@_strands_tool
def http_request(url: str, method: str = "GET") -> dict[str, str]:
    """Prepare an HTTP request for the configured network integration."""

    return {"method": method.upper(), "url": url}
