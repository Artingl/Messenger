from starlette.websockets import WebSocket
from starlette.endpoints import WebSocketEndpoint

from app.backends.chats import ChatsBackend, ChatEventResultIds

from typing import Any, Dict
from enum import Enum

import time


class WebSocketPacketId(int, Enum):
    CHAT_EVENT = 0


async def send_error_packet(websocket: WebSocket, code: int, marker: int = 0, message: str = 'Unable tp process the reuqest'):
    await websocket.send_json({
        "time": time.time(),
        "status": "error",
        "code": code,
        "message": message,
        "marker": marker,
    })


async def send_packet(websocket: WebSocket, code: int, marker: int = 0, message: str = 'Executed successfully.'):
    await websocket.send_json({
        "time": time.time(),
        "status": "ok",
        "code": code,
        "message": message,
        "marker": marker,
        "data": {},
    })


async def handle_packet(endpoint: WebSocketEndpoint, websocket: WebSocket, data: Dict[Any, Any]):
    # Decode the packet
    match data.get("packet"):
        case WebSocketPacketId.CHAT_EVENT:
            # Execute chat event
            result = await ChatsBackend(endpoint.scope['user'], websocket, data.get('data')).run()
            
            if result != ChatEventResultIds.SUCCESS:
                await send_error_packet(websocket, result, marker=data.get('marker'))
            
            await send_packet(websocket, result, message='Success.', marker=data.get('marker'))
