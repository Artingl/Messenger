from fastapi import APIRouter, Header
from typing import Annotated

from .models import *
from .db_methods import *

auth_router = APIRouter()


@auth_router.post('/register', response_model=UserInfo)
async def auth_register(info: UserRegister):
    # Try to register the user
    result = await db_register_user(info)

    # Send the result to the client
    return result


@auth_router.post('/login', response_model=UserInfo)
async def auth_login(info: UserLogin):
    # Try to log in
    result = await db_login_user(info)

    # Send the result to the client
    return result


@auth_router.get('/token', response_model=UserInfo)
async def auth_token(authorization: Annotated[str, Header()]):
    # Try to log in using token
    result = await db_login_token_user(authorization)

    # Send the result to the client
    return result
