from web_api.V1 import v1

from flask import jsonify, request, Blueprint
from loguru import logger

import typing as t


class ApiVersions:
    V1 = "v1"


# Api response for API methods
class ApiResponse:
    class Codes:
        SUCCESS = 200

        NOT_FOUND = 404
        BAD_REQUEST = 400
        METHOD_NOT_ALLOWED = 405

        INTERNAL_ERROR = 500
        NOT_IMPLEMENTED = 501

    def __init__(self, status_code: int=Codes.SUCCESS, code: int=-1, message: str="", data: t.Dict[t.Any, t.Any]=dict()):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.data = data.copy()

    def construct(self):
        # build flask response
        return jsonify({
            "status_code": self.status_code,
            "code": self.code,
            "message": self.message,
            "data": self.data
        }), self.status_code


# Request data for API methods
class ApiRequest:
    def __init__(self, route: str, method: str, fields: t.Dict[t.Any, t.Any]):
        self.route = route
        self.fields = fields.copy()
        self.method = method


# Base for all webserver API methods
class ApiBase:
    def __init__(self, version: str=ApiVersions.V1, route: str='/', methods: t.List[str]=["GET"]) -> None:
        # remove first symbol from route if it is a slash
        if route[0] == '/':
            route = route[1:]
        
        self.version = version
        self.route = route
        self.methods = methods

    def attach(self, webserver):
        error_codes = [
            ApiResponse.Codes.NOT_FOUND,
            ApiResponse.Codes.METHOD_NOT_ALLOWED,
            ApiResponse.Codes.INTERNAL_ERROR,
        ]

        logger.info(f"Attaching API method '/{self.version}/{self.route}' using {', '.join(self.methods)}")

        # blueprint is used to allow using 'handler' function naming with all attached methods.
        #   I don't actually know if it is the best solution, but it should work.
        # note: route value is used to identify pseudo module in blueprint
        blueprint = Blueprint(self.route, __name__)
        
        # register the blueprint using server wrapper class
        webserver.register_blueprint(blueprint)

        # Register error handlers for the blueprint
        for eid in error_codes:
            blueprint.register_error_handler(eid, self.errorhandler)

        @blueprint.route(f"/{self.version}/{self.route}", methods=self.methods)
        def handler():
            # create request instance for the API method class
            api_request = ApiRequest(
                route=self.route,
                method=request.method,
                # todo: set data filed value based on http method
                fields=ApiBase.get_fields()
            )

            # attempt to validate api request
            if not self.validate_request(api_request):
                return ApiResponse(
                        status_code=ApiResponse.Codes.BAD_REQUEST,
                        message="Bad request."
                    ).construct()

            try:
                # execute methods
                return self.request(api_request).construct()
            except Exception as e:
                logger.exception(f"{self.route} error", e)

            return self.errorhandler(500)

    def errorhandler(self, eid):
        if not isinstance(eid, int):
            eid = eid.code

        return ApiResponse(
                status_code=eid,
                message="Unable to execute request."
        ).construct()
    
    # Returns fields values based on the http methods
    @classmethod
    def get_fields(cls) -> t.Dict[t.Any, t.Any]:
        method = request.method

        if method in ["GET", "POST"]:
            return request.args

        return {}

    # This function is used to validate api request values and should be called before 'request' function.
    def validate_request(self, request: ApiRequest) -> bool:
        return True

    # Will handle all incoming requests
    def request(self, request: ApiRequest) -> ApiResponse:
        # default response in case child class did not override it
        return ApiResponse(
                status_code=ApiResponse.Codes.NOT_IMPLEMENTED,
                message="Not implemented."
            )


# Default API service provider for webserver
class ApiService:
    def __init__(self, webserver):
        self.webserver = webserver

    def init_service(self):
        # add methods for all API versions
        self.add_methods(v1.get_api_methods())

        # add error handlers
        error_codes = [
            ApiResponse.Codes.NOT_FOUND,
            ApiResponse.Codes.METHOD_NOT_ALLOWED,
            ApiResponse.Codes.INTERNAL_ERROR,
        ]

        for eid in error_codes:
            self.webserver.get_server().register_error_handler(eid, ApiBase().errorhandler)

    def add_methods(self, methods: t.List[t.Type]):
        for method in methods:
            # create instance of ApiBase children and attach to the webserver
            method().attach(self.webserver)

