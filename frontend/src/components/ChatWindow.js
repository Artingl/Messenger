import React from "react"
import SendIcon from '@mui/icons-material/Send';

import ChatMessage from './ChatMessage.js'
import TextField from "./TextField.js"
import Button from "./Button.js"

import './ChatWindow.css'

export default class ChatWindow extends React.Component {
    constructor(props)
    {
        super(props)

        this.state = {
            messagesPool: [],
            currentMessage: "",
            timeSinceLastActivity: 0,
            typingMessage: "",
            typingTimer: undefined,

            pollEvents: {
                events: [],
                timestamp: {
                    // how old should be the event
                    typing: 0,
                    newMessage: 0,
                }
            }
        };

        this.loadMessages()
        
        // set up poll events interval
        this.setupPolling()
    }

    reinstallPollInterval(id, callback)
    {
        let events = this.state.pollEvents.events
        // clear aold interval
        if (events[id] !== undefined)
            clearInterval(events[id])


        // set up new interval
        events[id] = setInterval(() => {
            callback()
        }, 60000)

        this.setState({ pollEvents: {
            events: events,
            timestamp: this.state.pollEvents.timestamp,
        } })

        callback()
    }

    setupPolling()
    {
        // clear all previous intervals
        for (let i in this.state.pollEvents.events)
        {
            if (this.state.pollEvents.events[i] !== undefined)
                clearInterval(this.state.pollEvents.events[i])
        }
        
        // set up new intervals
        this.setState({ pollEvents: {
                events: [
                    setInterval(() => {
                        this.pollTypingEvent()
                    }, 60000),
                    setInterval(() => {
                        this.pollNewMessageEvent()
                    }, 60000),
                ],
                timestamp: this.state.pollEvents.timestamp,
        } })

        this.pollTypingEvent()
        this.pollNewMessageEvent()
    }

    refreshPollTimestamp(name)
    {
        this.setState({ pollEvents: {
            events: this.state.pollEvents.events,
            timestamp: {
                typing: new Date().getTime()
            }
        } })
    }

    pollTypingEvent()
    {
        this.props.app.apiCall((isSuccess, result) => {
            this.refreshPollTimestamp("typing")

            if (isSuccess)
            {
                // somebody is typing...
                if (result.data.poll_result[0].uid !== this.props.app.state.userData.uid)
                { // check that this event does not tell about ourself                    
                    // remove other timeout, if any running
                    if (this.state.typingTimer !== undefined)
                        clearTimeout(this.state.typingTimer)

                    this.setState({
                        typingMessage: `${result.data.poll_result[0].nickname} is typing...`,
                        
                        // set timeout, so the typing message will be cleared if no new events produces
                        typingTimer: setTimeout(() => {
                            this.setState({ typingMessage: "", typingTimer: undefined })
                        }, 2500)
                    })
                }
            }

            // reinstall interval (typing interval has id 0)
            this.reinstallPollInterval(0, () => this.pollTypingEvent())
        }, { 
            recent_timestamp: this.state.pollEvents.timestamp.typing,
            method: "typing",
            uid: this.props.chatInfo.uid
        }, "/messenger/chat/poll", "GET", 60000)
        // note: last argument is timeout. needed to use polling
    }

    pollNewMessageEvent()
    {
        this.props.app.apiCall((isSuccess, result) => {
            this.refreshPollTimestamp("new_message")

            if (isSuccess)
            {
                // got new message
                let message = result.data.poll_result[0].message
                let side = message.sender_id === this.props.app.state.userData.uid ? "right" : "left"
                this.addMessage(message, side)
            }

            // reinstall interval (new message interval has id 1)
            this.reinstallPollInterval(1, () => this.pollNewMessageEvent())
        }, { 
            recent_timestamp: this.state.pollEvents.timestamp.typing,
            method: "new_message",
            uid: this.props.chatInfo.uid
        }, "/messenger/chat/poll", "GET", 60000)

    }

    loadMessages()
    {
        // Iterate through all messages and add them
        for (let i in this.props.chatInfo.messages)
        {
            let message = this.props.chatInfo.messages[i]

            // The side variable is representing message side in the list.
            // If the messages sender is the current user, side is going to be right, otherwise left.
            let side = message.sender_id === this.props.app.state.userData.uid ? "right" : "left"

            this.addMessage(message, side)
        }
    }

    addMessage(messageData, side)
    {
        let pool = this.state.messagesPool
        pool.push(<ChatMessage side={side} messageData={messageData} />)
        
        // Update messages list
        this.setState({ messagesPool: pool })
    }

    typingMessage(message)
    { // this function is used to update current message contents and tell the server that we're typing a message now
        this.setState({ currentMessage: message })

        // send the activity request anly if a certain amount of time elapsed since last request
        const now = new Date().getTime()

        if (this.state.timeSinceLastActivity + 2000 < now)
        {
            // ignore the result because we don't really care about it
            this.props.app.apiCall((isSuccess, result) => { }, { uid: this.props.chatInfo.uid, method: "typing" }, "/messenger/chat", "POST")
            this.setState({ timeSinceLastActivity: now })
        }
    }

    sendMessage()
    {
        // Send message
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                // Message was sent
            }
            else {
                if (result.code === 1)
                { // unable to authenticate
                    this.props.messenger.props.app.logout()
                }
                else if (result.code === 2)
                { // chat does not exist
                    // Update chats list
                    this.props.messenger.requestChats()
                }
                else if (result.code === 3)
                { // user is not in the members list
                    // Update chats list
                    this.props.messenger.requestChats()
                }
                else if (result.code === 4)
                { // bad message
                    // todo: tell the user about this
                }
                else
                { // server error
                    this.displayErrorTimeout(`Unable to get chat info (Error code: ${result.code})`)
                }
            }
        }, {
            uid: this.props.chatInfo.uid,
            method: "send_message",
            message_content: this.state.currentMessage,
            attachments: []
        }, "/messenger/chat", "POST")

        // clear message
        //this.setState({ currentMessage: "" })
    }

    render()
    {
        return <div className="chat-window" style={this.props.style}>
            <div id="chat-header">
                <p >{this.props.chatInfo.chat_title}</p>
                <div id="avatar" />
            </div>

            <ul>{this.state.messagesPool}</ul>
            
            <div id="chat-message-input">
                <p id="typing-event">{this.state.typingMessage}</p>

                <TextField hint="Type a message..." setValue={(msg) => this.typingMessage(msg)} />
                <Button icon={<SendIcon />} onClick={() => this.sendMessage()} />
            </div>
        </div>
    }
}

