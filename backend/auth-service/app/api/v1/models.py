from pydantic import BaseModel, EmailStr, validator
from fastapi import Query
from uuid import UUID

from enum import Enum
from typing import Annotated


class UserGender(str, Enum):
    male = "male"
    female = "female"


class UserInfo(BaseModel):
    uuid: UUID
    email: EmailStr
    gender: UserGender
    token: str
    login: str
    nickname: str
    register_timestamp: int
    last_seen: int
    region: str
    settings: dict


class UserRegister(BaseModel):
    email: EmailStr
    gender: UserGender
    password: Annotated[str, Query(min_length=6)]
    nickname: Annotated[str, Query(min_length=3)]
    login: Annotated[str, Query(min_length=3)]

    @validator('login')
    def valid_login(cls, v):
        if not v.startswith("@"):
            raise ValueError("login must start with @")
        
        if not v[1:].isalnum():
            raise ValueError("login must be alphanumeric")
        
        return v

    @validator('nickname')
    def valid_nickname(cls, v):
        if not v.isalnum():
            raise ValueError("nickname must be alphanumeric")
        
        return v


class UserLogin(BaseModel):
    password: Annotated[str, Query(min_length=6)]
    email: EmailStr
