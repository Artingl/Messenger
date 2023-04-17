import React from "react";

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import TextField from '../components/ui/TextField.js'
import Button from '../components/ui/Button.js'
import UsersFinder from '../components/ui/UsersFinder.js'
import ChatElement from '../components/chat/ChatElement.js'
import ChatWindow from '../components/chat/ChatWindow.js'

import { langGetString, langGetStringFormatted } from '../languages/Lang.js'

import EventsHandler from '../messenger/EventsHandler.js'

import './MessengerPage.css'


export default class MessengerPage extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            isMenuShown: false,
            searchValue: "",

            chats: [],

            chatMessagesOffset: 0,
            chatOpened: false,
            chatInfo: [
            ],

            // wait interval on API error. It will grow up to 60 seconds on every error
            lastInterval: 5,
        };

        this.eventsHandler = new EventsHandler(this.props.app, this)
        this.eventsHandler.setup()
    }
    
    componentDidMount()
    {
        this.requestChats()
    }

    updateChats(chats)
    {
        let chatsPool = []

        for (let i in chats)
        {
            let chat = chats[i]

            chatsPool.push(<ChatElement
                onClick={(chatId) => this.openChat(chatId)}
                chatId={chat.uid}
                avatar={chat.settings.avatar}
                avatarLetter={chat.settings.avatar === "default" ? chat.chat_title[0] : undefined}
                title={chat.chat_title}
                description={chat.last_message.data}
            />)
        }

        if (chatsPool.length > 0)
            this.setState({ chats: chatsPool })
        else {
            // add placehoolder that tells the user no chats available
            this.setState({ chats: [
                <li className="chat-placeholder noselect"><p>{langGetString("no_chats_available")} <div onClick={() => this.createChat()} id="create-chat">{langGetString("somebody")}</div>.</p></li>
            ]})
        }
        
        this.props.app.setLoadingState(false)
    }

    createChat()
    {
        this.props.app.setPopupDialog(<>
            <form className="create-chat-dialog">
                <UsersFinder app={this.props.app} onUserClick={(userData) => this.requestChatCreate(userData)} />
            </form>
        </>)
    }

    displayErrorTimeout(message, callback)
    {
        const maxI = this.state.lastInterval
        for (let i = 0; i < this.state.lastInterval; i++)
        {
            setTimeout(() => {
                this.props.app.setLoadingState(true, message + ". " + langGetStringFormatted("timer_retrying", { time: maxI - i }))
            }, 1000 * i)
        }

        setTimeout(callback, 1000 * this.state.lastInterval)

        this.setState({ lastInterval: (this.state.lastInterval < 60 ? this.state.lastInterval + 5 : 60) })
    }

    requestChats()
    {
        this.props.app.setLoadingState(true, langGetString("loading_information"))
        
        // close chat if any open
        this.closeChat()
       
        // request chats from the server
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                this.updateChats(result.data[0])
            }
            else {
                if (result.code === 2)
                {   // chats not found
                    this.updateChats([])
                }
                else { // unable get result
                    this.displayErrorTimeout(langGetStringFormatted("error_unable_get_chats", {errorCode: result.code}), () => this.requestChats())
                }
            }
        }, { }, "/messenger/chats", "GET")
    }

    requestChatCreate(userData)
    {
        // Tell the server that we want to create a dialog. Then open it.
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                // Update chats list
                this.requestChats()
    
                // Open created chat
                this.openChat(result.data.uid)
            }
            else {
                // else statement would execute only when an internal server error occurred
                this.displayErrorTimeout(langGetStringFormatted("error_unable_send_request", {errorCode: result.code}), () => this.requestChats())
            }
        }, { members: [userData.uid], chatTitle: `${userData.nickname}, ${this.props.app.state.userData.nickname}` }, "/messenger/chats", "POST")
    }

    openChat(chatId)
    {
        // close chat if any open
        this.closeChat()

        // Get chat info
        this.props.app.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                // open the chat
                this.setState({ chatOpened: true, chatInfo: result.data })
            }
            else {
                if (result.code === 1)
                { // unable to authenticate
                    this.props.app.logout()
                }
                else if (result.code === 2)
                { // chat does not exist
                    // Update chats list
                    this.requestChats()
                }
                else if (result.code === 3)
                { // user is not in the members list
                    // Update chats list
                    this.requestChats()
                }
                else
                { // server error
                    this.displayErrorTimeout(langGetStringFormatted("error_unable_get_chat", {errorCode: result.code}), () => this.requestChats())
                }
            }
        }, { uid: chatId, messages_offset: this.state.chatMessagesOffset }, "/messenger/chat", "GET")
    }

    closeChat()
    {
        this.eventsHandler.popChatEvents()
        this.setState({ chatOpened: false, chatInfo: [], chatMessagesOffset: 0 })
    }

    showHideMenu()
    {
        this.setState({ isMenuShown: !this.state.isMenuShown })
    }

    render()
    {
        return (<div className={"messenger-page " + (this.props.className !== undefined ? this.props.className : "")} style={this.props.style}>
            <div id="bg" />
            
            {/* Menu panel. Hidden until its button is clicked */}
            <div
                className="left-bar"
                style={{
                    transform: "translateX(" + (this.state.isMenuShown ? "0px" : "-100%") + ")"
                }}>
                
                <Button
                    onClick={() => this.showHideMenu()}
                    style={{ width: 40, height: 40, margin: 10  }}
                    icon={<CloseIcon />}
                />
            </div>

            {/* List of chats. This div also contains search box with menu button */}
            <div className="chats-list">
                <div className="search-box" style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>
                    <Button
                        onClick={() => this.showHideMenu()}
                        style={{ width: 40, height: 40 }}
                        icon={<MenuIcon />}
                    />
                    
                    <TextField
                        style={{ width: "calc(80% - 30px)", height: 38, marginRight: 20, marginTop: -2 }}
                        setValue={(value) => this.setState({ serachValue: value })}
                        hint={langGetString("search")}
                    />
                </div>

                <ul style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>{this.state.chats}</ul>
            </div>

            {/* Current opened chat */}
            <div className="chat" style={this.state.chatOpened ? { zIndex: 2 } : {}}>
                {!this.state.chatOpened && <div className="chat-placeholder noselect">
                    <p>{langGetString("open_chat")}</p>
                </div>}
                {this.state.chatOpened && <ChatWindow messenger={this} app={this.props.app} chatInfo={this.state.chatInfo} />}
            </div>

        </div>);
    }

}

