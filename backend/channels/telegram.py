"""Telegram client helpers for parsing updates and sending replies."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any
from urllib import request


@dataclass(frozen=True)
class TelegramMessage:
    update_id: int | None
    message_id: int | None
    chat_id: str
    sender_id: str | None
    text: str
    is_start: bool
    raw: dict[str, Any]


@dataclass(frozen=True)
class TelegramSendMessageRequest:
    url: str
    payload: dict[str, Any]


class TelegramBotClient:
    def __init__(self, token: str) -> None:
        self.token = token

    def build_send_message_request(
        self, chat_id: str, text: str
    ) -> TelegramSendMessageRequest:
        return TelegramSendMessageRequest(
            url=f"https://api.telegram.org/bot{self.token}/sendMessage",
            payload={"chat_id": chat_id, "text": text},
        )

    async def send_message(self, chat_id: str, text: str) -> dict[str, Any]:
        send_request = self.build_send_message_request(chat_id, text)
        return await asyncio.to_thread(
            post_json, send_request.url, send_request.payload
        )


def parse_telegram_update(update: dict[str, Any]) -> TelegramMessage | None:
    message = update.get("message") or update.get("edited_message")
    if not isinstance(message, dict):
        return None

    text = message.get("text")
    chat = message.get("chat")
    if not isinstance(text, str) or not text.strip() or not isinstance(chat, dict):
        return None

    chat_id = chat.get("id")
    if chat_id is None:
        return None

    sender = message.get("from")
    sender_id = sender.get("id") if isinstance(sender, dict) else None
    normalized_text = text.strip()
    return TelegramMessage(
        update_id=update.get("update_id"),
        message_id=message.get("message_id"),
        chat_id=str(chat_id),
        sender_id=str(sender_id) if sender_id is not None else None,
        text=normalized_text,
        is_start=normalized_text.startswith("/start"),
        raw=update,
    )


def start_reply() -> str:
    return "NxFlow bot is alive."


def queued_run_reply(run_id: str | None) -> str:
    if run_id is None:
        return "Message received. Configure TELEGRAM_DEFAULT_WORKFLOW_ID to run a workflow."
    return f"Message received. Workflow run queued: {run_id}"


def post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    http_request = request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(http_request, timeout=10) as response:
        body = response.read().decode("utf-8")
    if not body:
        return {}
    decoded = json.loads(body)
    return decoded if isinstance(decoded, dict) else {"result": decoded}
