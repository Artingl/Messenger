import typing as t


def get_api_methods() -> t.List[t.Type]:
    import web_api.V1.user_login
    import web_api.V1.user_register
    import web_api.V1.messenger_chats
    import web_api.V1.messenger_chat
    import web_api.V1.messenger_user_info

    return [
        web_api.V1.user_login.UserLogin,
        web_api.V1.user_register.UserRegister,
        web_api.V1.messenger_chats.MessengerChats,
        web_api.V1.messenger_chat.MessengerChat,
        web_api.V1.messenger_user_info.MessengerUserInfo,
    ]

