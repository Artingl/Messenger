from starlette.authentication import AuthCredentials, AuthenticationBackend, AuthenticationError, BaseUser

from app.misc import services

from typing import Dict, Any


class AuthUser(BaseUser):
    def __init__(self, fields: Dict[Any, Any]) -> None:
        self.fields = fields

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def display_name(self) -> str:
        return self.fields


class AuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        auth = {}

        # Set the value of auth based on connection origin
        match conn.scope['type']:
            case "websocket":
                if "token" not in conn.query_params:
                    return
                auth = conn.query_params["token"]

            case "http":
                if "authorization" not in conn.headers:
                    return
                auth = conn.headers["authorization"]
        

        # Check provided user's token
        auth_code, auth_data = await services.cross_service_call(
            "auth/token", "v1", services.Methods.GET, headers={ "authorization": auth }
        )

        if auth_code != 200:
            return

        return AuthCredentials(["authenticated"]), AuthUser(auth_data)
