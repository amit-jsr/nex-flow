"""Builds Strands agent instances from datastore agent configuration."""

from __future__ import annotations

import asyncio
import json
from urllib import request
from urllib.error import HTTPError, URLError
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
        try:
            model = self._resolve_model(agent_config)
        except RuntimeError as exc:
            if self._is_groq_config(agent_config) and "OpenAI model not available" in str(exc):
                return self._build_direct_groq_agent(agent_config)
            raise
        return agent_class(
            system_prompt=self._system_prompt(agent_config),
            model=model,
            tools=self.tool_registry.resolve(agent_config.tools or []),
            callback_handler=None,
        )

    def _is_groq_config(self, agent_config: Agent) -> bool:
        provider = (agent_config.provider or "").lower()
        model_id = (agent_config.model or "").lower()
        return (
            provider in ("groq", "grok")
            or model_id.startswith("openai/")
            or model_id.startswith("llama-")
            or model_id.startswith("groq/")
        )

    def _build_direct_groq_agent(self, agent_config: Agent) -> DirectGroqAgent:
        from configs.settings import settings

        return DirectGroqAgent(
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model_id=agent_config.model or settings.groq_default_model,
            system_prompt=self._system_prompt(agent_config),
        )

    def _resolve_model(self, agent_config: Agent) -> Any:
        """Build the correct Strands model object based on agent provider/model config."""
        provider = (agent_config.provider or "").lower()
        model_id = agent_config.model or ""

        # Groq Cloud
        if provider in ("groq", "grok") or "groq" in model_id.lower():
            return self._build_groq_model(model_id)

        # OpenAI
        if provider == "openai" or model_id.startswith("gpt"):
            return self._build_openai_model(model_id)

        # Anthropic
        if provider == "anthropic" or "claude" in model_id.lower():
            return self._build_anthropic_model(model_id)

        # AWS Bedrock
        if provider == "bedrock":
            return self._build_bedrock_model(model_id)

        # Default: try Groq (project default)
        return self._build_groq_model(model_id)

    def _build_groq_model(self, model_id: str) -> Any:
        from configs.settings import settings
        try:
            from strands.models.openai import OpenAIModel
        except ImportError as exc:
            raise RuntimeError("strands-agents OpenAI model not available") from exc

        return OpenAIModel(
            client_args={
                "api_key": settings.groq_api_key,
                "base_url": settings.groq_base_url,
            },
            model_id=model_id or settings.groq_default_model,
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


class DirectGroqAgent:
    """Small Groq Responses API adapter used when Strands has no OpenAI model adapter."""

    def __init__(
        self,
        *,
        api_key: str | None,
        base_url: str,
        model_id: str,
        system_prompt: str,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model_id = model_id
        self.system_prompt = system_prompt

    async def stream_async(self, prompt: str) -> Any:
        text = await asyncio.to_thread(self._create_response, prompt)
        if text:
            yield {
                "type": "text_delta",
                "text": text,
                "usage": {"tokens": 0, "cost_usd": 0.0},
                "provider": "groq",
                "model": self.model_id,
            }

    def _create_response(self, prompt: str) -> str:
        if not self.api_key:
            raise RuntimeError(
                "Groq is not configured. Add your Groq API key in Settings, save it, and rerun the workflow."
            )

        payload = {
            "model": self.model_id,
            "instructions": self.system_prompt,
            "input": prompt,
        }
        req = request.Request(
            f"{self.base_url}/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "NxFlow/0.1 GroqClient",
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            if exc.code == 403 and "1010" in body:
                raise RuntimeError(
                    "Groq rejected the request at the edge (403 / 1010). "
                    "Verify the key is a Groq Cloud key from console.groq.com, then retry. "
                    f"Raw response: {body}"
                ) from exc
            raise RuntimeError(f"Groq API request failed ({exc.code}): {body}") from exc
        except URLError as exc:
            raise RuntimeError(f"Groq API request failed: {exc.reason}") from exc

        return extract_response_text(data)


def extract_response_text(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]

    chunks: list[str] = []
    for item in data.get("output", []) or []:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "".join(chunks).strip()
