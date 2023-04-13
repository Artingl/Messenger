import time
from datetime import datetime
import typing as t


# This class is used to send and poll events through API methods
# todo: check events expiring using multiprocessing
class Polling:
    def __init__(self, web_server):
        self.web_server = web_server
        
        self.events = {}

    # marker - some value that identifies this event
    # expiring - a time in milliseconds when this event will expire
    # data - data provided with this event
    def send(self, marker: str, expiring: int, data: t.Any) -> bool:
        self.events[marker] = {
            "expiring": time.time() * 1000 + expiring,
            "start_time": time.time()*1000,
            "data": [data]
        }

        return True
    
    # recent_timestamp - how old the event should be. Represented in timestamp milliseconds
    def poll(self, marker: str, recent_timestamp: int) -> list:
        event = None

        while not time.sleep(0.1):
            event = self.events.get(marker)

            if event is not None: 
                if event["expiring"] < time.time()*1000:
                    # event expired
                    self.events.pop(marker)
                elif event["start_time"] > recent_timestamp:
                    break

        return event["data"]



