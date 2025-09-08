/**
 * Created by jiuyuehe on 2017/10/2.
 */

import React, {Component} from 'react';
import {Icon} from 'antd'
import {inject, observer} from 'mobx-react';



@inject(stores => {

    let {
        noteList,
        notebooks,
        getNotesByBook,
        setSelectBook
    } = stores.notes;


    return {
        noteList,
        notebooks,
        getNotesByBook,
        setSelectBook

    }
})

@observer
class Loading extends Component {


    componentDidMount() {

        let {match, notebooks, history, setSelectBook} = this.props;


        // todo to deal default link;
        if (!match.params.nbi) {
            history.push(`/book`);
            return;
        }

        let p = {
            nbi: match.params.nbi,
        }

        this.props.getNotesByBook(p).then(res => {


            if (res.rows && res.rows.length > 0) {

                history.push(`/book/${res.rows[0].NoteBook.noteBookId}/note/${res.rows[0].noteId}`);

            } else {
                history.push(`/book/${match.params.nbi}`);
            }

        });

    }

    componentWillReceiveProps(nextProps) {

        let {match, history} = this.props;

        if (this.props.match.params.nbi !== nextProps.match.params.nbi) {


            this.props.getNotesByBook({nbi: nextProps.match.params.nbi}).then(res => {
                if (res && res.rows.length > 0) {
                    history.push(`/book/${res.rows[0].NoteBook.noteBookId}/note/${res.rows[0].noteId}`);
                } else {
                    history.push(`/book/${match.params.nbi}`);
                }

            });

        }

    }

    render() {

        return (

            <div style={{textAlign: 'center'}}><Icon type="loading"/></div>
        )
    }
}


export default Loading;
