import React from "react"

import './PopupDialog.css'

export default class PopupDialog extends React.Component {
    render()
    {
        return <div className="popup-dialog">
            {this.props.children}
        </div>
    }
}

