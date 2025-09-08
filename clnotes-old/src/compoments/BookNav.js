/**
 * Created by jiuyuehe on 2017/10/16.
 */


import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import {Layout, Input, Icon} from 'antd';

import {NavLink, Route, withRouter} from 'react-router-dom'


import NewNote from './NewNote'


const {Sider} = Layout;
const Search = Input.Search;


@inject(stores => {

    let {

        noteList,
        getNotesByBook,
        delNotes,
    } = stores.notes;


    return {

        noteList,
        getNotesByBook,
        delNotes
    }
})


@observer
class BookNav extends Component {


    componentDidMount() {


        let {match} = this.props;

        this.props.getNotesByBook({nbi: match.params.nbi})
    }


    componentWillReceiveProps(nextProps) {

        let {match} = this.props;


        if (this.props.match.params.nbi !== nextProps.match.params.nbi) {

            this.props.getNotesByBook({nbi: nextProps.match.params.nbi})
        }

    }

    delNote(item) {

        let {delNotes, match, history} = this.props;

        let p = {
            noteIds: [item.noteId]
        }

        delNotes(p).then(res => {

            console.log('del note : ', res);

            history.push('/loading/' + match.params.nbi)
        });
    }

    searchNotes(value) {
        console.log('------searchNotes-----', value)

        let {match, getNotesByBook} = this.props;

        let p = {
            nbi: match.params.nbi,
        }

        if (value) {
            p.key = value;
        }

        this.props.getNotesByBook(p)
    }


    ckActive(item, match, location,) {

        let bid = location.pathname.split('/')[4];

        if (bid && item.noteId == bid) {

            return true;

        } else {

            return false;
        }

    }


    render() {


        let {create, match, noteList} = this.props;


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

                        {
                            noteList.map(item => {
                                return (
                                    <li className="note-item" key={item.noteId}>
                                        <NavLink to={`${match.url}/note/${item.noteId}`}
                                                 activeClassName="note-active"
                                                 isActive={this.ckActive.bind(this, item)}>

                                            <div className="note-name">

                                                <Icon type="file-text"/>

                                                {item.noteName || '未命名笔记'}

                                                <span className="note-name-opt" onClick={ () => this.delNote(item)}>
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
                        }

                    </ul>

                </Sider>

                <Layout>


                    <Route path={`${match.url}/note/:id`} component={NewNote}/>

                </Layout>

            </Layout>
        )
    }
}

export default  withRouter(BookNav);
