from __future__ import annotations

from typing import Any

from datastore.model import Agent
from runtime.tool_registry import ToolRegistry


class AgentFactory:
    def __init__(self, agent_class: type | None = None, tool_registry: ToolRegistry | None = None) -> None:
        self.agent_class = agent_class
        self.tool_registry = tool_registry or ToolRegistry()

    def build(self, agent_config: Agent) -> Any:
        agent_class = self.agent_class or self._load_strands_agent()
        return agent_class(
            system_prompt=self._system_prompt(agent_config),
            model=agent_config.model,
            tools=self.tool_registry.resolve(agent_config.tools),
            callback_handler=None,
        )

    def _load_strands_agent(self) -> type:
        try:
            from strands import Agent as StrandsAgent
        except ImportError as exc:
            raise RuntimeError(
                "Strands Agents is not installed. Install backend requirements before running agents."
            ) from exc
        return StrandsAgent

    def _system_prompt(self, agent_config: Agent) -> str:
        parts = [agent_config.system_prompt]
        if agent_config.role:
            parts.append(f"Role: {agent_config.role}")
        if agent_config.skills:
            parts.append("Skills: " + ", ".join(agent_config.skills))
        if agent_config.interaction_rules:
            parts.append(f"Interaction rules: {agent_config.interaction_rules}")
        if agent_config.guardrails:
            parts.append(f"Guardrails: {agent_config.guardrails}")
        return "\n\n".join(parts)
