import React, {Component} from 'react';
import {Provider} from 'mobx-react';
import store from './store';
import Share  from './Share'
import './assets/share.css'


class ShareApp extends Component {


    render() {

        return (

            <Provider {...store}>

                <Share/>

            </Provider>

        );
    }
}

export default ShareApp;
