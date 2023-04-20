from fastapi import HTTPException, status

from sqlalchemy import or_
from sqlalchemy.future import select

from app.db import db, tables
from app.api.v1.models import *
import app.utils as utils

from uuid import uuid4, UUID

import bcrypt
import time


def make_user_info(user: tables.User):
    return {
        "uuid": UUID(user.uuid),
        "token": user.token,
        "login": user.login,
        "nickname": user.nickname,
        "email": user.email,
        "register_timestamp": user.register_timestamp,
        "last_seen": user.last_seen,
        "region": user.region,
        "settings": utils.public_settings(user),
        "gender": user.gender
    }


async def db_register_user(info: UserRegister) -> UserInfo:
    async with db.async_session() as session:
        # Check that user with same credentials does not exist
        statement = select(tables.User).filter(or_(tables.User.login == info.login, tables.User.email == info.email))
        check_result = await session.execute(statement)
        
        if check_result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=[{
                    "loc": ["body"],
                    "msg": "user with same credentials already exist",
                    "type": "value_error.duplicate"
                }]
            )

        # Current timestamp
        now = time.time()

        # Generate uuid for the user
        generated_uuid = uuid4()

        # Generate unique token for the user
        generated_token = utils.make_token(now, info.login)

        # Hashed user's password
        hashed_password = bcrypt.hashpw(info.password.encode(), bcrypt.gensalt()).decode()

        # Create database query
        user = tables.User(
            uuid=str(generated_uuid),
            nickname=info.nickname,
            login=info.login,
            email=info.email,
            token=generated_token,
            password_hash=hashed_password,
            register_timestamp=now,
            gender=info.gender,
            last_seen=now,
            region="US",
            settings={},
        )

        # Update user's settings
        await utils.update_settings(session, user)

        session.add(user)
        await session.commit()

        return make_user_info(user)


async def db_login_user(info: UserLogin) -> UserInfo:
    async with db.async_session() as session:
        # Try to find the user using email
        statement = select(tables.User).filter(tables.User.email == info.email)
        check_result = await session.execute(statement)
        
        if user := check_result.first():
            user = user[0]

            # Check the password
            password = bcrypt.hashpw(
                    info.password.encode(),
                    user.password_hash.encode()
            )
            
            if password != user.password_hash.encode():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=[{
                        "loc": ["body"],
                        "msg": "user not found or incorrect password",
                        "type": "value_error.not_found"
                    }])

            # Update user's settings
            await utils.update_settings(session, user)

            return make_user_info(user)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=[{
                "loc": ["body"],
                "msg": "user not found or incorrect password",
                "type": "value_error.not_found"
            }])


async def db_login_token_user(token: str):
    async with db.async_session() as session:
        # Try to find the user using token
        statement = select(tables.User).filter(tables.User.token == token)
        check_result = await session.execute(statement)
        
        if user := check_result.first():
            user = user[0]
            # Update user's settings
            await utils.update_settings(session, user)

            return make_user_info(user)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=[{
                "loc": ["headers"],
                "msg": "user not found",
                "type": "value_error"
            }])
