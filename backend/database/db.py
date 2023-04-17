import config

import typing as t
import sqlalchemy

from sqlalchemy.ext.declarative import declarative_base  
from sqlalchemy.orm import Session, sessionmaker

from loguru import logger


Base = None

__db: sqlalchemy.Engine
__session_factory: sessionmaker[Session]


def create_engine():
    global __db, __session_factory, Base

    logger.info("Connecting to the database...")
    
    # Connect to the database
    db_url = f"postgresql://{config.database.USER}:{config.database.PASSWORD}@{config.database.HOST}/{config.database.DATABASE}"
    __db = sqlalchemy.create_engine(db_url)
    __session_factory = sessionmaker(__db)

    Base = declarative_base()

    # Initialize tables classes
    import database.tables
    Base.metadata.create_all(__db)


def get_session() -> Session:
    return __session_factory()

