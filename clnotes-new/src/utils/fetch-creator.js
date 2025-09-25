import axios from 'axios'
import Cookies from 'js-cookie'
import { getFixedCt } from './auth'
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
      ct: getFixedCt(),
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