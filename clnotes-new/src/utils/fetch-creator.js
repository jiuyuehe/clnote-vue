import axios from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'

const URL_PREFIX = import.meta.env.DEV ? '/apps/' : '/apps/'

const checkStatus = response => {
  if (response.status < 300) {
    return response
  } else {
    throw response
  }
}

function createQuery(method, body) {
  const config = {
    method: method,
    headers: {
      ct: import.meta.env.DEV
        ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NyIsImVudElkIjoiMSIsInRpbWUiOjE1MTM3OTIzMzYsImtleSI6InZtM3RwbXRqNWQ4eiIsImlhdCI6MTUxMzc5MjMzNn0.LC9h-21Ml80bPjI9M_82SLvyN289ZsCotc4IctVtcCM'
        : Cookies.get('ct'),
      'cv': '3.5.0',
      'Accept': 'application/json',
      'Content-type': 'application/json;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0
    },
    withCredentials: true
  }
  
  if (body) {
    config.data = body
  }
  
  return config
}

export const createFetch = async (param) => {
  if (!param.method) {
    param.method = 'get'
  }
  
  let url = URL_PREFIX + param.url
  
  if (param.method.toLowerCase() === 'get' && param.params) {
    const paramsArray = []
    // 拼接参数
    Object.keys(param.params).forEach(key => paramsArray.push(key + '=' + param.params[key]))
    if (url.indexOf('?') === -1) {
      url += '?' + paramsArray.join('&')
    } else {
      url += '&' + paramsArray.join('&')
    }
  }

  try {
    const config = createQuery(param.method, param.body)
    config.url = url
    
    const response = await axios(config)
    checkStatus(response)
    return response.data
  } catch (err) {
    console.error("has err:", err)
    if (err.response && err.response.status === 403) {
      ElMessage.error('令牌过期，请重新登录！')
    }
    throw err
  }
}