import React from "react"
import $ from 'jquery'

import SendIcon from '@mui/icons-material/Send';

import ChatMessage from './ChatMessage.js'
import TextField from "../ui/TextField.js"
import Button from "../ui/Button.js"

import { langGetString, langGetStringFormatted, langGetStringWithNumber } from '../../languages/Lang.js'

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

            onlineCounter: this.props.chatInfo.online,
        };

        // id of the last message in the chat
        this.lastMessageId = 0
        this.messagesOffset = 0

        // Indicates whether or not the chat fully loaded
        this.wholeChatLoaded = false

        // flag for identifying that loading request is sent to the server
        this.isLoadingMessages = false

        this.messagesIds = []
        this.loadMessages()

        // setup events for current chat
        this.props.messenger.eventsHandler.setupChatEvents(
            (name, data) => this.eventsHandler(name, data),
            this.props.chatInfo
        )
    }

    componentDidMount()
    {
        this.scrollToBottom()

        // setup scroll event
        $("#messages").on("scroll", () => this.messagesScrollHandler());
    }

    scrollToBottom()
    {
        $('#messages').animate({ scrollTop: $('#messages')[0].scrollHeight+256 }, 0)
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

                // check that the message is not already in the chat
                if (this.messagesIds.includes(message.id))
                {
                    break
                }

                const prevHeight = $("#messages").scrollTop()

                this.addMessage(message, side, () => {
                    // Scroll to bottom if the new message is in out view
                    let elem = $("#messages");
                    let maxScrollTop = elem[0].scrollHeight - elem.outerHeight();
                    let changedHeight = $("#messages").scrollTop() - prevHeight

                    if (maxScrollTop - changedHeight - 90 < $("#messages").scrollTop())
                        this.scrollToBottom()
                })
                break

            case "keyboard":
                // key press event
                this.keyPress(data)
                break

            case "destroy":
                // on chat closing
                this.destroy()
                break

            default: // invalid event
                break
        }
    }

    messagesScrollHandler()
    { // Handler for messages list scroll. This should load messages by offset when it is needed
        if ($("#messages").scrollTop() < 40 && !this.isLoadingMessages && !this.wholeChatLoaded)
        {   // load rest messages
            this.messagesOffset += 64
            this.loadMessagesByOffset()

            this.isLoadingMessages = true
        }
    }

    destroy()
    {
        $("#messages").off("scroll");
    }

    setTyping(data)
    {
        // check that this event does not tell about ourself
        if (data.uid === this.props.app.state.userData.uid)
            return

        if (this.state.typingTimer !== undefined)
            clearTimeout(this.state.typingTimer)

        if (data.uid === -1)
        { // server tells us that we need to abort typing event
            this.setState({
                typingMessage: "",
                typingTimer: undefined,
            })
        }
        else {
            this.setState({
                typingMessage: langGetStringFormatted("somebody_typing", { nickname: data.nickname }),
                
                // set timeout, so the typing message will be cleared if no new events produces
                typingTimer: setTimeout(() => {
                    this.setState({ typingMessage: "", typingTimer: undefined })
                }, 2500)
            })
        }
    }

    keyPress(event)
    {
        if (event.code === "Enter")
        {
            this.sendMessage()
        }
    }

    loadMessagesByOffset()
    {
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                let pool = this.state.messagesPool

                if (result.data.messages.length === 0)
                { // all messages have been already loaded
                    this.wholeChatLoaded = true
                }

                // show all messages that we got
                for (let i in result.data.messages)
                {
                    let message = result.data.messages[result.data.messages.length - i - 1]
                    let side = message.sender_id === this.props.app.state.userData.uid ? "right" : "left"

                    if (message.id === 0)
                    {
                        this.wholeChatLoaded = true
                    }

                    pool = [<ChatMessage side={side} timeFormat={this.props.app.getRegion()} messageData={message} />, ...pool]

                    this.messagesIds.push(message.id)
                }

                // previous list scroll height
                const prevHeight = $('#messages')[0].scrollHeight

                this.setState({ messagesPool: pool }, () => {
                    // update messages list scroll based on new loaded messages
                    $('#messages').animate({ scrollTop: $('#messages')[0].scrollHeight - prevHeight }, 0)

                    this.isLoadingMessages = false
                })
            }
            else {
                if (result.code === 1)
                { // unable to authenticate
                    this.props.app.logout()
                }
                else if (result.code === 2)
                { // chat does not exist
                    // Update chats list
                    this.messenger.requestChats()
                }
                else if (result.code === 3)
                { // user is not in the members list
                    // Update chats list
                    this.messenger.requestChats()
                }
                else
                { // server error
                    this.messenger.displayErrorTimeout(langGetStringFormatted("error_unable_get_chat", {errorCode: result.code}), () => this.props.messenger.requestChats())
                }
            }
        }, { uid: this.props.chatInfo.uid, messages_offset: this.messagesOffset }, "/messenger/chat", "GET")
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

    addMessage(messageData, side, callback)
    {
        let pool = this.state.messagesPool
        pool.push(<ChatMessage side={side} timeFormat={this.props.app.getRegion()} messageData={messageData} />)
        
        // Update messages list
        this.setState({ messagesPool: pool }, () => { if (callback !== undefined) callback() })

        this.messagesIds.push(messageData.id)
        this.lastMessageId = messageData.id + 1
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

        const theMessage = this.state.currentMessage

        // Send message
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                const messageData = {
                    id: this.lastMessageId,
                    data: theMessage,
                    attachments: [],
                    timestamp: new Date().getTime() / 1000
                }

                // Message was sent
                this.addMessage(messageData, "right")

                // tell the chats list that a new message was produced
                this.props.messenger.setNewMessage({ chat_id: this.props.chatInfo.uid, message: messageData })

                // scroll to bottom if the message was sent
                this.scrollToBottom()
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
                    this.props.messenger.displayErrorTimeout(langGetStringFormatted("error_unable_get_chat", {errorCode: result.code}), () => this.props.messenger.requestChats())
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
                <div id="left-info">
                    <p id="title">{this.props.chatInfo.chat_title}</p>
                    {this.state.typingTimer !== undefined && <p id="info">{this.state.typingMessage}</p>}
                    {this.state.typingTimer === undefined && <p id="info">{langGetStringWithNumber("people_online", this.state.onlineCounter)}</p>}
                </div>

                <div id="avatar" />
            </div>

            <ul id="messages">{this.state.messagesPool}</ul>
            
            <div id="chat-message-input">
                <TextField className="message-field" hint={langGetString("type_message")} setValue={(msg) => this.typingMessage(msg)} autofocus={true} />
                <Button icon={<SendIcon />} onClick={() => this.sendMessage()} />
            </div>
        </div>
    }
}

