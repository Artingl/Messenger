import React from 'react';
import $ from "jquery";

import LoginPage from './pages/LoginPage.js'
import MessengerPage from './pages/MessengerPage.js'

import PopupDialog from './components/PopupDialog.js'

import './App.css'


export default class App extends React.Component {
    constructor(props)
    {
        super(props);

        this.state = {
            server: "http://127.0.0.1:8080/",

            token: localStorage.getItem("token"),
            userData: {},

            isLoggedIn: false,
            loaderMessage: "",
            isLoading: true,

            popupState: 0,  // 0 - closed, 1 - opening, 2 - opened and waiting for action, 3 - closing
            popupChildren: undefined,
        };
    }

    componentDidMount()
    {
        this.authenticate()
    }

    authenticate()
    {
        this.setLoadingState(true, "Loading...")

        if (this.state.token === null || this.state.token === undefined)
        {
            this.setLoadingState(false)
            this.setState({ isLoggedIn: false })
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
        data['token'] = this.state.token

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
            this.setState({ isLoggedIn: true }))
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

    setLoadingState(state, msg)
    {
        this.setState({ isLoading: state, loaderMessage: msg })
    }

    setPopupDialog(jsx)
    {
        if (jsx === undefined)
        {
            // Update the flag to tell the popup it needs to play close animation
            this.setState({ popupState: 3 })
            
            // Wait for the animation
            setTimeout(() => this.setState({ popupState: 0, popupChildren: undefined }), 300);
        }
        else {
            // Update popup children so the dialog can appear
            this.setState({ popupState: 1, popupChildren: jsx })

            // Wait a bit for the animation to process and then update flag
            setTimeout(() => this.setState({ popupState: 2 }), 300)
        }
    }

    closePopupDialog()
    {
        // check that the dialog opened
        if (this.state.popupState === 2)
        {
            this.setPopupDialog(undefined)
        }
    }

    render()
    {
        return (<>

            {/* Div that disables clicking on the site while it is still loading */}
            {this.state.isLoading &&
                <div className="loader">{this.state.loaderMessage}</div>
            }

            {/* Note: style for this div makes its blurry when a loading is pending */}
            <div id="app" style={this.state.isLoading ? { filter: "blur(32px)", transform: "scale(1.3)" } : {}}>
                {/* Popup dialog. If you click on app-popup div, the dialog will close */}
                {this.state.popupChildren !== undefined &&
                            <div className="app-popup">
                                {/* The dialog */}
                                <PopupDialog
                                     style={this.state.popupState === 3 ? { animation: "popup-close-animation 0.2s cubic-bezier(0.85, 0, 0.15, 1) forwards" } :
                                            this.state.popupState === 1 ? { animation: "popup-open-animation 0.2s cubic-bezier(0.85, 0, 0.15, 1)"  } : {} }>
                                     {this.state.popupChildren}
                                 </PopupDialog>
                                 
                                 {/* Div to detect close click event */}
                                 <div style={{ zIndex: 11, position: "absolute", width: "100%", height: "100%" }} onClick={() => this.closePopupDialog()} />
                            </div>}

                {!this.state.isLoggedIn && <LoginPage app={this} />}
                {this.state.isLoggedIn && <MessengerPage app={this} />}
            </div>

        </>);
    }

};

