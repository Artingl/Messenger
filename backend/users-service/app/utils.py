from app.db import tables


def public_settings(user: tables.User) -> dict:
    public_values = [
        "avatar"
    ]

    return {key: value for key, value in user.settings.items() if key in public_values}

