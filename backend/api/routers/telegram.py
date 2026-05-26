from typing import Any

from fastapi import APIRouter, status


router = APIRouter()


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def receive_update(update: dict[str, Any]) -> dict[str, Any]:
    """Accept Telegram updates until message dispatch is implemented."""
    return {"accepted": True, "update_id": update.get("update_id")}
