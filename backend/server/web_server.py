from web_api import api
from polling.polling import Polling

from flask_cors import CORS, cross_origin
from flask import Flask, Blueprint

import typing as t


# class wrapper on default flask web server
class WebServer:
    def __init__(self, host: str="127.0.0.1", port: int=80):
        self.__server = Flask(__name__)

        cors = CORS(self.__server)
        self.__server.config['CORS_HEADERS'] = 'Content-Type'

        self.host = host
        self.port = port

        self.pending_blueprints = []

        # Create API service and initialize all methods
        self.api_service = api.ApiService(self)
        self.api_service.init_service()

        # Events polling handler
        self.polling = Polling(self)
        
        # Register pending blueprints from init_service function.
        # note: As I understood this should be done in the same scope where flask was created.
        #           Otherwise register_blueprint function would fail.
        with self.__server.app_context():
            for blueprint in self.pending_blueprints:
                    self.__server.register_blueprint(blueprint)

        self.pending_blueprints.clear()

    def get_server(self):
        return self.__server

    def register_blueprint(self, blueprint: Blueprint):
        self.pending_blueprints.append(blueprint)

    def main(self):
        self.__server.run(host=self.host, port=self.port, threaded=True)

