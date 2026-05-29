from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from channels import TelegramBotClient, parse_telegram_update, queued_run_reply, start_reply
from configs.settings import settings
from datastore.model import Agent, Message, Run, Workflow


router = APIRouter()


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def receive_update(
    update: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    parsed = parse_telegram_update(update)
    if parsed is None:
        return {"ok": True, "accepted": False, "update_id": update.get("update_id")}

    agent_id = await configured_agent_id(db)
    run = await create_configured_run(db, parsed.text)
    message = Message(
        run_id=run.id if run else None,
        agent_id=agent_id,
        channel="telegram",
        direction="inbound",
        content=parsed.text,
        sender_id=parsed.sender_id or parsed.chat_id,
        message_metadata={
            "chat_id": parsed.chat_id,
            "message_id": parsed.message_id,
            "update_id": parsed.update_id,
        },
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    reply = start_reply() if parsed.is_start else queued_run_reply(str(run.id) if run else None)
    telegram_sent = False
    if settings.telegram_bot_token:
        await TelegramBotClient(settings.telegram_bot_token).send_message(parsed.chat_id, reply)
        telegram_sent = True

    return {
        "ok": True,
        "accepted": True,
        "update_id": parsed.update_id,
        "message_id": message.id,
        "run_id": str(run.id) if run else None,
        "command": "start" if parsed.is_start else None,
        "reply": reply,
        "telegram_sent": telegram_sent,
    }


async def configured_agent_id(db: AsyncSession) -> UUID | None:
    agent_id = parse_uuid(settings.telegram_default_agent_id)
    if agent_id is None:
        return None
    return agent_id if await db.get(Agent, agent_id) is not None else None


async def create_configured_run(db: AsyncSession, text: str) -> Run | None:
    workflow_id = parse_uuid(settings.telegram_default_workflow_id)
    if workflow_id is None:
        return None
    if await db.get(Workflow, workflow_id) is None:
        return None
    run = Run(workflow_id=workflow_id, input=text, status="pending")
    db.add(run)
    await db.flush()
    return run


def parse_uuid(value: str | None) -> UUID | None:
    if value is None:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None
