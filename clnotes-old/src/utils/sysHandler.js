import {message} from 'antd'


const errMsg = {

    "err_note_book_not_empty": '该笔记本下有笔记，故无法删除！'

}


export const sysHandler = {

    errHandler: (errStatus) => {

        message.error(errMsg[errStatus]);

    },


}