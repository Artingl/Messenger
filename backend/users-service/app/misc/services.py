from fastapi import HTTPException

from typing import Union, Any
from enum import Enum

import aiohttp

INTERNAL_SERVICES_URLS = {
    "chats": "http://chats_service:8000/api",
    "auth": "http://auth_service:8000/api",
    "users": "http://users_service:8000/api",
}


class Methods(int, Enum):
    GET = 0
    POST = 1
    PUT = 2
    DELETE = 3



async def cross_service_call(route: str, route_version: str, route_method: Methods, headers={}, **kwargs: Any) -> Union[int, dict]:
    """Allows cross-service communication
    """

    # Get service name (prefixed in the route value before slash)
    service_name = route.split("/")[0]

    # Get service url
    service_url = INTERNAL_SERVICES_URLS[service_name] + f'/{route_version}/{route}'
    
    # Set custom headers
    headers['Content-Type'] = 'application/json'

    # Asynchronous service call
    async with aiohttp.ClientSession() as session:
        # Make a map of functions for every possible HTTP method
        methods_map = [
            session.get,
            session.post,
            session.put,
            session.delete
        ]

        # Call the service
        resp = await methods_map[route_method](service_url, headers=headers, **kwargs)
        json_data = await resp.json()

    return resp.status, json_data