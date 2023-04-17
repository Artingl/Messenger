from database import db, tables
from utils import basic_utils, user_utils, chat_utils

from sqlalchemy.orm.attributes import flag_modified

import web_api.api as api

import time


# This API method is has difference from MessageChats,
# because it is used toy control a single chat.

class MessengerChat(api.ApiBase):
    def __init__(self):
        super(MessengerChat, self).__init__(
                api.ApiVersions.V1,
                route='/messenger/chat',
                methods=["GET", "POST"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        # check that token was provided with the request
        if "token" not in request.fields or "uid" not in request.fields:
            return False

        # GET request - get chat info (messages, members, etc.)
        # POST request - update chat info (send message, update members, etc.)
        
        if request.method == "GET":
            return "messages_offset" in request.fields
        elif request.method == "POST":
            if "method" not in request.fields:
                return False
            
            if request.fields['method'] == "typing":
                pass  #  returns true
            elif request.fields['method'] == "send_message":
                return "message_content" in request.fields and "attachments" in request.fields

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

            # GET request - get chat info (messages, members, etc.)
            # POST request - update chat info (send message, update members, etc.)
            
            if request.method == "GET":
                # Try to get members info
                if not (members := session.query(tables.User).filter(tables.User.uid.in_(chat.members)).all()):
                    # Unable to get members info. Consider as an internal error for now
                    result.status_code = api.ApiResponse.Codes.INTERNAL_ERROR
                    result.code = -2
                    result.message = "Unable to update members list."
                    return result

                # Set members info
                result.data['members'] = []
                for member in members:
                    # Member info dict
                    values = {}
                    
                    member.settings = user_utils.update_settings(member)

                    values['nickname'] = member.nickname
                    values['login'] = member.login
                    values['uid'] = member.uid
                    values['register_time'] = member.register_timestamp
                    values['region'] = member.register_region
                    values['settings'] = user_utils.public_settings(member)

                    # Add members info to the result
                    result.data['members'].append(values)

                # Set other chat info and return
                messages_offset = int(request.fields['messages_offset'])

                result.data['uid'] = chat.uid
                result.data['chat_title'] = chat.chat_title
                result.data['register_timestamp'] = chat.register_timestamp
                result.data['settings'] = chat_utils.update_settings(chat)
                result.data['messages'] = chat.messages[messages_offset:messages_offset + 64]
            elif request.method == "POST":
                if request.fields['method'] == "typing":
                    if "last_typing_event" not in user.internal:
                        user.internal["last_typing_event"] = 0

                    if user.internal["last_typing_event"] + 1.9 > time.time():
                        # User sent the event too quick since the last one
                        result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                        result.code = 4
                        result.message = "Wait until next event."
                        return result
                    
                    # Update user's timer
                    user.internal["last_typing_event"] = time.time()
                    
                    flag_modified(user, "internal")
                    print(user.internal["last_typing_event"])
                    session.merge(user)
                    session.commit()

                    # Send event to polling hander
                    # marker: chatevent_{chat_id}_typing
                    request.webserver.polling.send(f"chatevent_{chat.uid}_typing", 2000, { "uid": user.uid, "nickname": user.nickname })
                elif request.fields['method'] == "send_message":
                    # Create new message
                    if not (message_info := chat_utils.generate_chat_message(request.fields["message_content"], [], user, chat)):
                        result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                        result.code = 4
                        result.message = "Unable to send message."
                        return result
                    
                    # Append new message and mark 'messages' field as modified
                    chat.messages.append(message_info)
                    flag_modified(chat, "messages")

                    # Update chat info
                    session.merge(chat)
                    session.commit()
        
                    # Send new message event
                    # marker: chatevent_{chat_id}_new_message
                    request.webserver.polling.send(f"chatevent_{chat.uid}_new_message", 3000, { "message": chat.messages[-1] })

        return result

