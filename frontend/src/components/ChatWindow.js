import React from "react"

import ChatMessage from './ChatMessage.js'

import './ChatWindow.css'

export default class ChatWindow extends React.Component {
    render()
    {
        return <div className="chat-window" style={this.props.style}>
            <div id="chat-header">
                <p >{this.props.chatInfo.chat_title}</p>
                <div id="avatar" />
            </div>
            <ul>
                <ChatMessage side="right" />
                <ChatMessage side="right" />
                <ChatMessage side="right" />
                <ChatMessage side="left" />
                <ChatMessage side="right" />
            </ul>
            <div id="chat-message"></div>
        </div>
    }
}

