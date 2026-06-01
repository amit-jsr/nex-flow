"""WebSocket endpoint for streaming run events to the UI."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from runtime import run_event_bus


router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def run_events_socket(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    queue = run_event_bus.subscribe(run_id)
    await websocket.send_json(
        {
            "type": "connected",
            "run_id": run_id,
            "detail": "Subscribed to live run events.",
        }
    )
    try:
        while True:
            await websocket.send_json(await queue.get())
    except WebSocketDisconnect:
        pass
    finally:
        run_event_bus.unsubscribe(run_id, queue)
