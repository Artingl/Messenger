from sqlalchemy import Column, String, Integer, JSON, ARRAY

from app.db import db


class Chats(db.Base):
    __tablename__ = 'chats'

    # Row id
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Chat's UUID
    uuid = Column(String, nullable=False)

    # Members of the chat (user ids)
    members = Column(ARRAY(String), nullable=False)

    # Chat messages
    messages = Column(ARRAY(JSON), default={})

    # A list that contains info what messages some members might not have read
    unread_messages = Column(ARRAY(JSON), default={})

    # Timestamp in seconds since the chat was created
    creation_time = Column(Integer, nullable=False)
    
    # Timestamp in seconds since last chat update
    last_chat_update = Column(Integer, nullable=False)

    # Chat title
    chat_title = Column(String, nullable=False)

    # Various settings that can be changed on fly
    settings = Column(JSON, default={})

