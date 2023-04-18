import time
from datetime import MAXYEAR, datetime
import typing as t

LAST_ID = 0


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
        global LAST_ID
        LAST_ID += 1

        self.events[marker] = {
            "expiring": time.time() * 1000 + expiring,
            "start_time": time.time()*1000,
            "data": data,
            "id": LAST_ID
        }

        return True
    
    def poll(self, marker: str, recent_id: int):
        # 20 seconds
        MAX_WAIT_TIME = 200

        event = None
        count = 0

        # Wait for event
        while not time.sleep(0.1) and count < MAX_WAIT_TIME:
            count += 1
            event = self.events.get(marker)

            if event is not None: 
                if event["expiring"] < time.time()*1000:
                    # event expired
                    self.events.pop(marker)
                elif event["id"] > recent_id:
                    break
                else:
                    event = None
        if event is None:
            return False, None, -1

        return True, event["data"], event["id"]



