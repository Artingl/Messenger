import React from "react";
import $ from "jquery";

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import TextField from '../components/TextField.js'
import Button from '../components/Button.js'
import ChatElement from '../components/ChatElement.js'
import UsersFinder from '../components/UsersFinder.js'
import ChatWindow from '../components/ChatWindow.js'

import './MessengerPage.css'


export default class MessengerPage extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            isMenuShown: false,
            searchValue: "",
            chatOpened: false,
            chatUsers: [],
            chats: [],

            // wait interval on API error. It will grow up to 60 seconds on every error
            lastInterval: 5,
        };
    }
    
    componentDidMount()
    {
        this.requestChats()
    }

    updateChats(chats)
    {
        let chatsPool = []
        console.log(chats)

        for (let i in chats)
        {
            let chat = chats[i]

            chatsPool.push(<ChatElement
                onClick={(chatId) => this.openChat(chatId)}
                chatId={0}
                avatar={chat.settings.avatar}
                avatarLetter={chat.settings.avatar === "default" ? chat.chat_title[0] : undefined}
                title={chat.chat_title}
                description="New"
            />)
        }

        if (chatsPool.length > 0)
            this.setState({ chats: chatsPool })
        else {
            // add placehoolder that tells the user no chats available
            this.setState({ chats: [
                <li className="chat-placeholder noselect"><p>No chats available. Begin a new conversation with <div onClick={() => this.createChat()} id="create-chat">somebody</div>.</p></li>
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

    requestChats()
    {
        this.props.app.setLoadingState(true, "Loading chats...")
        
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
                    // make pseudo timer in the loading state
                    const maxI = this.state.lastInterval
                    for (let i = 0; i < this.state.lastInterval; i++)
                    {
                        setTimeout(() => {
                            this.props.app.setLoadingState(true, "Unable to get chats list. Retrying in " + (maxI - i) + " seconds... (Error code: " + result.code + ")")
                        }, 1000 * i)
                    }

                    setTimeout(() => {
                        this.requestChats()
                    }, 1000 * this.state.lastInterval)

                    this.setState({ lastInterval: (this.state.lastInterval < 60 ? this.state.lastInterval + 5 : 60) })
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
                //this.setState({ chatOpened: true, chatUsers: [userData] })
            }
        }, { members: [userData.uid], chatTitle: `${userData.nickname}, ${this.props.app.state.userData.nickname}` }, "/messenger/chats", "POST")
    }

    openChat(chatId)
    {
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
                        style={{ width: "calc(80% - 30px)", height: 40, marginRight: 20 }}
                        setValue={(value) => this.setState({ serachValue: value })}
                        hint="Search"
                    />
                </div>

                {/* Button for creating new chats */}
                <AddIcon id="create-chat" onClick={() => this.createChat()} />

                <ul style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>{this.state.chats}</ul>
            </div>

            {/* Current opened chat */}
            <div className="chat" style={this.state.chatOpened ? { zIndex: 2 } : {}}>
                {!this.state.chatOpened && <div className="chat-placeholder noselect">
                    <p>Open any chat...</p>
                </div>}
                {this.state.chatOpened && <ChatWindow app={this.props.app} usersInfo={this.props.chatUsers} />}
            </div>

        </div>);
    }

}

