from sqlalchemy import Column, String, Integer, JSON, ARRAY

from database import db


class Chats(db.Base):
    __tablename__ = 'chats'

    # Unique chat id
    uid = Column(Integer, primary_key=True, autoincrement=True)

    # Members of the chat (user ids)
    members = Column(ARRAY(Integer), nullable=False)

    # Chat messages
    messages = Column(ARRAY(JSON), default={})

    # A list that contains info what messages some members might not have read
    unread_messages = Column(ARRAY(JSON), default={})

    # Timestamp in seconds since the chat was created
    register_timestamp = Column(Integer, nullable=False)

    # Chat title
    chat_title = Column(String, nullable=False)

    # Various settings that can be changed on fly
    settings = Column(JSON, default={})

