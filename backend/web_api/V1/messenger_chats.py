from database import db, tables
from utils import basic_utils, user_utils, chat_utils

import web_api.api as api

import time


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

        # GET request - get chats info
        # POST request - create a new chat

        if request.method == "GET":
            pass
        elif request.method == "POST":
            return "members" in request.fields and "chatTitle" in request.fields

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
                # Unable to find the user using token
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 1
                result.message = "User does not exist."
                return result

            # Update settings
            user.settings = user_utils.update_settings(user)

            # GET request - get chats info
            # POST request - create a new chat
            if request.method == "GET":
                # Try to find chats with the user as a member
                if not (found_chats := session.query(tables.Chats).filter(tables.Chats.members.any(user.uid)).all()):
                    # Unable to find any chats
                    result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                    result.code = 2
                    result.message = "Chats not found."
                    return result

                # Prepare result
                data = []
    
                # todo: return chats by an offset
                for found_chat in found_chats:
                    # Chat info dict
                    values = {}
                    
                    found_chat.settings = chat_utils.update_settings(found_chat)

                    values['uid'] = found_chat.uid
                    values['members'] = found_chat.members
                    values['chat_title'] = found_chat.chat_title
                    values['register_timestamp'] = found_chat.register_timestamp
                    values['settings'] = chat_utils.update_settings(found_chat)
                    values['last_message'] = {}

                    # Check if any messages in the chat
                    if len(found_chat.messages) > 0:
                        # Send last message in the chat to the client
                        values['last_message'] = found_chat.messages[-1]

                    # Add chats info to the result
                    data.append(values)

                result.data[0] = data
            elif request.method == "POST":
                # Initialize a new chat
                chat = tables.Chats()

                # Chat title cannot be longer than 32 symbols
                chat.chat_title = request.fields["chatTitle"][:32]

                chat.members = list(request.fields["members"]) + [user.uid]
                chat.register_timestamp = int(time.time())
                chat.settings = chat_utils.update_settings(chat)
     
                # Add 'hello' message to the chat
                chat.messages = []
                chat_utils.generate_chat_message(f"Chat '{chat.chat_title}' was created!", [], user_utils.get_admin_bot(), chat)

                # Attempt to create the chat
                session.add(chat)
                session.commit()
            
                # Update chat settings
                chat.settings = chat_utils.update_settings(chat)

                # Return chat info
                result.data['uid'] = chat.uid
                result.data['register_timestamp'] = chat.register_timestamp
                result.data['settings'] = chat_utils.public_settings(chat)
                result.data['chat_title'] = chat.chat_title
                result.data['members'] = chat.members
                result.data['last_message'] = chat.messages[-1]

        return result

