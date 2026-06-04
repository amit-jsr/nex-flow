"""Tests for Telegram parsing, replies, and client behavior."""

import pytest
from fastapi import HTTPException

from api import telegram as telegram_api
from api.telegram import (
    parse_id_list,
    parse_uuid,
    telegram_sender_allowed,
    verify_webhook_secret,
)
from main import app
from channels import TelegramBotClient, parse_telegram_update, queued_run_reply, start_reply


def test_telegram_and_health_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/telegram/webhook" in paths
    assert "/health" in paths


def test_parse_telegram_text_message() -> None:
    parsed = parse_telegram_update(
        {
            "update_id": 123,
            "message": {
                "message_id": 456,
                "from": {"id": 789},
                "chat": {"id": 999},
                "text": "  hello agent  ",
            },
        }
    )

    assert parsed is not None
    assert parsed.update_id == 123
    assert parsed.message_id == 456
    assert parsed.chat_id == "999"
    assert parsed.sender_id == "789"
    assert parsed.text == "hello agent"
    assert parsed.is_start is False


def test_parse_telegram_start_command() -> None:
    parsed = parse_telegram_update(
        {
            "update_id": 123,
            "message": {
                "message_id": 456,
                "chat": {"id": 999},
                "text": "/start",
            },
        }
    )

    assert parsed is not None
    assert parsed.is_start is True


def test_parse_telegram_ignores_non_text_updates() -> None:
    assert parse_telegram_update({"update_id": 123, "message": {"chat": {"id": 999}}}) is None


def test_parse_uuid_ignores_missing_or_invalid_values() -> None:
    assert parse_uuid(None) is None
    assert parse_uuid("not-a-uuid") is None


def test_parse_id_list_trims_empty_items() -> None:
    assert parse_id_list(" 1,2, , 3 ") == {"1", "2", "3"}
    assert parse_id_list(None) == set()


def test_telegram_sender_allowed_defaults_to_open_demo_mode() -> None:
    original_chats = telegram_api.settings.telegram_allowed_chat_ids
    original_senders = telegram_api.settings.telegram_allowed_sender_ids
    try:
        telegram_api.settings.telegram_allowed_chat_ids = None
        telegram_api.settings.telegram_allowed_sender_ids = None
        assert telegram_sender_allowed("chat-1", "sender-1") is True
    finally:
        telegram_api.settings.telegram_allowed_chat_ids = original_chats
        telegram_api.settings.telegram_allowed_sender_ids = original_senders


def test_telegram_sender_allowed_checks_chat_or_sender() -> None:
    original_chats = telegram_api.settings.telegram_allowed_chat_ids
    original_senders = telegram_api.settings.telegram_allowed_sender_ids
    try:
        telegram_api.settings.telegram_allowed_chat_ids = "chat-1,chat-2"
        telegram_api.settings.telegram_allowed_sender_ids = "sender-1"
        assert telegram_sender_allowed("chat-2", None) is True
        assert telegram_sender_allowed("chat-9", "sender-1") is True
        assert telegram_sender_allowed("chat-9", "sender-9") is False
    finally:
        telegram_api.settings.telegram_allowed_chat_ids = original_chats
        telegram_api.settings.telegram_allowed_sender_ids = original_senders


def test_verify_webhook_secret_requires_matching_header() -> None:
    original_secret = telegram_api.settings.telegram_webhook_secret
    try:
        telegram_api.settings.telegram_webhook_secret = "secret-123"
        verify_webhook_secret("secret-123")
        with pytest.raises(HTTPException) as exc:
            verify_webhook_secret("wrong")
        assert exc.value.status_code == 403
    finally:
        telegram_api.settings.telegram_webhook_secret = original_secret


def test_telegram_reply_texts_are_stable() -> None:
    assert start_reply() == "NxFlow bot is alive."
    assert queued_run_reply(None) == (
        "Message received. Configure TELEGRAM_DEFAULT_WORKFLOW_ID to run a workflow."
    )
    assert queued_run_reply("run-123") == "Message received. Workflow run queued: run-123"


def test_telegram_client_builds_send_message_request() -> None:
    send_request = TelegramBotClient("token-123").build_send_message_request(
        chat_id="chat-456", text="hello"
    )

    assert send_request.url == "https://api.telegram.org/bottoken-123/sendMessage"
    assert send_request.payload == {"chat_id": "chat-456", "text": "hello"}


def test_parse_telegram_edited_message_is_accepted() -> None:
    parsed = parse_telegram_update(
        {
            "update_id": 200,
            "edited_message": {
                "message_id": 10,
                "chat": {"id": 42},
                "text": "edited text",
            },
        }
    )
    assert parsed is not None
    assert parsed.text == "edited text"
