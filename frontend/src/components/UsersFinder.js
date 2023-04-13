import React from "react";

import TextField from './TextField.js';
import ChatElement from './ChatElement.js';

import './BaseComponent.css'
import './ChatElement.css'

export default class UsersFinder extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            userInfo: "",
            usersList: [],
            timeoutId: undefined,
        };
    }

    setUserInfo(info)
    {
        // stop the timeout (see below)
        clearTimeout(this.state.timeoutId)

        this.setState({ userInfo: info.trim() })

        // Try to find the user
        // Note: it waits some time in case the user is still typing in the field
        this.setState({ timeoutId: setTimeout(() => this.findUser(), 500) })
    }

    findUser()
    {
        if (this.state.userInfo === undefined || this.state.userInfo.length <= 1)
        {
            this.setState({ usersList: [] })
            return;
        }
        
        // request user by its info from the server
        this.props.app.apiCall((isSuccess, result) => {
            let resultArray = []

            if (isSuccess)
            {
                for (let i in result.data[0])
                {
                    let user = result.data[0][i]

                    // if user did not set an avatar, show their first letter from nickname
                    if (user.settings.avatar === "default")
                    {
                        resultArray.push(<ChatElement  
                            avatarLetter={user.nickname[0]}
                            title={user.nickname}
                            description={user.login}
                            chatId={user.uid}
                            onClick={() => this.createDialog(user)}
                            style={{ width: "100%" }}
                        />)
                    }
                    else { 
                        resultArray.push(<ChatElement  
                            avatar={user.settings.avatar}
                            title={user.nickname}
                            description={user.login}
                            chatId={user.uid}
                            onClick={() => this.createDialog(user)}
                            style={{ width: "100%" }}
                        />)
                    }
                }
            }
            else {
                if (result.code === 2)
                { // no users were found
                    resultArray.push(<p id="err-msg" className="noselect">No users were found</p>)
                }
                else if (result.code === 1)
                { // unable to authenticate using token
                    resultArray.push(<p id="err-msg" className="noselect">Unable to authenticate! Try to reload the page.</p>)
                }
                else {
                }
            }

            this.setState({ usersList: resultArray })
        }, { user_info_query: this.state.userInfo }, "/messenger/user/info", "GET")
    }

    createDialog(userData)
    {
        this.props.onUserClick(userData)
        this.props.app.closePopupDialog()
    }

    render()
    {
        return <div style={this.props.style} className={"base-component-div " + (this.props.className !== undefined ? this.props.className : "")}>
            <div id="users-list">
                <div id="user-add">
                    <TextField hint="User ID or Nickname" setValue={(value) => this.setUserInfo(value)} />
                </div>

                <ul>{this.state.usersList}</ul>
            </div>
        </div>
    }

}

