import React from "react";

import './BaseComponent.css'

export default class Button extends React.Component
{
    render()
    {
        return <div style={this.props.style} className={"base-component-div " + (this.props.className !== undefined ? this.props.className : "")}>
            <input value={this.props.text} type={"button"} className={"base-component button"} />
            <div onClick={this.props.onClick} className="button-icon">{this.props.icon}</div>
        </div>
    }

}

