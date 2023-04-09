import sqlalchemy
from database import tables


def update_settings(user: tables.User):
    settings = user.settings

    if settings is None:
        settings = {}
    
    if "avatar" not in settings:
        # If avatar string is set to default, the client must choice the default
        # avatar based on its desire
        settings["avatar"] = "default"

    return settings


def public_settings(user: tables.User) -> dict:
    public_values = [
        "avatar"
    ]

    return {key: value for key, value in user.settings.items() if key in public_values}

