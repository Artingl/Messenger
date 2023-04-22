from pydantic import BaseModel
from uuid import UUID

from enum import Enum


class UserGender(str, Enum):
    male = "male"
    female = "female"


class UserInfo(BaseModel):
    uuid: UUID
    gender: UserGender
    login: str
    nickname: str
    register_timestamp: int
    last_seen: int
    region: str
    settings: dict
