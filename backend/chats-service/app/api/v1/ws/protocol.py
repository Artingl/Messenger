from starlette.websockets import WebSocket

from typing import Any, Dict
from enum import Enum


class WebSocketPacketId(int, Enum):
    pass


async def handle_packet(endpoint, websocket: WebSocket, data: Dict[Any, Any]):
    pass
