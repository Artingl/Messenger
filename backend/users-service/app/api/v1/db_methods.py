from fastapi import HTTPException, status
from sqlalchemy.future import select

from app.db import db, tables
from app.api.v1.models import *
from app.auth import AuthUser

import app.utils as utils

from uuid import UUID

import bcrypt
import time


def make_user_info(user: tables.User) -> UserInfo:
    return {
        "uuid": UUID(user.uuid),
        "login": user.login,
        "nickname": user.nickname,
        "register_timestamp": user.register_timestamp,
        "last_seen": user.last_seen,
        "region": user.region,
        "settings": utils.public_settings(user),
        "gender": user.gender,
    }


async def db_find_users(the_user: AuthUser, login: str):
    """Find users based on their login
    """

    async with db.async_session() as session:
        statement = select(tables.User).filter(tables.User.login.contains(login))
        check_result = await session.execute(statement)
        
        if users := check_result.all():
            # Some users found. Construct the response
            users_list = []
            
            # Limit response up to 32 users
            for user in users[:32]:
                # Do not add the user to the list, if their uuid is the
                # same as caller's uuid
                if user[0].uuid == the_user.fields['uuid']:
                    continue 

                users_list.append(make_user_info(user[0]))

            # Return users if list is not empty
            if users_list:
                return users_list
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=[{
                "loc": ["headers"],
                "msg": "no users were found",
                "type": "value_error"
            }])
