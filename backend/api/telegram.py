from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from channels import TelegramBotClient, parse_telegram_update, queued_run_reply, start_reply
from configs.settings import settings
from datastore.model import Agent, Message, Run, Workflow


router = APIRouter()


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def receive_update(
    update: dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
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

    # For /start: reply immediately; for normal messages: execute workflow then reply with output
    if parsed.is_start:
        reply = start_reply()
        if settings.telegram_bot_token:
            await TelegramBotClient(settings.telegram_bot_token).send_message(
                parsed.chat_id, reply
            )
        telegram_sent = bool(settings.telegram_bot_token)
    else:
        reply = queued_run_reply(str(run.id) if run else None)
        telegram_sent = False
        if run and settings.telegram_bot_token:
            # Execute the workflow and send the real output back when done
            background_tasks.add_task(
                _execute_and_reply,
                run_id=run.id,
                chat_id=parsed.chat_id,
                token=settings.telegram_bot_token,
            )

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


async def _execute_and_reply(run_id: UUID, chat_id: str, token: str) -> None:
    """Run the workflow in background, then send the output back to Telegram."""
    from datastore.database import get_session_factory
    from runtime.workflow_runner import WorkflowRunner

    async with get_session_factory()() as db:
        try:
            completed_run = await WorkflowRunner(db).run(run_id)
            reply = completed_run.output or "Workflow completed with no output."
        except Exception as exc:
            reply = f"Workflow failed: {exc}"

    await TelegramBotClient(token).send_message(chat_id, reply)


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
