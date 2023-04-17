import React from 'react';
import $ from "jquery";

import LoginPage from './pages/LoginPage.js'
import MessengerPage from './pages/MessengerPage.js'
import { loadLanguage } from './languages/Lang.js'

import PopupDialog from './components/PopupDialog.js'

import './App.css'


export default class App extends React.Component {
    constructor(props)
    {
        super(props);

        this.state = {
            server: "http://10.254.254.225:8080",

            token: localStorage.getItem("token"),
            userData: {},

            isLoggedIn: false,
            loaderMessage: "",
            isLoading: true,

            popupState: 0,  // 0 - closed, 1 - opening, 2 - opened and waiting for action, 3 - closing
            popupChildren: undefined,
        };

        this.language = "ru"
        this.longpoll = {
            lastId: 0,
            pool: {}
        }

        this.keyUpHandlers = []

        loadLanguage(this.language);
    }

    keyUpHandler(event) 
    {
        if (event.code === "Escape")
        {
            this.closePopupDialog()
        }

        // send key events to all subscribers
        for (let i in this.keyUpHandlers)
            this.keyUpHandlers[i](event)
    }

    componentDidMount()
    {
        // add events and authenticate
        $(document).on("keyup", e => this.keyUpHandler(e))

        this.authenticate()
    }

    componentWillUnmount()
    {
        // remove events
        $(document).off("keyup")
        this.keyUpHandlers = []
    }

    subscribeKeyboardEvent(callback)
    {
        this.keyUpHandlers.push(callback)
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

    logout()
    {
        localStorage.removeItem("token")
        window.location.reload()
    }

    getLanguage()
    {
        return this.language
    }

    getRegion()
    {
        return this.language + "-US"
    }

    cancelLongpoll(id)
    {
        if (this.longpoll.pool[id] === undefined)
            return

        // abort ajax
        this.longpoll.pool[id].request.abort()

        delete this.longpoll.pool[id]
    }

    apiLongpoll(callback, data, apiMethod, version)
    {
        const id = this.longpoll.lastId++
        
        if (version === undefined)
            version = "v1"

        data['token'] = this.state.token
        
        // set recent_id if it was not set
        if (data['recent_id'] === undefined)
            data['recent_id'] = -1

        this.longpoll.pool[id] = {
            state: true,
            request: $.ajax({
                url: this.state.server + "/" + version + apiMethod,
                type: "GET",
                data: data,
                contentType: "application/json",
                dataType: "json",
                timeout: 60000,
            }).done((res) => {
                data['recent_id'] = res.data.poll_result[2]
                callback(res.data.poll_result[0], res.data.poll_result[1])

                // call longpoll again if current event is not canceled
                if (this.longpoll.pool[id] !== undefined)
                {
                    this.apiLongpoll(callback, data, apiMethod, version)
                }
            }).fail((jqXHR, exception) => {
                // call longpoll again if current event is not canceled
                if (exception === "timeout" && this.longpoll.pool[id] !== undefined)
                {
                    this.apiLongpoll(callback, data, apiMethod, version)
                }
            })
        }

        return id
    }

    async apiCall(callback, data, apiMethod, httpMethod, version)
    {
        if (version === undefined)
            version = "v1"

        data['token'] = this.state.token

        // todo: remove double slashes in url
        $.ajax({
            url: this.state.server + "/" + version + apiMethod,
            type: httpMethod,
            data: (httpMethod === "GET" ? data : JSON.stringify(data)),
            contentType: "application/json",
            dataType: "json",
            success: (res) => { callback(res.code === 0, res) }
        }).catch((err) => {
            err = err.responseJSON;
            if (err === undefined || err === null || err.code === undefined)
            {
                err = {};
                err.code = -1;
            }

            callback(false, err)
        })
    }

    authenticateSuccess(data)
    {
        // save user data that we got with the response
        this.setState({ userData: data })
        this.forceUpdate(() =>
            this.setState({ isLoggedIn: true }))
    }

    async login(email, password, callback)
    {
        // todo: change to apiCall method
        return $.ajax({
            url: this.state.server + "/v1/user/login",
            type: 'GET',
            contentType: "application/json",
            dataType: "json",
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

