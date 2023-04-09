import React from "react";

import './BaseComponent.css'

export default class Button extends React.Component
{

    render()
    {
        return <div style={this.props.style} className={(this.props.className !== undefined ? this.props.className : "")}>
            <input onChange={(evt) => this.props.setValue(evt.target.value)} placeholder={this.props.hint} type={this.props.isPassword ? "password" : "text"} className="base-component text-field" />
        </div>
    }

}

