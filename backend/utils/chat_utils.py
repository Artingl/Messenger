import sqlalchemy
from database import tables

import time
import typing as t


def update_settings(chat: tables.Chats):
    settings = chat.settings

    if settings is None:
        settings = {}
    
    if "avatar" not in settings:
        # If avatar string is set to default, the client must choice the default
        # avatar based on its desire
        settings["avatar"] = "default"

    return settings


def public_settings(chat: tables.Chats) -> dict:
    public_values = [
        "avatar"
    ]

    return {key: value for key, value in chat.settings.items() if key in public_values}


def generate_chat_message(message: str, attachments: t.List[str], sender: tables.User, chat: tables.Chats):
    # Check if the message does not exceed maximum length
    if len(message) > 2000 or not message:
        return False
    
    return {
        "id": len(chat.messages),
        "data": message,
        "sender_id": sender.uid,
        "attachments": attachments,
        "timestamp": time.time()
    }

