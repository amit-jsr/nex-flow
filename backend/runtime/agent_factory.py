"""Builds Strands agent instances from datastore agent configuration."""

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
        # Only resolve a model object when using the real Strands agent (not a test stub)
        if self.agent_class is not None:
            # Test/stub path: pass model as raw string
            return agent_class(
                system_prompt=self._system_prompt(agent_config),
                model=agent_config.model,
                tools=self.tool_registry.resolve(agent_config.tools or []),
                callback_handler=None,
            )
        model = self._resolve_model(agent_config)
        return agent_class(
            system_prompt=self._system_prompt(agent_config),
            model=model,
            tools=self.tool_registry.resolve(agent_config.tools or []),
            callback_handler=None,
        )

    def _resolve_model(self, agent_config: Agent) -> Any:
        """Build the correct Strands model object based on agent provider/model config."""
        provider = (agent_config.provider or "").lower()
        model_id = agent_config.model or ""

        # Grok / xAI
        if provider in ("grok", "xai") or "grok" in model_id.lower():
            return self._build_xai_model(model_id)

        # OpenAI
        if provider == "openai" or model_id.startswith("gpt"):
            return self._build_openai_model(model_id)

        # Anthropic
        if provider == "anthropic" or "claude" in model_id.lower():
            return self._build_anthropic_model(model_id)

        # AWS Bedrock
        if provider == "bedrock":
            return self._build_bedrock_model(model_id)

        # Default: try xAI/Grok (as per project default)
        return self._build_xai_model(model_id)

    def _build_xai_model(self, model_id: str) -> Any:
        from configs.settings import settings
        try:
            from strands.models.openai import OpenAIModel
        except ImportError as exc:
            raise RuntimeError("strands-agents OpenAI model not available") from exc

        return OpenAIModel(
            client_args={
                "api_key": settings.xai_api_key,
                "base_url": settings.xai_base_url,
            },
            model_id=model_id or settings.xai_default_model,
            params={"max_tokens": 4096},
        )

    def _build_openai_model(self, model_id: str) -> Any:
        from configs.settings import settings
        try:
            from strands.models.openai import OpenAIModel
        except ImportError as exc:
            raise RuntimeError("strands-agents OpenAI model not available") from exc

        return OpenAIModel(
            client_args={"api_key": settings.openai_api_key},
            model_id=model_id or "gpt-4o",
            params={"max_tokens": 4096},
        )

    def _build_anthropic_model(self, model_id: str) -> Any:
        from configs.settings import settings
        try:
            from strands.models.anthropic import AnthropicModel
        except ImportError as exc:
            raise RuntimeError("strands-agents Anthropic model not available") from exc

        return AnthropicModel(
            client_args={"api_key": settings.anthropic_api_key},
            model_id=model_id or "claude-sonnet-4-20250514",
            params={"max_tokens": 4096},
        )

    def _build_bedrock_model(self, model_id: str) -> Any:
        from configs.settings import settings
        try:
            from strands.models.bedrock import BedrockModel
        except ImportError as exc:
            raise RuntimeError("strands-agents Bedrock model not available") from exc

        return BedrockModel(
            model_id=model_id or "us.amazon.nova-pro-v1:0",
            region_name=settings.aws_bedrock_region,
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
        parts = [agent_config.system_prompt or "You are a helpful assistant."]
        if agent_config.role:
            parts.append(f"Role: {agent_config.role}")
        if agent_config.skills:
            parts.append("Skills: " + ", ".join(agent_config.skills))
        if agent_config.interaction_rules:
            parts.append(f"Interaction rules: {agent_config.interaction_rules}")
        if agent_config.guardrails:
            parts.append(f"Guardrails: {agent_config.guardrails}")
        return "\n\n".join(parts)
