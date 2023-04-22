import os

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData

DATABASE_URI = os.getenv("DATABASE_URI")
    
# Initialize database
engine = create_async_engine(DATABASE_URI, echo=True)
Base = declarative_base()
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def disconnect():
    await engine.dispose()


async def connect():
    import app.db.tables
    # Init user model
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
