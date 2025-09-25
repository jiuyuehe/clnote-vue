/**
 * Created by jiuyuehe on 2017/10/2.
 */
import React, {Component} from 'react'
import {message} from 'antd'

import E from 'wangeditor'
import Cookies from 'js-cookie';

import PropTypes from 'prop-types';


class Yliwangeditor extends Component {

    constructor(props) {
        super(props)

        // this.init = this.__init.bind(this)

        this.$edit = false
        this.$el = false

    }

    getHTML() {
        return this.$edit.txt.html();
    }


    getText() {
        return this.$edit.txt.text();
    }


    disable(val) {

        this.$edit.$textElem.attr('contenteditable', val)
    }


    changeContent = () => {

        let ec = document.getElementById("editContent");

        ec.style.height = document.documentElement.clientHeight - 96 + 'px';


    }


    componentDidMount() {

        const tools = this.refs.tools;
        const contents = this.refs.contents;

        let {textChange, updateImage} = this.props;

        let options = {
            uploadImgServer: '/upload/stream',
            uploadImgMaxLength: 10,
            debug: true,
            zIndex: 9,
            uploadImgMaxSize: 5 * 1024 * 1024,
            uploadFileName: 'file',
            // uploadImgParams: {fileName:'asdf'},
            onchange: textChange,
            menus: [
                'head',
                'bold',
                'italic',
                'underline',
                'strikeThrough',  // 删除线
                'foreColor',  // 文字颜色
                'backColor',  // 背景颜色
                'link',  // 插入链接
                'list',  // 列表
                'justify',  // 对齐方式
                'quote',  // 引用
                'image',  // 插入图片
                'table',  // 表格
                'video',  // 插入视频
                'code',  // 插入代码
                'undo',  // 撤销
                'redo'  // 重复
            ],
            uploadImgHeaders: {
                'ct': process.env.NODE_ENV !== 'development'
                    ? Cookies.get('ct') : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs',
                cv: '3.6.0',
                utt: 'fdfs',
                dft: 'public'
            },
            uploadImgHooks: {

                before: function (xhr, editor, files) {

                    console.log("before:", files);
                    // 图片上传之前触发
                    // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，files 是选择的图片文件

                    // 如果返回的结果是 {prevent: true, msg: 'xxxx'} 则表示用户放弃上传
                    // return {
                    //     prevent: true,
                    //     msg: '放弃上传'
                    // }
                },
                success: function (xhr, editor, result) {

                    console.log("success:", result);

                    if (result.status && result.status.startsWith("err_")) {
                        message.error("上传图片失败")
                    }

                    // 图片上传并返回结果，图片插入成功之后触发
                    // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，result 是服务器端返回的结果
                },

                fail: function (xhr, editor, result) {
                    // 图片上传并返回结果，但图片插入错误时触发
                    // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，result 是服务器端返回的结果

                    console.log("fail:", result);
                },
                error: function (xhr, editor) {
                    // 图片上传出错时触发
                    // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象
                    console.log("has error");
                },
                timeout: function (xhr, editor) {
                    // 图片上传超时时触发
                    // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象
                    console.log("has error  time  out");
                },

                customInsert: function (insertImg, result, editor) {

                    console.log("insertImg", insertImg, result);

                    // 图片上传并返回结果，自定义插入图片的事件（而不是编辑器自动插入图片！！！）
                    // insertImg 是插入图片的函数，editor 是编辑器对象，result 是服务器端返回的结果

                    // 举例：假如上传图片成功后，服务器端返回的是 {url:'....'} 这种格式，即可这样插入图片：
                    // let url =  window.location.protocol + '://' + window.location.host + ':' + window.location.port +"/"+result.fsFileName;
                    let url = window.location.origin + '/' + result.fsFileName;

                    insertImg(url)

                    updateImage(result.fsFileName);


                    // result 必须是一个 JSON 格式字符串！！！否则报错
                }
            }
        }

        this.$edit = new E(tools, contents);

        this.$edit.customConfig = options;

        this.$edit.create();

        this.changeContent();

        window.addEventListener('resize', this.changeContent)

    }

    //
    // componentWillReceiveProps(nextProps) {
    //
    //     let {htmlStr} = this.props;
    //     this.$edit.txt.html(htmlStr || '');
    //
    // }

    refreshStr(htmlStr) {
        this.$edit.txt.html(htmlStr || '');
    }


    componentWillUnmount() {
        window.removeEventListener('resize', this.changeContent)
    }


    render() {


        return (
            <div>

                <div id="editTool" ref="tools"></div>
                <div id="editContent" ref='contents'></div>

            </div>
        )
    }
}

Yliwangeditor.propTypes = {
    options: PropTypes.object,
}

export default Yliwangeditor