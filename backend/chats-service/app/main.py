from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from starlette.routing import WebSocketRoute
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware

from app.api.v1.web import chats_router as v1_web
from app.api.v1.ws.sockets import WSEndpoint as v1_ws
from app.auth import AuthBackend

from app.db import db


app = FastAPI(
    routes=[WebSocketRoute('/ws/v1', v1_ws)],
)


@app.on_event("startup")
async def startup():
    print("Connecting to the database")
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    print("Disconnecting from the database")
    await db.disconnect()


# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication
app.add_middleware(
    AuthenticationMiddleware,
    backend=AuthBackend()
)

app.include_router(v1_web, prefix='/api/v1/chats', tags=['chats'])
