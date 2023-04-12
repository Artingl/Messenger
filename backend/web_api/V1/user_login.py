from database import db, tables
from utils import basic_utils, user_utils

import web_api.api as api

import bcrypt


class UserLogin(api.ApiBase):
    def __init__(self):
        super(UserLogin, self).__init__(
                api.ApiVersions.V1,
                route='/user/login',
                methods=["GET"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        return "password" in request.fields and "email" in request.fields or "token" in request.fields

    def request(self, request: api.ApiRequest) -> api.ApiResponse:
        result = api.ApiResponse(
            status_code=api.ApiResponse.Codes.SUCCESS,
            message="User data is correct.",
            code=0
        )

        with db.get_session() as session:
            # Check if we want to login using token or password
            if "token" in request.fields:
                if not (user := session.query(tables.User).filter(tables.User.token == request.fields["token"]).first()):
                    # Unable to find the user using token
                    result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                    result.code = 1
                    result.message = "User does not exist."
                    return result
            else:  # Using password
                # Note: We return the same message and code on error either user does not exist or incorrect password.
                #         This should be done this way, so if someone tries to bruteforce the password, it'd be a little
                #         harder to understand what is wrong.

                # Try to find user by their email
                if user := session.query(tables.User).filter(tables.User.email == request.fields["email"]).first():
                    # Check user password
                    if bcrypt.hashpw(request.fields["password"].encode(), user.password_hash.encode()) != user.password_hash.encode():
                        result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                        result.code = 1
                        result.message = "User does not exist or invalid password."
                        return result
                else:
                    # Unable to find the user using email
                    result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                    result.code = 1
                    result.message = "User does not exist or invalid password."
                    return result

            # Update settings
            user.settings = user_utils.update_settings(user)

            # Return full user info
            result.data['token'] = user.token
            result.data['nickname'] = user.nickname
            result.data['login'] = user.login
            result.data['settings'] = user_utils.public_settings(user)
        return result

