from fastapi import status
from starlette.endpoints import WebSocketEndpoint

from app.api.v1.ws import protocol


class WSEndpoint(WebSocketEndpoint):
    encoding = 'json'

    async def on_connect(self, websocket):
        await websocket.accept()

        # Check authorization
        if not self.scope['user'].is_authenticated:
            # Close the connection, because client sent bad token
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION
            )

    async def on_receive(self, websocket, data):
        await protocol.handle_packet(self, websocket, data)

    async def on_disconnect(self, websocket, close_code):
        pass
