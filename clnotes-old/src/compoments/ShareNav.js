/**
 * Created by jiuyuehe on 2017/10/16.
 */


import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import {Layout, Input, Icon, message} from 'antd';

import {NavLink, Route, withRouter} from 'react-router-dom'


import NewNote from './NewNote'


const {Sider} = Layout;
const Search = Input.Search;


@inject(stores => {

    let {

        getShareNotes,
        shareNoteList,
        cancelShareNote

    } = stores.notes;


    return {

        getShareNotes,
        shareNoteList,
        cancelShareNote
    }
})


@observer
class ShareNav extends Component {


    componentDidMount() {

        this.props.getShareNotes()
    }


    cancelShare(item) {

        let {cancelShareNote} = this.props;

        let p = {
            noteShareId: item.noteShareId
        }

        cancelShareNote(p).then(res => {
            message.success('取消分享成功')
            this.props.getShareNotes()
        });
    }

    searchNotes(value) {
        console.log('------searchNotes-----', value)

        let {match, getNotesByBook} = this.props;

        let p = {
            nbi: match.params.nbi,
        }

        if (value) {

            p.key = encodeURIComponent(value);
        }

        this.props.getNotesByBook(p)
    }


    ckActive(item, match, location,) {


        let bid = location.pathname.split('/')[3];

        if (bid && item.noteId == bid) {

            return true;

        } else {

            return false;
        }

    }


    render() {


        let {match, shareNoteList} = this.props;


        return (

            <Layout style={{"height": "100%"}}>

                <Sider width="320"
                       style={{'backgroundColor': 'white', "overflowY": 'auto', 'borderRight': '1px solid lightgray'}}>

                    <div className="note-opt">

                        <Search
                            placeholder="空为搜索全部"
                            style={{width: 200}}
                            onSearch={(value) => this.searchNotes(value)}
                        />

                    </div>

                    <ul>
                        {shareNoteList.length > 0 ?

                            shareNoteList.map(item => {
                                return (
                                    <li className="note-item" key={item.noteShareCode}>
                                        <NavLink to={`${match.url}/${item.noteShareCode}`}
                                                 activeClassName="note-active"
                                            // isActive={this.ckActive.bind(this, item)}
                                        >

                                            <div className="note-name">

                                                <Icon type="file-text"/>

                                                {item && item.Note.noteName || '未命名笔记'}

                                                <span className="note-name-opt" title="删除分享"
                                                      onClick={ () => this.cancelShare(item)}>
                                                    <Icon type="delete"/>
                                                </span>

                                            </div>

                                            <div
                                                className="note-desc">{item.NoteContent ? item.NoteContent.noteContentSummary : '无摘要'}</div>

                                            <div className="note-time">{item.createTime }</div>

                                        </NavLink>
                                    </li>
                                )
                            })

                            : <li className="note-item"> 无任何数据 </li>
                        }


                    </ul>

                </Sider>

                <Layout>


                    <Route path={`${match.url}/:noteShareCode`} component={NewNote}/>

                </Layout>

            </Layout>
        )
    }
}

export default  withRouter(ShareNav);
