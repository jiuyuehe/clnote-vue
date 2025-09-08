import React, {Component} from 'react';

import './assets/share.css'
import {inject, observer} from 'mobx-react';


@inject(stores => {

    let {

        getShareNoteDetail,
        noteDetail

    } = stores.notes;


    return {

        getShareNoteDetail,
        noteDetail

    }
})


@observer
class Share extends Component {

    componentDidMount() {

        let search = window.location.search;

        let sc = search.split('=')[1];

        console.log("sc-----------", sc);

        let p = {nsc: sc};

        this.props.getShareNoteDetail(p)
    }

    createMarkup() {

        let {noteDetail} = this.props;

        if (noteDetail && noteDetail.NoteContent) {
            return {__html: noteDetail.NoteContent.noteContentText};
        }

    }


    render() {

        let {noteDetail} = this.props;

        return (

            <div className="share">

                <div className="share-code">

                    <img src={require('./assets/qrcode.jpg')} alt=""/>

                </div>

                <div className="share-main">
                    <div className="share-name">{noteDetail && noteDetail.noteName}</div>


                    <ul className="ul-list">
                        <li><img style={{'height': '20px', 'width': '20px'}}
                                 src={noteDetail && noteDetail.User.userIconM}/>
                            作者：{noteDetail && noteDetail.User.realName}</li>
                        <li>分享于：{noteDetail && noteDetail.createTime}</li>
                    </ul>


                    <div className="share-content">


                        <div dangerouslySetInnerHTML={this.createMarkup()}/>


                    </div>
                </div>


            </div>





        );
    }
}

export default Share;
