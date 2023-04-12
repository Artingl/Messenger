import React from "react"

import './ChatWindow.css'

export default class ChatWindow extends React.Component {
    render()
    {
        return <div className="chat-window" style={this.props.style}>
        </div>
    }
}

