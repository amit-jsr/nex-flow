from fastapi import APIRouter, WebSocket


router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def run_events_socket(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    await websocket.send_json(
        {
            "type": "connected",
            "run_id": run_id,
            "detail": "Live run events are not configured yet.",
        }
    )
    await websocket.close()
