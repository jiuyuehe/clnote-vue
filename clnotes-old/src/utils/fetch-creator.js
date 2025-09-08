import 'isomorphic-fetch';
import Cookies from 'js-cookie';
import {message} from 'antd'

const URL_PREFIX = process.env.NODE_ENV === 'development' ? '/apps/' : '/apps/';

const checkStatus = response => {
    if (response.status < 300) {
        return response;
    } else {
        throw response;
    }
}

function createQuery(method, body) {
    const query = {
        'method': method,
        'headers': {
            ct: process.env.NODE_ENV !== 'development'
                ? Cookies.get('ct') : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NyIsImVudElkIjoiMSIsInRpbWUiOjE1MTM3OTIzMzYsImtleSI6InZtM3RwbXRqNWQ4eiIsImlhdCI6MTUxMzc5MjMzNn0.LC9h-21Ml80bPjI9M_82SLvyN289ZsCotc4IctVtcCM',
            'cv': '3.5.0',
            'Accept': 'application/json',
            'Content-type': 'application/json;charset=UTF-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': 0
        },
        'credentials': 'include'
    }
    if (body) {
        query.body = JSON.stringify(body);
    }
    return query;
}

export const createFetch = (param) => {
    if (!param.method) {
        param.method = 'get';
    }
    if (param.method === 'GET' || param.method === 'get') {
        if (param.params) {
            let paramsArray = [];
            //拼接参数
            Object.keys(param.params).forEach(key => paramsArray.push(key + '=' + param.params[key]))
            if (param.url.search(/\?/) === -1) {
                param.url += '?' + paramsArray.join('&')
            } else {
                param.url += '&' + paramsArray.join('&')
            }
        }
    }
    return fetch(URL_PREFIX + param.url, createQuery(param.method, param.body))
        .then(checkStatus)
        .then(res => res.json()).catch(err => {
            console.error("has err:", err)
            if (err.status == '403') {
                message.error('令牌过期，请重新登录！')
            }
        });
}
