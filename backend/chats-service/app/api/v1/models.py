from pydantic import BaseModel

from uuid import UUID
from typing import List, Dict, Any


class ChatInfo(BaseModel):
    uuid: UUID
    title: str
    members: List[UUID]
    messages: List[Dict]
    unread_messages: List[Dict]
    creation_time: int
    last_chat_update: int
    settings: Dict[str, Any]
    last_message: Dict[str, Any]
    online: int


class ChatCreate(BaseModel):
    title: str = "New Chat"
    members: List[UUID]
