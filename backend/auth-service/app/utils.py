from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import tables

import secrets
import time


def make_token(user_register_timestamp: str, user_login: str) -> str:
    """Generates completely unique token based on user info
    Token structure: WBM_timestamp.random_data#first_login_in_hex
    """
    return f"WBM_{user_register_timestamp}.{secrets.token_hex()}#{user_login.encode('utf-8').hex()}"


async def update_settings(session: AsyncSession, user: tables.User, update_time: bool = True):
    if user.settings is None:
        user.settings = {}
    
    if "avatar" not in user.settings:
        # If avatar string is set to default, the client must choice the default
        # avatar based on its desire
        user.settings["avatar"] = "default"
    
    flag_modified(user, "settings")

    if update_time:
        user.last_seen = time.time()
    
    await session.commit()


def public_settings(user: tables.User) -> dict:
    public_values = [
        "avatar"
    ]

    return {key: value for key, value in user.settings.items() if key in public_values}

