from database import db

from server.web_server import WebServer
from server.webrct_server import WebRTCServer

import web_api
import config

from loguru import logger
import multiprocessing
import builtins


def __print(msg, *args, sep=' ', **kwargs):
    logger.debug(str(msg) + sep.join([str(i) for i in [""] + list(args)]), **kwargs)


if __name__ == "__main__":
    # replace print with custom log function
    builtins.print = __print

    # initialize database engine
    db.create_engine()

    # Initialize web server
    server = WebServer(config.webapi.HOST, config.webapi.PORT)
    web_process = multiprocessing.Process(target=server.main)

    # Initialize webrtc server
    webrtc_server = WebRTCServer(0, "")
    webrtc_process = multiprocessing.Process(target=webrtc_server.main)

    try:
        # Run all servers
        web_process.start()
        webrtc_process.start()

        # Infinite loop so the app does not exit right after using multiprocessing
        while True:
            pass
    finally:
        logger.info("Exit")
        web_process.kill()
        webrtc_process.kill()

