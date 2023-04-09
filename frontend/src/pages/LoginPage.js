import React from "react";
import $ from "jquery";

import TextField from '../components/TextField.js'
import Button from '../components/Button.js'

import './LoginPage.css'


export default class LoginPage extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            email: "",
            password: ""
        };
    }

    async loginEvent()
    {
        // Set button color to gray while waiting for the response from the server.
        // We have only one button, so this should work
        this.forceUpdate(() => $(".button").css('background-color', '#a2acacd1'))
        
        // get email and password from fields
        let email = this.state.email
        let password = this.state.password

        // check fields
        // todo: improve checking
        $("#hint").css("opacity", 0)
        if (email.length === 0 || password.length === 0)
        {
            $("#hint").html("Type full email and password")
            $("#hint").css("opacity", 1)
        }

        await this.props.app.login(email, password, (code) => {
            // check for errors
            $("#hint").css("opacity", 0)
            switch (code)
            {
                case 0: // login successful
                    break

                case -1: // internal error
                    $("#hint").html("Internal server error")
                    $("#hint").css("opacity", 1)
                    break

                case 1: // invalid user
                    $("#hint").html("Incorrect email or password")
                    $("#hint").css("opacity", 1)
                    break

                case 105: // unable to connect
                    $("#hint").html("Unable to connect to the server!")
                    $("#hint").css("opacity", 1)
                    break

                default: // unknown error
                    $("#hint").html("Unknown error")
                    $("#hint").css("opacity", 1)
                    break
            }
        })

        this.forceUpdate(() => $(".button").css('background-color', '#d6e0e0d1'))
    }

    render()
    {
        return (<div className={"login-page " + (this.props.className !== undefined ? this.props.className : "")} style={this.props.style}>
            <div className="background" />

            <form className="login-form">
                {/* Form title */}
                <div id="title">Log in to your account</div>

                {/* Status hint (shows errors, if any occurred) */}
                <div id="hint" style={{ opacity: 0 }}>...</div>

                {/* Email field */}
                <TextField
                    hint="Email"
                    setValue={(value) => this.setState({ email: value }) }
                    className="login-email"
                />
                
                {/* Password field */}
                <TextField
                    hint="Password"
                    setValue={(value) => this.setState({ password: value }) }
                    isPassword={true}
                    className="login-password"
                />

                {/* Log in button */}
                <Button
                    onClick={() => this.loginEvent()}
                    text="Log in"
                    className="login-button"
                />
            </form>
        </div>);
    }

}

