from sqlalchemy import Column, String, Integer, JSON, ARRAY

from app.db import db


class User(db.Base):
    __tablename__ = 'users'

    # Row id
    id = Column(Integer, primary_key=True, autoincrement=True)

    # User's UUID
    uuid = Column(String, nullable=False)

    # User's gender
    gender = Column(String, nullable=False)

    # User nickname, not unique and is not used to search for users
    nickname = Column(String, nullable=False)

    # User login, unique and used to search for users
    login = Column(String, unique=True, nullable=False)

    # User email
    email = Column(String, unique=True)

    # Permanent token to identify user
    token = Column(String, unique=True)

    # Hashed password
    password_hash = Column(String, nullable=False)

    # Timestamp in seconds since the user registered
    register_timestamp = Column(Integer, nullable=False)

    # Last API request time
    last_seen = Column(Integer, nullable=False)

    # Region where is located the user (e.g. US, UK, RU, etc.)
    region = Column(String, nullable=False)

    # List of all chats which user should see in the list
    conversations = Column(ARRAY(Integer), default=[])

    # Various settings that can be changed on fly
    settings = Column(JSON, default={})

    # Some internal values
    internal = Column(JSON, default={})

