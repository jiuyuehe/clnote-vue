import { defineStore } from 'pinia'
import { createFetch } from '../utils/fetch-creator'

export const useNotesStore = defineStore('notes', {
  state: () => ({
    // 笔记本
    notebooks: [],
    noteList: [],
    selectBook: undefined,
    noteDetail: undefined,
    shareNoteList: [],
    lockEdit: false,
    categories: [
      { id: 1, name: '工作', color: '#409eff' },
      { id: 2, name: '学习', color: '#67c23a' },
      { id: 3, name: '生活', color: '#e6a23c' },
      { id: 4, name: '项目', color: '#f56c6c' },
      { id: 5, name: '灵感', color: '#9c27b0' }
    ],
    selectedCategory: null
  }),

  actions: {
    setSelectBook(id) {
      this.notebooks.forEach(item => {
        if (item.noteBookId === id) {
          this.selectBook = item
        }
      })
    },

    setNoteDetail(obj) {
      return this.noteDetail = obj
    },

    updateNoteList(p) {
      this.noteList.forEach(item => {
        if (item.noteId == p.noteId) {
          item.noteName = p.noteName
        }
        return item
      })
    },

    setNotebooks(obj) {
      this.notebooks = obj.map(item => {
        item.title = item.noteBookName
        item.key = 'nb' + item.noteBookId
        return item
      })
    },

    setNotes(obj) {
      this.noteList = obj
    },

    //  获取笔记本
    async getNotebooks(params) {
      try {
        const res = await createFetch({
          url: 'notebook/list',
        })

        if (res && res.data && res.data.rows.length) {
          this.setNotebooks(res.data.rows)
          return res.data
        } else {
          this.setNotebooks([])
          return {}
        }
      } catch (err) {
        console.log("getNotebooks:", err)
      }
    },

    //  获取笔记列表
    async getNotesByBook(params) {
      try {
        const res = await createFetch({
          url: 'note/list',
          params: params
        })

        if (res && res.data && res.data.rows.length) {
          this.setNotes(res.data.rows)
          return res.data
        } else {
          this.setNotes([])
          return {}
        }
      } catch (err) {
        console.log("getNotesByBook:", err)
      }
    },

    async getNoteDetail(params) {
      try {
        const res = await createFetch({
          url: 'note',
          params: params
        })

        if (res && res.data) {
          this.setNoteDetail(res.data)
        }
        return res
      } catch (err) {
        console.log("getNoteDetail:", err)
      }
    },

    async createNoteBook(params) {
      try {
        const res = await createFetch({
          url: '/notebook',
          method: 'post',
          body: params
        })

        if (res.data) {
          if (params.noteBookId) {
            this.notebooks = this.notebooks.map(book => {
              if (book.noteBookId == params.noteBookId) {
                book.noteBookName = params.noteBookName
              }
              return book
            })
          } else {
            this.notebooks = this.notebooks.concat([res.data])
          }
          return res
        }
      } catch (err) {
        console.log("createNoteBook:", err)
      }
    },

    // 创建笔记
    async createNote(params, str) {
      try {
        const res = await createFetch({
          url: '/note',
          method: 'post',
          body: params
        })

        if (res && res.data) {
          if (str != 'update') {
            this.noteList.unshift(res.data)
          }
        }
        return res
      } catch (err) {
        console.log("createNote:", err)
      }
    },

    async delNoteBook(params) {
      try {
        return await createFetch({
          url: '/notebook',
          method: 'delete',
          body: params
        })
      } catch (err) {
        console.log("delNoteBook:", err)
      }
    },

    async delNotes(params) {
      try {
        return await createFetch({
          url: '/notes',
          method: 'delete',
          body: params
        })
      } catch (err) {
        console.log("delNotes:", err)
        throw err
      }
    },

    // 删除单个笔记
    async delNote(params) {
      try {
        return await createFetch({
          url: '/note',
          method: 'delete',
          body: params
        })
      } catch (err) {
        console.log("delNote:", err)
        throw err
      }
    },

    async shareNote(params) {
      try {
        const body = {
          noteId: params.noteId,
          accessPermission: params.accessPermission || 'readonly',
          shareScope: params.shareScope || 'public'
        }
        
        // 如果是私密分享，添加密码参数（支持 params.password 或 params.sharePwd）
        const pwd = params.password ?? params.sharePwd
        if (params.shareScope === 'private' && pwd) {
          body.password = pwd
        }
        
        // 如果设置了有效期，添加有效期参数
        if (params.expireTime) {
          body.expireTime = params.expireTime
        }
        
        return await createFetch({
          url: '/note/share',
          method: 'post',
          body: body
        })
      } catch (err) {
        console.log("shareNote:", err)
        throw err
      }
    },

    async cancelShareNote(params) {
      try {
        return await createFetch({
          url: '/note/share',
          method: 'delete',
          body: params
        })
      } catch (err) {
        console.log("cancelShareNote:", err)
      }
    },

    // 更新分享设置
    async updateShareNote(noteShareId, params) {
      try {
        return await createFetch({
          url: `/note/share/${noteShareId}`,
          method: 'put',
          body: params
        })
      } catch (err) {
        console.log("updateShareNote:", err)
        throw err
      }
    },

    // 获取我分享的笔记本列表
    async getShareNotes() {
      try {
        const res = await createFetch({
          url: '/note/share/list',
        })

        if (res.data) {
          this.setShareNotesList(res.data.rows)
          return res
        }
      } catch (err) {
        console.log("getShareNotes:", err)
      }
    },

    setShareNotesList(list) {
      this.shareNoteList = list
    },

    setSelectedCategory(categoryId) {
      this.selectedCategory = categoryId
    },

    addCategory(category) {
      this.categories.push({
        id: Date.now(),
        name: category.name,
        color: category.color || '#409eff'
      })
    },

    // 分享的笔记详情获取
    async getShareNoteDetail(p) {
      try {
        const res = await createFetch({
          url: '/pub/note',
          params: p
        })

        if (res && res.data) {
          this.setNoteDetail(res.data)
        }

        return res
      } catch (err) {
        console.log("getShareNoteDetail:", err)
      }
    },

    // 搜索笔记 (全屏搜索对话框用)
    async searchNotes(params) {
      try {
        const res = await createFetch({
          url: '/notes/search',
          params: params
        })

        return res
      } catch (err) {
        console.log("searchNotes:", err)
        throw err
      }
    },

    // 全局搜索笔记 (导航栏搜索用)
    async searchAllNotes(params) {
      try {
        const res = await createFetch({
          url: '/note/list',
          params: params
        })

        return res
      } catch (err) {
        console.log("searchAllNotes:", err)
        throw err
      }
    },

    // 批量移动笔记
    async moveNotes(params) {
      try {
        const res = await createFetch({
          url: '/notes/move',
          method: 'post',
          body: params
        })

        return res
      } catch (err) {
        console.log("moveNotes:", err)
        throw err
      }
    }
  }
})