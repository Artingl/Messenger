from database import db, tables
from utils import basic_utils, user_utils, chat_utils

import web_api.api as api

import time


# This API method is used to poll events about certain chat

class MessengerChatPoll(api.ApiBase):
    def __init__(self):
        super(MessengerChatPoll, self).__init__(
                api.ApiVersions.V1,
                route='/messenger/chat/poll',
                methods=["GET"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        return "token" in request.fields and "uid" in request.fields and "method" in request.fields and "recent_timestamp" in request.fields

    def request(self, request: api.ApiRequest) -> api.ApiResponse:
        result = api.ApiResponse(
            status_code=api.ApiResponse.Codes.SUCCESS,
            message="Executed without errors.",
            code=0
        )

        with db.get_session() as session:
            # Try to find the user using token
            if not (user := session.query(tables.User).filter(tables.User.token == request.fields["token"]).first()):
                # Unable to find the user using token
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 1
                result.message = "User does not exist."
                return result

            # Try to find the chat using its id
            if not (chat := session.query(tables.Chats).filter(tables.Chats.uid == request.fields['uid']).first()):
                # Unable to find the chat
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 2
                result.message = "Chat does not exist."
                return result
            
            # Check that the user is a member of the chat
            if user.uid not in chat.members:
                # User is not in the members list
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 3
                result.message = "Not a chat member."
                return result

            # Update settings
            user.settings = user_utils.update_settings(user)

            # Update chat settings
            chat.settings = chat_utils.update_settings(chat)
            
        result.data["poll_result"] = \
            request.webserver.polling.poll(f"chatevent_{chat.uid}_{request.fields['method']}", int(request.fields['recent_timestamp']))

        return result

