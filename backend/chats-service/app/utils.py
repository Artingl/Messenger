from sqlalchemy.orm.attributes import flag_modified

from app.db import tables

import time

from typing import List, Dict, Any
from uuid import UUID, uuid4


DUMMY_UUID: UUID = UUID("00000000-0000-0000-0000-000000000000")


async def update_settings(chat: tables.Chats) -> bool:
    settings = chat.settings

    if settings is None:
        settings = {}
    
    if "avatar" not in settings:
        # If avatar string is set to default, the client must choice the default
        # avatar based on its desire
        settings["avatar"] = "default"
    
    # Tell sqlalchemy that we modified settings
    flag_modified(chat, "settings")

    return True


async def create_message(chat: tables.Chats, user: UUID, content: str, attachments: List[Dict[str, Any]], is_visible: bool = True) -> bool:
    chat.messages.append({
        "uuid": str(uuid4()),
        "user_uuid": str(user),
        "is_visible": is_visible,
        "content": content,
        "attachments": attachments,
        "timestamp": time.time(),
    })

    # Tell sqlalchemy that we modified messages
    flag_modified(chat, "messages")

    return True


async def public_settings(chat: tables.Chats) -> dict:
    public_values = [
        "avatar"
    ]

    return {key: value for key, value in chat.settings.items() if key in public_values}
