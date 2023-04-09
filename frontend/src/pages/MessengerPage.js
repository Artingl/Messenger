import React from "react";
import $ from "jquery";

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';


import TextField from '../components/TextField.js'
import Button from '../components/Button.js'
import ChatElement from '../components/ChatElement.js'

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
            chats: [],
        };
    }
    
    componentDidMount()
    {
        this.updateChats()
    }

    updateChats()
    {
        let chats = []

        for (let i = 0; i < 20; i ++)
        {
            chats.push(<ChatElement
                onClick={(chatId) => this.openChat(chatId)}
                chatId={0}
                avatar="https://i.stack.imgur.com/E8aL3.jpg?s=128&g=1"
                title="Hello world"
                description="Did you know that you can use this messenger as a tool to communicate with your team members. This allows you to"
            />)
        }

        if (chats.length > 0)
            this.setState({ chats: chats })
        else {
            // add placehoolder that tells the user no chats available
            this.setState({ chats: [
                <li className="chat-placeholder noselect"><p>No chats available. Begin a new conversation with somebody.</p></li>
            ]})
        }
    }

    openChat(chat_id)
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
            
            {/* Menu panel. Hidden until its button is not clicked */}
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

                <ul style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>{this.state.chats}</ul>
            </div>

            {/* Current opened chat */}
            <div className="chat">
                <div className="chat-placeholder noselect">
                    <p>Open any chat...</p>
                </div>
            </div>

        </div>);
    }

}

