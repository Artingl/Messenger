from fastapi import APIRouter, status, Request, HTTPException

from typing import List

from app.api.v1.db_methods import *
from app.api.v1.models import *

users_router = APIRouter()


@users_router.get('/find/{login}', response_model=List[UserInfo])
async def users_find(request: Request, login: str):
    # Check that login is valid
    if len(login) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=[{
                "loc": ["query"],
                "msg": "bad login value",
                "type": "value_error"
            }]
        )

    # Check authorization
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    # Return found users
    return await db_find_users(request.user, login)
