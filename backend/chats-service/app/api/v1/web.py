from fastapi import APIRouter, HTTPException, Request, status

from uuid import UUID, uuid4
from typing import List

from app.api.v1.db_methods import *
from app.api.v1.models import *

chats_router = APIRouter()


@chats_router.get('/', response_model=List[ChatInfo])
async def chats_list(request: Request):
    """Returns all user's chats
    """
    
    # Check authorization
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    return await db_get_chats(request.user)


@chats_router.get('/{uuid}', response_model=ChatInfo)
async def chat_info(request: Request, uuid: UUID):
    """Returns chat info based on uuid, if user is a member of the chat
    """
    
    # Check authorization
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    return await db_find_chat(request.user, uuid)


@chats_router.post('/', response_model=ChatInfo)
async def chat_create(request: Request, chat_info: ChatCreate):
    """Creates chat based on the info
    """
    
    # Check authorization
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    return await db_create_chat(request.user, chat_info)
