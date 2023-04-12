import React from "react"

import './ChatElement.css'

// list of colors for a letter avatar
const colors = ['#F08080', '#FFA07A',
                '#FFD700', '#32CD32',
                '#00FFFF', '#ADD8E6',
                '#87CEEB', '#BA55D3',
                '#FF69B4', '#CD5C5C',
                '#E6E6FA', '#F0E68C',
                '#98FB98', '#FFC0CB',
                '#DDA0DD', '#F0E68C'];

export default class ChatElement extends React.Component {

    render()
    {
        return <li className="chat-element nodrag noselect" onClick={() => this.props.onClick(this.props.chatId)} style={this.props.style}>
            {!this.props.avatarLetter && <img alt={this.props.chat_id + "_avatar"} src={this.props.avatar} className="nodrag" />}
            <div id="title" className="noselect">{this.props.title}</div>
            {this.props.avatarLetter && <p style={{ backgroundColor: colors[this.props.avatarLetter.charCodeAt(0) & 0xf] }} id="avatar-letter" className="noselect">{this.props.avatarLetter}</p>}
            <p id="description" className="noselect">{this.props.description}</p>
        </li>
    }
}

