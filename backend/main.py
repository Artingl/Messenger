from server.web_server import WebServer
from database import db

import web_api
import config

from loguru import logger
import builtins


def __print(msg, **kwargs):
    logger.debug(msg, **kwargs)


if __name__ == "__main__":
    # replace print with custom log function
    builtins.print = __print

    # initialize database engine
    db.create_engine()

    # run webserver
    server = WebServer(config.SERVER_HOST, config.SERVER_PORT)
    server.run()

