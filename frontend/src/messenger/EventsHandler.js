import { WebSocketConnection, WebSocketPacket, WebSocketPacketId } from './WebSocket.js'


// list of events needed by chats
const EVENTS = ["typing", "new_message"]


// Handles all messenger-related events using longpolling
export default class EventsHandler
{
    constructor(app, messenger)
    {
        this.app = app
        this.messenger = messenger

        this.eventsIds = {
            global: [],
            chat: [],
        }

        this.globalEvents = []
        this.websocketConnections = []

        this.currentChatCallback = undefined
        this.searchMessagesHandler = undefined
    }

    setup()
    {
        // subscribe for keyboard events
        this.app.subscribeKeyboardEvent((e) => {
            // check if any chats currently opened
            if (this.currentChatCallback !== undefined)
            {
                this.currentChatCallback("keyboard", e)
            }
        })

        // connect to websocket servers
        this.setupWebsocketConnection(() => {}, 'chats', 'v1')
    }

    uninstall()
    {
        // close all other websocket connections
        for (let i in this.websocketConnections)
        {
            this.websocketConnections[i].close()
        }
    }

    setupWebsocketConnection(callback, service, version)
    {
        // create new connection to the server
        this.websocketConnections = [
            new WebSocketConnection(service, version, this.app.state.userData)
        ]
    }

    pollSearchMessage(value)
    {
        if (this.searchMessagesHandler !== undefined)
            this.searchMessagesHandler(value)
    }

    unsubscribeSearchMessage()
    {
        this.searchMessagesHandler = undefined
    }

    subscribeSearchMessage(callback)
    { // only one search message subscriber is allowed
        this.searchMessagesHandler = callback
    }




    // legacy

    setupChatGlobalEvents(callback)
    {
        // cancel all other global events if any
        for (let i in this.globalEvents)
        {
            this.app.cancelLongpoll(this.globalEvents[i])
        }

        this.globalEvents = []

        for (let i in EVENTS)
        {
            // this.globalEvents.push(this.app.apiLongpoll((isSuccess, data) => {
            //     if (isSuccess)
            //     {
            //         callback(EVENTS[i], data)
            //     }
            // }, { 
            //     method: "global_" + EVENTS[i],
            //     uid: -1
            // }, "/messenger/chat/poll"))
        }
    }

    setupChatEvents(callback, chatInfo)
    {
        // clear events list
        this.eventsIds.chat = []
        this.currentChatCallback = callback

        for (let i in EVENTS)
        {
        //     this.eventsIds.chat.push(this.app.apiLongpoll((isSuccess, data) => {
        //         if (isSuccess)
        //         {
        //             callback(EVENTS[i], data)
        //         }
        //     }, { 
        //         method: EVENTS[i],
        //         uid: chatInfo.uid
        //     }, "/messenger/chat/poll"))
        }
    }

    // cancels all events that related to currently opened chat
    popChatEvents()
    {
        if (this.currentChatCallback !== undefined)
            this.currentChatCallback("destroy", undefined)

        for (let i in this.eventsIds.chat)
        {
            // this.app.cancelLongpoll(this.eventsIds.chat[i])
        }

        this.currentChatCallback = undefined
    }

}

