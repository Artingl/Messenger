from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.web import auth_router as v1
from app.db import db

app = FastAPI()


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

app.include_router(v1, prefix='/api/v1/auth', tags=['auth'])
