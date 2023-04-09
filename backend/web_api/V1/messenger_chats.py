from database import db, tables
from utils import basic_utils, user_utils

import web_api.api as api

import bcrypt


class MessengerChats(api.ApiBase):
    def __init__(self):
        super(MessengerChats, self).__init__(
                api.ApiVersions.V1,
                route='/messenger/chats',
                methods=["GET", "POST"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        # check that token was provided with the request
        if "token" not in request.fields:
            return False

        # GET request - get chat info
        # POST request - create a new chat

        if request.method == "GET":
            pass
        elif request.method == "POST":
            pass

        return True

    def request(self, request: api.ApiRequest) -> api.ApiResponse:
        result = api.ApiResponse(
            status_code=api.ApiResponse.Codes.SUCCESS,
            message="Executed without errors.",
            code=0
        )

        with db.get_session() as session:
            # Try to find the user using token
            if not (user := session.query(tables.User).filter(tables.User.token == request.fields["token"]).first()):
                # Unable to find the user using email
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 1
                result.message = "User does not exist."
                return result

            # Update settings
            user.settings = user_utils.update_settings(user)

            # GET request - get chat info
            # POST request - create a new chat
            # ...
        return result

