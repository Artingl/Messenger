from pydantic import BaseModel
from uuid import UUID


class ChatInfo(BaseModel):
    uuid: UUID
    title: str
