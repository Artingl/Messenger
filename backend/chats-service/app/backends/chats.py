from starlette.websockets import WebSocket
from sqlalchemy import select, and_

from app.auth import AuthUser
from app.db import db, tables
from app.utils import create_message

from typing import Dict, List, Any


class ChatEventIds:
    NEW_MESSAGE = 0
    TYPING = 1


class ChatEventResultIds:
    BAD_REQUEST = -1
    CHAT_NOT_FOUND = -2
    SUCCESS = 0


class ChatsBackend:
    def __init__(self, user: AuthUser, websocket: WebSocket, data: Dict[str, Any]):
        self.data = data
        self.user = user
        self.conn = websocket

    def check_fields(self, needed_fields: List = []):
        """Checks that the client provided valid fields in self.data
        """
        if self.data is None:
            return False

        return "uuid" in self.data and "event" in self.data and all([i in self.data for i in needed_fields])

    async def run(self) -> int:
        # Check fields
        if not self.check_fields():
            return ChatEventResultIds.BAD_REQUEST
        
        match self.data.get('event'):
            case ChatEventIds.NEW_MESSAGE:
                return await self.create_new_message()
            case ChatEventIds.TYPING:
                return await self.typing_event()
        
        return ChatEventResultIds.BAD_REQUEST

    async def typing_event(self) -> int:
        async with db.async_session() as session:
            # Try to find the chat so we can check that the user is a member of the chat
            statement = select(tables.Chats).filter(
                and_(tables.Chats.uuid == str(self.data.get('uuid')), tables.Chats.members.any(self.user.fields['uuid'])))
            
            check_result = await session.execute(statement)
            
            if not (chat := check_result.first()):
                # Tell the client that chat was not found
                return ChatEventResultIds.CHAT_NOT_FOUND

            # todo: send events to all chat members that a new message was sent

            return ChatEventResultIds.SUCCESS

    async def create_new_message(self) -> int:
        # Check that message related fields are in the request
        if not self.check_fields(["content", "attachments"]):
            return ChatEventResultIds.BAD_REQUEST

        async with db.async_session() as session:
            # Try to find the chat and check that the user is a member of the chat
            statement = select(tables.Chats).filter(
                and_(tables.Chats.uuid == str(self.data.get('uuid')), tables.Chats.members.any(self.user.fields['uuid'])))
            
            check_result = await session.execute(statement)
            
            if not (chat := check_result.first()):
                # Tell the client that chat was not found
                return ChatEventResultIds.CHAT_NOT_FOUND
            chat = chat[0]
            
            # Chat found. Add the message
            await create_message(chat, self.user.fields['uuid'], self.data.get('content'), [])

            # Update chat
            session.merge(chat)
            await session.commit()

            # todo: send events to all chat members that a new message was sent

            return ChatEventResultIds.SUCCESS
