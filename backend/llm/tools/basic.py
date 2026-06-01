"""Core arithmetic tool implementation shared by the runtime and LLM layers."""

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
