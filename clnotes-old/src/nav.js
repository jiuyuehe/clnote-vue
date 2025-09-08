import React, {Component} from 'react';
import {NavLink, withRouter} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import {Menu, Icon, Modal, Input, Dropdown, message} from 'antd';

import {sysHandler}  from './utils/sysHandler'

const confirm = Modal.confirm;


@inject(stores => {

    let {

        notebooks,
        createNoteBook,
        createNote,
        delNoteBook,
    } = stores.notes;

    return {

        notebooks,
        createNoteBook,
        createNote,
        delNoteBook,
    }
})


@observer
class Nav extends Component {


    // componentDidMount() {
    //     this.props.getNotebooks();
    // }


    state = {
        visible: false,
        bookName: undefined,
        renameId: undefined,
    }

    emitEmpty = () => {
        this.userNameInput.focus();
        this.setState({bookName: ''});
    }

    onChangeUserName = (e) => {
        this.setState({bookName: e.target.value});
    }


    showModal = (item) => {
        this.setState({
            visible: true,
        });

        if (item) {
            this.setState({
                renameId: item.noteBookId,
            });
        }
    }


    handleOk = (e) => {

        let {history} = this.props;

        if (!this.state.bookName || this.state.bookName == '' || this.state.bookName.length == 0) {
            message.error('笔记本名称必须填写');

            return;
        }


        let p = {
            noteBookName: this.state.bookName,
            noteBookId: this.state.renameId,
        };

        return this.props.createNoteBook(p).then((res) => {

            if (this.state.renameId) {

            } else {
                history.push(`/book/${res.data.noteBookId}`)
            }

            this.handleCancel()
        });


    }

    handleCancel = (e) => {

        this.setState({
            visible: false,
            bookName: undefined,
            renameId: undefined,
        });
    }


    showDeleteConfirm(item) {

        let {delNoteBook, getfn} = this.props;

        confirm({
            title: '您确定要删除 \'' + item.noteBookName + '\' 笔记本',
            content: '删除以后将无法恢复',
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',

            onOk() {
                // console.log('OK');

                delNoteBook(item).then(res => {

                    console.log("-----res------", res);

                    if (res.status.startsWith('err_')) {

                        sysHandler.errHandler(res.status);

                    } else {
                        getfn();
                    }

                }).catch(err => {

                    console.log("----showDeleteConfirm-----");

                });

            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }


    newNote = (item) => {

        let {history, location, createNote, notebooks, getfn} = this.props;


        let p = {
            // noteBookId: bid,
            noteName: '未命名笔记'
        }

        let bid = location.pathname.split('/')[2]

        let nbid = undefined;

        try {

            nbid = parseInt(bid)

        } catch (err) {

        }

        if (nbid) {
            p.noteBookId = nbid;
        }

        createNote(p).then(res => {

            getfn();

            if (res.data) {
                history.push(`/book/${res.data.noteBookId}/note/${res.data.noteId}`)
            } else {
                console.log("error");
            }

        }).catch(err => {
            console.log("error ---", err);
        })

    }


    ckAt(item, match, location,) {

        let bid = location.pathname.split('/')[2]

        if (item.noteBookId == bid) {

            return true;
        } else {

            return false;
        }

    }

    reNameBook(item) {
        this.showModal(item);
    }


    menu = (
        <Menu>
            <Menu.Item>

                <a onClick={this.newNote}>新建笔记</a>

            </Menu.Item>

            <Menu.Item>
                <a onClick={this.showModal}>新建笔记本</a>
            </Menu.Item>

        </Menu>
    );

    showMemu(item, v) {

        console.log("----------showMemu------", v, item);

    }


    noteMenu = (item) => {
        return (
            <Menu>
                <Menu.Item key="b-1">
                    <a onClick={() => this.reNameBook(item)}>重命名</a>
                </Menu.Item>

                <Menu.Divider />
                <Menu.Item key="b-2">
                    <a onClick={() => this.showDeleteConfirm(item)}>删除</a>
                </Menu.Item>
            </Menu>
        );
    }


    render() {

        const {bookName} = this.state;

        const suffix = bookName ? <Icon type="close-circle" onClick={this.emitEmpty}/> : null;

        let {book} = this.props;

        return (
            <div className="nav">

                <div className="book-opt">

                    <Dropdown overlay={this.menu}>

                        <a className="ant-dropdown-link nav-add">

                            <Icon type="plus"/> 新增 <Icon type="down"/>

                        </a>

                    </Dropdown>
                </div>


                <ul>

                    {/*<li className="nav-list"><NavLink to="/recent"><Icon type="trademark"/> 最新的文档</NavLink></li>*/}

                    <li >
                        <NavLink to="/share" className='notebook-nav' activeClassName="active"> <Icon type="solution"/>
                            我的分享</NavLink>
                    </li>

                    <li >
                        <div className="nav-list">
                            <Icon type="book"/><span> 我的笔记本</span>
                        </div>
                        <ul className='note-over'>

                            {book.map(item => {
                                return (
                                    <li className="notebook-nav-h"
                                        key={item.noteBookId}>

                                        <NavLink
                                            to={`/loading/${item.noteBookId}`}
                                            activeClassName="active"
                                            isActive={this.ckAt.bind(this, item)}
                                            className='notebook-nav'>

                                            &nbsp; <img width={18} height={18}
                                                        style={{'position': 'relative', 'top': '4px'}}
                                                        src={require('./assets/note_yellow-min.png')} alt=""/>

                                            &nbsp; {item.noteBookName} {item.noteCount > 0 ?
                                            <span>({item.noteCount})</span> : ''}


                                            <Dropdown onVisibleChange={this.showMemu.bind(this, item) }
                                                      overlay={this.noteMenu(item)} trigger={['click']}>

                                                <span className="ant-dropdown-link note-book-btn">

                                                    <Icon type="caret-down"/>

                                                </span>

                                            </Dropdown>


                                        </NavLink>

                                    </li>
                                );
                            })}


                        </ul>
                    </li>

                    {/*<li className="nav-list">*/}

                    {/*<NavLink to="/del"> <Icon type="delete"/> 回收站</NavLink>*/}
                    {/*</li>*/}

                </ul>

                <Modal
                    title="新建笔记本"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                >

                    <Input style={{margin: '20px 0'}}
                           size="large"
                           placeholder="请输入笔记本名称"
                           prefix={<Icon type="book"/>}
                           suffix={suffix}
                           value={bookName}
                           onChange={this.onChangeUserName}
                           ref={node => this.userNameInput = node}
                           autoFocus="true"
                    />

                </Modal>


            </div>
        )
    }
}


export default  withRouter(Nav)