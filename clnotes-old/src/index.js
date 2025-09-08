import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'js-cookie';
import './assets/index.css';
import App from './App';


if (process.env.NODE_ENV === 'development' || Cookies.get('ct')) {
    ReactDOM.render(<App />, document.getElementById('root'));
} else {
    window.location = '/login.html';
}




