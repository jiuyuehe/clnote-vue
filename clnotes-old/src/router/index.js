/**
 * Created by jiuyuehe on 2017/10/13.
 */


import React, {Component} from 'react';
import {HashRouter as Router, Route, Redirect} from 'react-router-dom'
import {inject, observer} from 'mobx-react';

import Nav from '../nav'
import Book from '../compoments/BookNav'
import Loading from '../compoments/Loading'
import ShareNav from '../compoments/ShareNav'

import {Layout} from 'antd'

const {Sider} = Layout;


@inject(stores => {

    let {
        getNotesByBook,
        notebooks,
        getNotebooks,


    } = stores.notes;


    return {
        getNotesByBook,
        notebooks,
        getNotebooks,

    }
})

@observer
export default class AppRouter extends Component {

    componentDidMount() {
        this.props.getNotebooks();
    }


    getNotes = (item) => {

        let p = {nbi: item.noteBookId}

        this.props.getNotesByBook(p);

    }


    render() {

        let {notebooks, getNotebooks} = this.props;


        return (

            <Router>
                <Layout style={{"height": "100%"}}>

                    <Sider width="220" style={{'backgroundColor': '#f5f5f5', 'borderRight': '1px solid lightgray'}}>

                        <Nav book={notebooks} getfn={getNotebooks}/>

                    </Sider>

                    <Layout>
                        <Route exact path="/" component={Loading}/>

                        <Route path="/loading/:nbi" component={Loading}/>
                        <Route path="/book/:nbi" component={Book}/>

                        <Route path="/share" component={ShareNav}/>


                    </Layout>

                </Layout>
            </Router>

        )
    }
}
