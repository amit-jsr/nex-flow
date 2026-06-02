"""Canonical Strands tool implementations and catalog used by the backend LLM layer."""

from __future__ import annotations

import asyncio
import ast
import json
import operator
from collections.abc import Callable, Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from configs.settings import settings
from datastore.model import Message


ToolCallable = Callable[..., Any]


def _strands_tool(func: ToolCallable) -> ToolCallable:
    try:
        from strands import tool
    except ImportError:
        return func
    return tool(func)


@_strands_tool
def calculator(expression: str) -> float:
    """Evaluate a basic arithmetic expression."""

    operators: dict[type[ast.operator], Callable[[float, float], float]] = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.Mod: operator.mod,
    }
    unary_operators: dict[type[ast.unaryop], Callable[[float], float]] = {
        ast.UAdd: operator.pos,
        ast.USub: operator.neg,
    }

    def evaluate(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return evaluate(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, int | float):
            return float(node.value)
        if isinstance(node, ast.BinOp) and type(node.op) in operators:
            return operators[type(node.op)](evaluate(node.left), evaluate(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in unary_operators:
            return unary_operators[type(node.op)](evaluate(node.operand))
        raise ValueError("Only basic arithmetic expressions are supported")

    return evaluate(ast.parse(expression, mode="eval"))


@_strands_tool
def current_time(timezone: str = "UTC") -> dict[str, str]:
    """Return a lightweight time payload for the requested timezone."""

    from datetime import datetime, timezone as dt_timezone

    now = datetime.now(dt_timezone.utc)
    return {"timezone": timezone, "iso": now.isoformat()}


@_strands_tool
def http_request(url: str, method: str = "GET") -> dict[str, str]:
    """Prepare an HTTP request for the configured network integration."""

    return {"method": method.upper(), "url": url}


@_strands_tool
def http_batch_request(urls: Sequence[str], method: str = "GET") -> list[dict[str, str]]:
    """Prepare a batch of HTTP requests for runtime-native workflows."""

    return [{"method": method.upper(), "url": url} for url in urls]


@_strands_tool
def text_extract(text: str, keyword: str, limit: int = 5) -> dict[str, Any]:
    """Extract matching lines from a text block for quick context review."""

    lines = [line for line in text.splitlines() if keyword.lower() in line.lower()]
    return {"keyword": keyword, "matches": lines[: max(limit, 1)], "count": len(lines)}


@_strands_tool
def json_parse(payload: str) -> dict[str, Any]:
    """Parse a JSON string into a structured object for downstream tools."""

    return json.loads(payload)


@_strands_tool
def memory_lookup(query: str, scope: str = "session") -> dict[str, str]:
    """Search persisted conversation memory for matching recent messages."""

    async def _lookup() -> dict[str, str]:
        engine = create_async_engine(settings.database_url, pool_pre_ping=True)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with session_factory() as session:
                statement = (
                    select(Message.content, Message.sender_id, Message.channel, Message.created_at)
                    .where(Message.content.ilike(f"%{query}%"))
                    .order_by(Message.created_at.desc())
                    .limit(5)
                )
                rows = (await session.execute(statement)).all()
                hits = [
                    {
                        "content": content,
                        "sender": sender_id or "unknown",
                        "channel": channel or scope,
                        "created_at": created_at.isoformat() if created_at else None,
                    }
                    for content, sender_id, channel, created_at in rows
                    if content
                ]
                summary = (
                    f"Found {len(hits)} matching memory items for '{query}'."
                    if hits
                    else f"No persisted memory entries matched '{query}'."
                )
                return {"query": query, "scope": scope, "summary": summary, "matches": hits}
        finally:
            await engine.dispose()

    return asyncio.run(_lookup())


@_strands_tool
def web_search(query: str) -> str:
    """Prepare a web search request for the configured search integration."""

    return f"Search requested: {query}"


TOOL_CATALOG: list[dict[str, str]] = [
    {
        "key": "calculator",
        "name": "Calculator",
        "source": "Built-in",
        "category": "Compute",
        "provider": "NxFlow",
        "status": "available",
        "description": "Deterministic arithmetic and unit calculations.",
    },
    {
        "key": "current_time",
        "name": "Current Time",
        "source": "Strands",
        "category": "Utility",
        "provider": "Runtime",
        "status": "available",
        "description": "Resolve current time, dates, and timezone-aware timestamps.",
    },
    {
        "key": "http_request",
        "name": "HTTP Request",
        "source": "Built-in",
        "category": "Actions",
        "provider": "NxFlow",
        "status": "available",
        "description": "Call REST APIs from agent workflows.",
    },
    {
        "key": "http_batch_request",
        "name": "HTTP Batch Request",
        "source": "Strands",
        "category": "Actions",
        "provider": "Runtime",
        "status": "available",
        "description": "Batch multiple HTTP calls from runtime-native workflows.",
    },
    {
        "key": "text_extract",
        "name": "Text Extract",
        "source": "Strands",
        "category": "Text",
        "provider": "Runtime",
        "status": "available",
        "description": "Find matching lines inside notes, logs, and message history.",
    },
    {
        "key": "json_parse",
        "name": "JSON Parse",
        "source": "Strands",
        "category": "Data",
        "provider": "Runtime",
        "status": "available",
        "description": "Parse structured JSON payloads for workflow use.",
    },
    {
        "key": "memory_lookup",
        "name": "Memory Lookup",
        "source": "Strands",
        "category": "Memory",
        "provider": "Runtime",
        "status": "available",
        "description": "Search recent conversation and workflow memory context.",
    },
    {
        "key": "web_search",
        "name": "Web Search",
        "source": "Integration",
        "category": "Search",
        "provider": "Search provider",
        "status": "connected",
        "description": "Find current web results and synthesize sources.",
    },
]


__all__ = [
    "ToolCallable",
    "TOOL_CATALOG",
    "calculator",
    "current_time",
    "http_batch_request",
    "http_request",
    "json_parse",
    "memory_lookup",
    "text_extract",
    "web_search",
]
