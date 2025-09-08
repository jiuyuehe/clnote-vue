import 'babel-polyfill';
import React from 'react';
import Cookies from 'js-cookie';
import ReactDOM from 'react-dom';
import ShareApp  from './ShareApp'


if (process.env.NODE_ENV === 'development' || Cookies.get('ct')) {
    ReactDOM.render(<ShareApp/>, document.getElementById('root'));
} else {
    window.location = '/login.html?cb=' + window.location.href;
}








