/**
 * Created by jiuyuehe on 2017/10/2.
 */


import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import copy from 'copy-to-clipboard';

import Yliwangeditor from '../utils/Yliwangeditor';

import {Modal, message, Button, Icon, Popover} from 'antd';


@inject(stores => {

    let {
        createNote,
        getNoteDetail,
        getShareNoteDetail,
        noteDetail,
        updateNoteList,
        shareNote

    } = stores.notes;


    return {

        createNote,
        getNoteDetail,
        getShareNoteDetail,
        noteDetail,
        updateNoteList,
        shareNote

    }
})


@observer
class NewNote extends Component {


    constructor(props) {
        super(props)

    }

    state = {
        save: true,
        lockEdit: true,
        title: undefined,
        visible: false,
        shareCode: undefined
    }

    componentDidMount() {

        this.noteTitle.focus();

        let {match, getNoteDetail, getShareNoteDetail, location} = this.props;

        let p = {}

        let self = this;

        if (location.pathname.indexOf('share') > 0) {

            p.nsc = match.params.noteShareCode

            getShareNoteDetail(p).then(res => {
                if (res && res.data) {
                    this.setState(
                        {
                            title: res.data.noteName || '未命名笔记',
                        },
                    );
                    self.editor && self.editor.refreshStr(res.data.NoteContent ? res.data.NoteContent.noteContentText : undefined);

                }
            })

        } else {

            p.ni = match.params.id;

            getNoteDetail(p).then(res => {

                if (res && res.data) {
                    this.setState(
                        {
                            title: res.data.noteName || '未命名笔记',
                        },
                    );
                    self.editor && self.editor.refreshStr(res.data.NoteContent ? res.data.NoteContent.noteContentText : undefined);

                }
            });
        }
    }


    componentWillReceiveProps(nextProps) {

        let {match, getNoteDetail, location, getShareNoteDetail} = this.props;


        let self = this;

        let p = {};

        if (location.pathname.indexOf('share') > 0) {

            if (match.params.noteShareCode !== nextProps.match.params.noteShareCode) {

                p.nsc = nextProps.match.params.noteShareCode

                getShareNoteDetail(p).then(res => {
                    if (res && res.data) {
                        this.setState(
                            {
                                title: res.data.noteName || '未命名笔记',
                            },
                        );
                        self.editor && self.editor.refreshStr(res.data.NoteContent ? res.data.NoteContent.noteContentText : undefined);
                    }
                })
            }

        } else {

            if (match.params.id !== nextProps.match.params.id) {

                p.ni = nextProps.match.params.id

                getNoteDetail(p).then(res => {

                    if (res && res.data) {
                        this.setState(
                            {
                                title: res.data.noteName || '未命名笔记',
                            },
                        );

                        self.editor && self.editor.refreshStr(res.data.NoteContent ? res.data.NoteContent.noteContentText : undefined);

                    }
                });
            }

        }

    }


    handleInputChange(event) {

        this.setState({title: event.target.value, save: false});

        // this.updateNote();
    }

    textChange = (html) => {

        this.setState({save: false});

        this.updateNote();
    }

    updateImage = (img) => {

        console.log("this is img:", img);

    }


    shareNoteLink = () => {

        let {noteDetail, shareNote} = this.props;

        shareNote({noteId: noteDetail.noteId}).then(res => {
            console.log("----shareNote------", res);

            this.setState({
                visible: true,
                shareCode: res.data.noteShareCode,
            })
        })

    }

    /***
     * 新建笔记
     * 自动保存
     */
    updateNote = () => {

        let {noteDetail, match} = this.props;

        if (!this.state.title) {

            let sc = undefined;

            let cont = this.editor.getText();

            if (cont.length > 10) {
                sc = cont.substr(0, 10)
            } else {
                sc = cont;
            }

            this.setState({title: sc});
        }

        let p = {
            noteId: parseInt(match.params.id),

            noteName: this.state.title,

            noteContent: this.editor.getHTML(),

            noteSummary: this.editor.getText().substr(0, 100)
        }

        let str = undefined;

        if (p.noteId) {
            str = 'update';
        }
        this.props.createNote(p, str).then(res => {
            this.props.updateNoteList(p);
            this.setState({save: true});
        })

    }

    copyUrl(shareUrl) {

        let f = copy(shareUrl);

        if (f) message.success('复制成功！')

    }

    render() {

        let {noteDetail} = this.props;
        let {title} = this.state;

        let host = window.location.host;

        let shareUrl = `http://${host}/noteshare.html?si=` + this.state.shareCode;


        let popcontent = (
            <div>
                <p>创建用户：{noteDetail && noteDetail.User ? noteDetail.User.realName : undefined}</p>
                <p>创建时间：{noteDetail && noteDetail.createTime}</p>
                <p>更新时间：{noteDetail && noteDetail.updateTime}</p>
            </div>
        );

        return (

            <div className="note-info">

                <div>


                    <input className="title-input"
                           placeholder="新建笔记本"
                           onChange={this.handleInputChange.bind(this)}
                           ref={v => this.noteTitle = v}
                           value={title}
                           onBlur={this.updateNote}
                           type="text"/>


                    <div style={{'float': 'right', 'marginTop': '20px'}}>

                        <Button className='note-btn' title='分享' shape="circle" onClick={this.shareNoteLink}
                                icon="share-alt"/>

                        {this.state.lockEdit ?


                            <Button className='note-btn' title='阅读模式' shape="circle" onClick={() => {
                                this.editor.disable(!this.state.lockEdit);
                                this.setState({
                                    lockEdit: false,
                                })
                                message.success('切换到阅读模式')
                            }} icon="eye-o"/> :

                            <Button className='note-btn' title='编辑模式' shape="circle" onClick={() => {
                                this.editor.disable(!this.state.lockEdit);
                                this.setState({
                                    lockEdit: true,
                                })
                                message.success('切换到编辑模式')
                            }} icon="edit"/>

                        }

                        <Popover content={popcontent} title="笔记详情" trigger="click">
                            <Button className='note-btn' shape="circle" icon="exclamation-circle-o"/>
                        </Popover>


                        {
                            this.state.save ?
                                <Button className='note-btn' icon="check-circle-o">已保存</Button>
                                :
                                <Button type="primary" className='note-btn' loading> 保存中</Button>
                        }

                    </div>


                </div>


                <Yliwangeditor ref={ref => this.editor = ref}
                               textChange={this.textChange} updateImage={this.updateImage}>
                </Yliwangeditor>


                <Modal
                    title="笔记分享"
                    visible={this.state.visible}
                    onOk={() => {

                        this.setState({
                            visible: false
                        })

                    }}
                    onCancel={() => {
                        this.setState({
                            visible: false
                        })
                    }}
                    okText="确认"
                    cancelText="取消"
                >
                    <p style={{'padding': '20px 0'}}>
                        {shareUrl}
                        <Button onClick={() => {
                            this.copyUrl(shareUrl)
                        }} style={{'float': 'right'}}> 复制 </Button>
                    </p>
                </Modal>


            </div>

        )
    }
}

export default NewNote;
