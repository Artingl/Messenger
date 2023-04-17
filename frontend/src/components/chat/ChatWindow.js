import React from "react"
import $ from 'jquery'

import SendIcon from '@mui/icons-material/Send';

import ChatMessage from './ChatMessage.js'
import TextField from "../ui/TextField.js"
import Button from "../ui/Button.js"

import { langGetString, langGetStringFormatted } from '../../languages/Lang.js'

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
        };

        this.loadMessages()

        // setup events for current chat
        this.props.messenger.eventsHandler.setupChatEvents(
            (name, data) => this.eventsHandler(name, data),
            this.props.chatInfo
        )
    }

    eventsHandler(name, data)
    {
        switch (name)
        {
            case "typing":
                // somebody is typing
                this.setTyping(data)
                break

            case "new_message":
                // new message event
                let message = data.message
                let side = message.sender_id === this.props.app.state.userData.uid ? "right" : "left"
                this.addMessage(message, side)
                break

            case "keyboard":
                // key press event
                this.keyPress(data)
                break

            default: // invalid event
                break
        }
    }

    setTyping(data)
    {
        // check that this event does not tell about ourself
        if (data.uid === this.props.app.state.userData.uid)
            return

        if (this.state.typingTimer !== undefined)
            clearTimeout(this.state.typingTimer)

        this.setState({
            typingMessage: langGetStringFormatted("somebody_typing", { nickname: data.nickname }),
            
            // set timeout, so the typing message will be cleared if no new events produces
            typingTimer: setTimeout(() => {
                this.setState({ typingMessage: "", typingTimer: undefined })
            }, 2500)
        })
    }

    keyPress(event)
    {
        if (event.code === "Enter")
        {
            this.sendMessage()
        }
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
        pool.push(<ChatMessage side={side} timeFormat={this.props.app.getRegion()} messageData={messageData} />)
        
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
        // check that the message is not empty
        if (this.state.currentMessage === "")
            return

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
        $(".text-field").val("")
        this.setState({ currentMessage: "" })
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

                <TextField className="message-field" hint={langGetString("type_message")} setValue={(msg) => this.typingMessage(msg)} />
                <Button icon={<SendIcon />} onClick={() => this.sendMessage()} />
            </div>
        </div>
    }
}

