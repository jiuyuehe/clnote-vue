import Cookies from 'js-cookie'

/**
 * 获取固定的ct值，优先级：Cookie > localStorage('ct') > localStorage('ngStorage-ct')
 * @returns {string} 去除引号后的ct值
 */
export function getFixedCt() {
  let ct = Cookies.get('ct') || localStorage.getItem('ct') || localStorage.getItem('ngStorage-ct')
  return ct && ct.replace(/^['"]|['"]$/g, '')
}

/**
 * 设置ct值到Cookie和localStorage
 * @param {string} ctValue - ct值
 */
export function setFixedCt(ctValue) {
  if (ctValue) {
    Cookies.set('ct', ctValue)
    localStorage.setItem('ct', ctValue)
  }
}

/**
 * 清除ct值
 */
export function clearFixedCt() {
  Cookies.remove('ct')
  localStorage.removeItem('ct')
  localStorage.removeItem('ngStorage-ct')
}
