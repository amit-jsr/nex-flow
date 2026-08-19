"""Tests for Telegram parsing, replies, and client behavior."""

from main import app
from channels import TelegramBotClient, parse_telegram_update, queued_run_reply, start_reply
from api.telegram import parse_uuid


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


def test_telegram_reply_texts_are_stable() -> None:
    assert start_reply() == "NexFlow bot is alive."
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
