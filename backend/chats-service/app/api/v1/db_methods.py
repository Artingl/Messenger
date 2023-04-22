from app.auth import AuthUser
from app.api.v1.models import *
from app.db import db, tables
from app.utils import *

from fastapi import HTTPException, status
from sqlalchemy import select, and_

from uuid import uuid4
from typing import List

import time


async def make_chat_info(chat: tables.Chats) -> ChatInfo:
    return {
        "uuid": UUID(chat.uuid),
        "title": chat.chat_title,
        "members": [UUID(i) for i in chat.members],
        "messages": chat.messages[-64:],
        "unread_messages": chat.unread_messages,
        "creation_time": chat.creation_time,
        "last_chat_update": chat.last_chat_update,
        "settings": await public_settings(chat),
        "last_message": chat.messages[-1],

        # todo: implement this counter through websockets
        "online": 1
    }


async def db_get_chats(user: AuthUser) -> List[ChatInfo]:
    async with db.async_session() as session:
        # Get all chats where the user is a member
        statement = select(tables.Chats).filter(tables.Chats.members.any(user.fields['uuid']))
        check_result = await session.execute(statement)
        
        if chats := check_result.all():
            # Some chats found. Make the response
            result = []

            for chat in chats:
                result.append(await make_chat_info(chat[0]))
            
            return result
        
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=[{
            "loc": ["headers"],
            "msg": "no chats were found",
            "type": "value_error"
        }])


async def db_find_chat(user: AuthUser, uuid: UUID) -> ChatInfo:
    async with db.async_session() as session:
        # Try to find the chat and check that the user is a member of the chat
        statement = select(tables.Chats).filter(
            and_(tables.Chats.uuid == str(uuid), tables.Chats.members.any(user.fields['uuid'])))
        
        check_result = await session.execute(statement)
        
        if chat := check_result.first():
            # Chat found. Make the response
            return await make_chat_info(chat[0])
        
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=[{
            "loc": ["headers"],
            "msg": "no chats were found",
            "type": "value_error"
        }])


async def db_create_chat(user: AuthUser, info: ChatCreate) -> ChatInfo:
    async with db.async_session() as session:
        # Add the user to the members list, if it is not already there
        if user.fields['uuid'] not in info.members:
            info.members.append(user.fields['uuid'])

        # Set chat info
        chat = tables.Chats()

        chat.uuid = str(uuid4())
        chat.chat_title = info.title
        chat.messages = []
        chat.unread_messages = []
        chat.creation_time = time.time()
        chat.last_chat_update = time.time()

        # Convert list of UUIDs to list of strings
        chat.members = [str(i) for i in info.members]

        # Set up settings in chat
        chat.settings = {}
        await update_settings(chat)

        # Add placeholder message
        chat.messages = []
        await create_message(chat, DUMMY_UUID, "Chat created!", [], is_visible=False)

        # Create the chat
        session.add(chat)
        await session.commit()

        return await make_chat_info(chat)
