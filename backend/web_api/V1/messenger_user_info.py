from database import db, tables
from utils import basic_utils, user_utils

from sqlalchemy import or_

import web_api.api as api

import bcrypt


class MessengerUserInfo(api.ApiBase):
    def __init__(self):
        super(MessengerUserInfo, self).__init__(
                api.ApiVersions.V1,
                route='/messenger/user/info',
                methods=["GET", "POST"]
        )

    def validate_request(self, request: api.ApiRequest) -> bool:
        # check that token was provided with the request
        if "token" not in request.fields:
            return False

        # GET request - find user by its info
        # POST request - update user info

        if request.method == "GET":
            if "user_info_query" not in request.fields:
                return False
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
                # Unable to find the user using token
                result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                result.code = 1
                result.message = "User does not exist."
                return result

            # Update settings
            user.settings = user_utils.update_settings(user)

            # GET request - find user by its info
            # POST request - update user info
            if request.method == "GET":
                # Try to find users using the info client sent us
                find_query = request.fields['user_info_query']

                # Convert query to int if it is possible
                find_int_query = -1
                if find_query.isdigit():
                    find_int_query = int(find_query)
                
                # Check that find_query is valid
                if len(find_query) <= 1:
                    result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                    result.code = 3
                    result.message = "user_info_query should be longer than 2 symbols."
                    return result

                # If find_query is prefixed with @, that means we should search only by logins
                if find_query.startswith("@"):
                    if not (found_users := session.query(tables.User).filter(tables.User.login == find_query).all()):
                        # Unable to find the user using the data from client
                        result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                        result.code = 2
                        result.message = "Did not find any user."
                        return result
                else:
                    if not (found_users := session.query(tables.User).filter(
                            or_(tables.User.nickname.contains(find_query),
                                tables.User.login.contains(find_query),
                                tables.User.uid == find_int_query)).all()):
                        # Unable to find the user using the data from client
                        result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                        result.code = 2
                        result.message = "Did not find any user."
                        return result

                # Prepare result
                data = []
    
                # Limit the list to 15 users long
                for found_user in found_users[:15]:
                    # If the client's profile is in this list, do not add them
                    if user.uid == found_user.uid:
                        continue

                    # User info dict
                    values = {}
                    
                    found_user.settings = user_utils.update_settings(found_user)

                    values['nickname'] = found_user.nickname
                    values['login'] = found_user.login
                    values['uid'] = found_user.uid
                    values['register_time'] = found_user.register_timestamp
                    values['region'] = found_user.register_region
                    values['settings'] = user_utils.public_settings(found_user)

                    # Add users info to the result
                    data.append(values)

                # The data list can be empty after the loop, so we need to check it
                if not data:
                    result.status_code = api.ApiResponse.Codes.BAD_REQUEST
                    result.code = 2
                    result.message = "Did not find any user."
                    return result

                result.data[0] = data
            else:
                pass
        return result

