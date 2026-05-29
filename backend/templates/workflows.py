from __future__ import annotations

from typing import Any


WORKFLOW_TEMPLATES: list[dict[str, Any]] = [
    {
        "key": "research-and-summarize",
        "name": "Research and Summarize",
        "description": "Researcher agent gathers source material; Summarizer agent produces the final response.",
        "nodes": [
            {
                "id": "researcher",
                "type": "agent",
                "label": "Researcher",
                "agent_role": "researcher",
                "tools": ["web_search"],
            },
            {
                "id": "summarizer",
                "type": "agent",
                "label": "Summarizer",
                "agent_role": "summarizer",
                "tools": [],
            },
        ],
        "edges": [
            {
                "id": "researcher-to-summarizer",
                "source": "researcher",
                "target": "summarizer",
                "condition": "research_complete",
            }
        ],
    },
    {
        "key": "answer-and-fact-check",
        "name": "Answer and Fact Check",
        "description": "Answerer drafts a response; Fact Checker verifies claims; Orchestrator returns the final answer.",
        "nodes": [
            {
                "id": "orchestrator",
                "type": "agent",
                "label": "Orchestrator",
                "agent_role": "orchestrator",
                "tools": [],
            },
            {
                "id": "answerer",
                "type": "agent",
                "label": "Answerer",
                "agent_role": "answerer",
                "tools": [],
            },
            {
                "id": "fact-checker",
                "type": "agent",
                "label": "Fact Checker",
                "agent_role": "fact_checker",
                "tools": ["web_search"],
            },
        ],
        "edges": [
            {
                "id": "orchestrator-to-answerer",
                "source": "orchestrator",
                "target": "answerer",
                "condition": "draft_required",
            },
            {
                "id": "answerer-to-fact-checker",
                "source": "answerer",
                "target": "fact-checker",
                "condition": "draft_ready",
            },
            {
                "id": "fact-checker-to-answerer",
                "source": "fact-checker",
                "target": "answerer",
                "condition": "needs_revision",
                "feedback_loop": True,
            },
            {
                "id": "fact-checker-to-orchestrator",
                "source": "fact-checker",
                "target": "orchestrator",
                "condition": "verified",
            },
        ],
    },
]


def get_workflow_template(key: str) -> dict[str, Any] | None:
    return next((template for template in WORKFLOW_TEMPLATES if template["key"] == key), None)
