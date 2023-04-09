import React from "react"

import './ChatElement.css'

export default class ChatElement extends React.Component {
    render()
    {
        return <li className="chat-element nodrag noselect" onClick={() => this.props.onClick(this.props.chatId)} style={this.props.style}>
            <img alt={this.props.chat_id + "_avatar"} src={this.props.avatar} className="nodrag" />
            <div id="title" className="noselect">{this.props.title}</div>
            <p id="description" className="noselect">{this.props.description}</p>
        </li>
    }
}

