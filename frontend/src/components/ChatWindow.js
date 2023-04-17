import React from "react"
import SendIcon from '@mui/icons-material/Send';

import ChatMessage from './ChatMessage.js'
import TextField from "./TextField.js"
import Button from "./Button.js"

import { langGetString, langGetStringFormatted } from '../languages/Lang.js'

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
                events: {},
                recentIds: {
                    typing: 0,
                    newMessage: 0,
                }
            }
        };

        this.loadMessages()
        
        // set up events poll interval
        this.setupPolling()
    }

    reinstallPollInterval(name, callback)
    {
        // clear old interval
        if (this.state.pollEvents.events[name] !== undefined)
            clearInterval(this.state.pollEvents.events[name])

        let events = this.state.pollEvents.events
        events[name] = setInterval(callback, 60000)

        this.setState({ pollEvents: {
            events: events,
            recentIds: this.state.pollEvents.recentIds,
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
                events: {
                    typing: setInterval(() => {
                        this.pollTypingEvent()
                    }, 60000),
                    newMessage: setInterval(() => {
                        this.pollNewMessageEvent()
                    }, 60000),
                },
                recentIds: this.state.pollEvents.recentIds,
        } })

        this.pollTypingEvent()
        this.pollNewMessageEvent()
    }

    refreshPollId(name, id)
    {
        let recentIds = this.state.pollEvents.recentIds
        recentIds[name] = id

        this.setState({ pollEvents: {
            events: this.state.pollEvents.events,
            recentIds: recentIds
        } })
    }

    pollTypingEvent()
    {
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            { 
                // Check if the poll result is valid
                if (result.data.poll_result[0])
                {
                    this.refreshPollId("typing", result.data.poll_result[2])

                    // somebody is typing...
                    if (result.data.poll_result[1].uid !== this.props.app.state.userData.uid)
                    { // check that this event does not tell about ourself                    
                        // remove other timeout, if any running
                        if (this.state.typingTimer !== undefined)
                            clearTimeout(this.state.typingTimer)

                        this.setState({
                            typingMessage: langGetStringFormatted("somebody_typing", { nickname: result.data.poll_result[1].nickname }),
                            
                            // set timeout, so the typing message will be cleared if no new events produces
                            typingTimer: setTimeout(() => {
                                this.setState({ typingMessage: "", typingTimer: undefined })
                            }, 2500)
                        })
                    }
                }

                // reinstall interval
                this.reinstallPollInterval("typing", () => this.pollTypingEvent())
            }
            else {
                // close the chat on any error
                this.props.messenger.requestChats()
            }
        }, { 
            recent_id: this.state.pollEvents.recentIds.typing,
            method: "typing",
            uid: this.props.chatInfo.uid
        }, "/messenger/chat/poll", "GET", 60000)
        // note: last argument is timeout. needed to use polling
    }

    pollNewMessageEvent()
    {
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                // Check if the poll result is valid
                if (result.data.poll_result[0])
                {
                    this.refreshPollId("newMessage", result.data.poll_result[2])

                    // got new message
                    let message = result.data.poll_result[1].message
                    let side = message.sender_id === this.props.app.state.userData.uid ? "right" : "left"
                    this.addMessage(message, side)
                }

                // reinstall interval
                this.reinstallPollInterval("newMessage", () => this.pollNewMessageEvent())
            }
            else {
                // close the chat on any error
                this.props.messenger.requestChats()
            }
        }, { 
            recent_id: this.state.pollEvents.recentIds.newMessage,
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
            this.props.app.apiCall((isSuccess, result) => {
                if (!isSuccess)
                { // close the chat on any error
                    this.props.messenger.requestChats()
                }
            }, { uid: this.props.chatInfo.uid, method: "typing" }, "/messenger/chat", "POST")
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
                    this.props.messenger.displayErrorTimeout(langGetStringFormatted("error_unable_get_chat", {errorCode: result.code}), () => this.requestChats())
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

                <TextField hint={langGetString("type_message")} setValue={(msg) => this.typingMessage(msg)} />
                <Button icon={<SendIcon />} onClick={() => this.sendMessage()} />
            </div>
        </div>
    }
}

