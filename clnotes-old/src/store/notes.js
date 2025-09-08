/**
 * Created by jiuyuehe on 2017/10/13.
 */


import {observable, action} from 'mobx';
import {createFetch} from '../utils/fetch-creator';


class Store {

    // 笔记本
    @observable notebooks = [];

    @observable noteList = [];

    @observable selectBook = undefined;

    @observable noteDetail = undefined;

    @observable shareNoteList = [];

    @observable  lockEdit = false;


    @action  setSelectBook = (id) => {
        this.notebooks.map(item => {
            if (item.noteBookId === id) {
                this.selectBook = item;
            }
        })
    }


    @action  setNoteDetail = (obj) => {
        return this.noteDetail = obj;
    }


    @action updateNoteList = (p) => {
        this.noteList.map(item => {

            if (item.noteId == p.noteId) {
                item.noteName = p.noteName
            }

            return item;
        })
    }


    @action setNotebooks = obj => {

        this.notebooks = obj.map(item => {
            item.title = item.noteBookName;
            item.key = 'nb' + item.noteBookId;
            return item;
        });

    }


    @action setNotes = (obj) => {

        this.noteList = obj;
    }


    //  获取笔记本
    @action getNotebooks = (params) => {

        return createFetch({
            url: 'notebook/list',
        }).then(res => {

            if (res && res.data && res.data.rows.length) {
                this.setNotebooks(res.data.rows);
                return res.data;
            } else {
                this.setNotebooks([]);
                return {};
            }
        }).catch(err => {
            console.log("getNotebooks:", err);

        });


    };


    //  获取笔记列表
    @action getNotesByBook = (params) => {

        return createFetch({
            url: 'note/list',
            params: params
        }).then(res => {

            if (res && res.data && res.data.rows.length) {

                this.setNotes(res.data.rows);
                return res.data;

            } else {
                this.setNotes([]);
                return {};
            }

        }).catch(err => {
            console.log("getNotesByBook:", err);
        });
    };


    @action getNoteDetail = (params) => {
        return createFetch({
            url: 'note',
            params: params
        }).then(res => {

            if (res && res.data) {
                this.setNoteDetail(res.data);
            }
            return res;
        })
    }


    @action createNoteBook = params => {
        return createFetch({
            url: '/notebook',
            method: 'post',
            body: params
        }).then(res => {

            if (res.data) {

                if (params.noteBookId) {

                    this.notebooks = this.notebooks.map(book => {
                        if (book.noteBookId == params.noteBookId) {
                            book.noteBookName = params.noteBookName;
                        }
                        return book;
                    })

                } else {

                    this.notebooks = this.notebooks.concat([res.data]);
                }

                return res;
            }

        })
    }


    // 创建笔记
    @action createNote = (params, str) => {

        return createFetch({
            url: '/note',
            method: 'post',
            body: params
        }).then(res => {

            if (res && res.data) {

                if (str != 'update') {
                    this.noteList.unshift(res.data)
                }
            }
            return res;
        })
    }


    @action delNoteBook = params => {

        return createFetch({
            url: '/notebook',
            method: 'delete',
            body: params
        });

    }


    @action delNotes = params => {

        return createFetch({
            url: '/notes',
            method: 'delete',
            body: params
        });

    }


    @action shareNote = params => {
        return createFetch({
            url: '/note/share',
            method: 'post',
            body: params
        });
    }

    @action cancelShareNote = params => {
        return createFetch({
            url: '/note/share',
            method: 'delete',
            body: params
        });
    }

    // 获取我分享的笔记本列表
    @action getShareNotes = () => {
        return createFetch({
            url: '/note/share/list',
        }).then(res => {

            if (res.data) {
                this.setShareNotesList(res.data.rows)
                return res;
            }

        });
    }

    @action setShareNotesList = (list) => {

        this.shareNoteList = list;

    }


    // 分享的笔记详情获取
    @action getShareNoteDetail = (p) => {
        return createFetch({
            url: '/pub/note',
            params: p
        }).then(res => {

            if (res && res.data) {
                this.setNoteDetail(res.data);
            }

            return res;

        });
    }


}


export default new Store()
