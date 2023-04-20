from fastapi import APIRouter, HTTPException, Request, status

from uuid import UUID, uuid4
from typing import List

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
    
    # print(request.user.fields)

    return []


@chats_router.get('/{uuid}', response_model=ChatInfo)
async def chat_info(request: Request, uuid: UUID):
    """Returns chat info based on uuid, if user is a member of the chat
    """
    
    # Check authorization
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    print(request.user.fields)

    return { "uuid": uuid4(), "title": "" }
