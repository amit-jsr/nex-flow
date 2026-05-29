from __future__ import annotations

import ast
import operator
from collections.abc import Callable
from typing import Any


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
def web_search(query: str) -> str:
    """Prepare a web search request for the configured search integration."""

    return f"Search requested: {query}"


@_strands_tool
def http_request(url: str, method: str = "GET") -> dict[str, str]:
    """Prepare an HTTP request for the configured network integration."""

    return {"method": method.upper(), "url": url}


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
