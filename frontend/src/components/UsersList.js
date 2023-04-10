import React from "react";

import AddIcon from '@mui/icons-material/Add';

import TextField from './TextField.js';
import Button from './Button.js';

import './BaseComponent.css'

function UserElement(props) {
    return /*<li className="user-element" onClick={() => props.onClick()}>
            <img alt="avatar" src={props.avatar} className="nodrag" />
            <div id="title" className="noselect">{props.title}</div>
        </li>*/
}

export default class UsersList extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            userId: ""
        };
    }

    render()
    {
        return <div style={this.props.style} className={"base-component-div " + (this.props.className !== undefined ? this.props.className : "")}>
            <div id="users-list">
                <div id="user-add">
                    <TextField hint="User ID" setValue={(value) => this.setState({ userID: value })} />
                    <Button icon={<AddIcon />} />
                </div>

                <ul>
                    <UserElement
                        avatar="https://i.stack.imgur.com/E8aL3.jpg?s=128&g=1"
                        title="Hello world"
                    />
                </ul>
            </div>
        </div>
    }

}

