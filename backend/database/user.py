from sqlalchemy import Column, String, Integer, JSON

from database import db


class User(db.Base):
    __tablename__ = 'user'

    # Unique user id
    uid = Column(Integer, primary_key=True, autoincrement=True)

    # User nickname, not unique and is not used to search for users
    nickname = Column(String, nullable=False)

    # User login, unique and used to search for users
    login = Column(String, unique=True, nullable=False)

    # User email
    email = Column(String, unique=True)

    # Permanent token to identify user
    token = Column(String, unique=True)

    # Hashed password
    password_hash = Column(String, nullable=False)

    # Timestamp in seconds since the user egistered
    register_timestamp = Column(Integer, nullable=False)

    # Region, where was user on register (e.g. US, UK, RU, etc)
    register_region = Column(String, nullable=False)

    # Various settings that can be changed on fly
    settings = Column(JSON, default={})

