import { ElMessage } from 'element-plus'

const errMsg = {
  "err_note_book_not_empty": '该笔记本下有笔记，故无法删除！'
}

export const sysHandler = {
  errHandler: (errStatus) => {
    ElMessage.error(errMsg[errStatus])
  }
}