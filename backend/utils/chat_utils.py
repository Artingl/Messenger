import sqlalchemy
from database import tables


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

