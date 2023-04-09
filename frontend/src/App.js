import React from 'react';
import $ from "jquery";

import LoginPage from './pages/LoginPage.js'
import MessengerPage from './pages/MessengerPage.js'

import './App.css'


export default class App extends React.Component {
    constructor(props)
    {
        super(props);

        this.state = {
            server: "http://192.168.1.8:8080/",

            token: localStorage.getItem("token"),
            userData: {},

            isLoggedIn: false,
            isLoading: true,
        };
    }

    componentDidMount()
    {
        this.authenticate()
    }

    authenticate()
    {
        this.setState({ isLoading: true })

        if (this.state.token === null || this.state.token === undefined)
        {
            this.setState({ isLoading: false, isLoggedIn: false })
            return;
        }

        this.setState({ isLoggedIn: true })

        // try to login using token
        this.apiCall((isSuccess, result) => {
            if (isSuccess)
            {
                this.authenticateSuccess(result.data)
            }
            else {
                // unable to login
                localStorage.removeItem("token")
                window.location.reload()
            }
        }, { token: this.state.token }, "/user/login", "GET")
    }

    async apiCall(callback, data, apiMethod, httpMethod)
    {
        $.ajax({
            url: this.state.server + "/v1/" + apiMethod,
            type: httpMethod,
            data: data,
            success: (res) => { callback(true, res) }
        }).catch((err) => { callback(false, err) });
    }

    authenticateSuccess(data)
    {
        // save user data that we got with the response
        this.setState({ userData: data.settings })

        this.forceUpdate(() =>
            this.setState({ isLoading: false, isLoggedIn: true }))
    }

    async login(email, password, callback)
    {
        return $.ajax({
            url: this.state.server + "/v1/user/login",
            type: 'GET',
            data: { email: email, password: password },
            success: (res) => {
                // send result to the callback
                callback(res.code) 

                // check result code
                if (res.code === 0)
                {
                    // save token and reload the page
                    localStorage.setItem("token", res.data.token)
                    this.setState({ token: res.data.token })
                    window.location.reload()
                }
            }
        }).catch((err) => {
            if (err.responseJSON === undefined)
            {
                // 105 code always means that server is offline
                callback(105)
            }
            else callback(err.responseJSON.code)
        });
    }

    render()
    {
        return (<>

            {this.state.isLoading &&
                <div className="loader">Loading...</div>
            }

            <div id="app" style={{ filter: (this.state.isLoading ? "blur(32px)" : ""), transform: (this.state.isLoading ? "scale(1.3)" : "") }}>
                {!this.state.isLoggedIn && <LoginPage app={this} />}
                {this.state.isLoggedIn && <MessengerPage app={this} />}
            </div>

        </>);
    }

};

