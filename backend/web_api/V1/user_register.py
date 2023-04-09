from sqlalchemy import or_
import sqlalchemy
import web_api.api as api

from database import db, tables
from utils import basic_utils, user_utils

import bcrypt
import secrets


class UserRegister(api.ApiBase):
    def __init__(self):
        super(UserRegister, self).__init__(
                api.ApiVersions.V1,
                route='/user/register',
                methods=["POST"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        return "password" in request.fields and "nickname" in request.fields and "login" in request.fields and "email" in request.fields

    def request(self, request: api.ApiRequest) -> api.ApiResponse:
        result = api.ApiResponse(
            status_code=api.ApiResponse.Codes.SUCCESS,
            message="User has been registered.",
            code=0
        )

        with db.get_session() as session:
            # Check if password is secure enough
            if not basic_utils.is_secure_password(request.fields["password"]):
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 1
                result.message = "Password is too simple."
                return result

            # Check that there's no other users with the same nickname and email
            if session.query(tables.User).filter(
                    or_(tables.User.email == request.fields["email"], tables.User.login == request.fields["login"])).first():
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 2
                result.message = "User with the same login or email exists."
                return result

            # Set up fields
            user = tables.User()
            user.login = request.fields["login"]
            user.email = request.fields["email"]
            user.password_hash = bcrypt.hashpw(request.fields["password"].encode(), bcrypt.gensalt()).decode()
            user.nickname = request.fields["nickname"]
            user.register_timestamp = int(time.time())
            user.settings = user_utils.update_settings(user)

            # Get current user's region based on its IP
            user.register_region = basic_utils.get_region()
            
            # Generate permanent token
            user.token = basic_utils.make_token(user)
            
            # Attempt to register user
            session.add(user)
            session.commit()

            # Set user token and return
            result.data['token'] = user.token
        return result

