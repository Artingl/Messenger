import React from "react"

import './ChatMessage.css'

export default class ChatMessage extends React.Component {
    render()
    {
        return <li id={"chat-message-" + this.props.side} className="chat-message" style={this.props.style}>
            <div id={this.props.side}>In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia
</div>
        </li>
    }
}

