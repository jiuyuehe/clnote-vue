<template>
  <div class="nav">
    <!-- Top section: App name (120px height) -->
    <div class="app-header">
      <h3 class="app-title">云笔记</h3>
    </div>

    <!-- Bottom section: Action buttons and navigation -->
    <div class="nav-content">
      <!-- Search input -->
      <div class="search-section">
        <el-input
          v-model="searchText"
          placeholder="搜索笔记..."
          :prefix-icon="Search"
          clearable
          size="small"
          class="nav-search-input"
          @input="handleSearchInput"
          @clear="handleSearchClear"
          @keyup.enter="performSearch"
        >
          <template #suffix v-if="isSearchMode">
            <el-button
              type="text"
              size="small"
              @click="exitSearchMode"
              class="search-cancel-btn"
            >
              取消
            </el-button>
          </template>
        </el-input>
        
        <!-- 搜索状态指示 -->
        <div v-if="isSearchMode" class="search-status">
          <span v-if="isSearching" class="search-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在搜索...
          </span>
          <span v-else-if="searchResults.length > 0" class="search-count">
            找到 {{ searchResults.length }} 条结果
          </span>
          <span v-else-if="searchText.trim()" class="search-empty">
            未找到相关笔记
          </span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <el-button 
          type="primary" 
          size="default" 
          :icon="Plus" 
          @click="newNote"
          class="nav-button"
        >
          新建笔记
        </el-button>
        <el-button 
          type="default" 
          size="default" 
          :icon="Notebook" 
          @click="showModal()"
          class="nav-button"
        >
          新建笔记本
        </el-button>
        <el-button 
          type="default" 
          size="default" 
          :icon="Share" 
          @click="goToShare"
          class="nav-button"
        >
          我的分享
        </el-button>
        <!-- <el-button 
          type="default" 
          size="default" 
          :icon="Search" 
          @click="showSearchModal"
          class="nav-button"
        >
          搜索笔记
        </el-button> -->
      </div>

      <!-- Notebook list with notes or search results -->
      <div class="notebook-section">
        <!-- 普通模式：显示笔记本列表 -->
        <template v-if="!isSearchMode">
          <div class="section-title">
            <el-icon><Notebook /></el-icon>
            <span>我的笔记本</span>
          </div>
          <div class="notebook-tree">
            <div v-for="notebook in notebooks" :key="notebook.noteBookId" class="notebook-group">
              <!-- Notebook header -->
              <div 
                class="notebook-header"
                :class="{ 'active': isNotebookActive(notebook), 'expanded': isNotebookExpanded(notebook) }"
                @click="toggleNotebook(notebook)"
              >
                <div class="notebook-main">
                  <el-icon class="expand-icon">
                    <ArrowRight v-if="!isNotebookExpanded(notebook)" />
                    <ArrowDown v-else />
                  </el-icon>
                  <el-icon><Notebook /></el-icon>
                  <span class="notebook-name">{{ notebook.noteBookName }}
                    <span v-if="notebook.noteCount > 0" class="note-count">({{ notebook.noteCount }})</span>
                  </span>
                </div>

                <el-dropdown
                  @command="(command) => handleNoteBookCommand(command, notebook)"
                  trigger="click"
                  class="notebook-dropdown"
                  @click.stop
                >
                  <span class="dropdown-trigger">
                    <el-icon><MoreFilled /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item divided command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <!-- Notes list for expanded notebook -->
              <div v-if="isNotebookExpanded(notebook)" class="notes-list">
                <div
                  v-for="note in getFilteredNotesForNotebook(notebook.noteBookId)"
                  :key="note.noteId"
                  class="note-item"
                  :class="{ 'active': selectedNoteId === note.noteId }"
                  @click="selectNote(note)"
                >
                  <div class="note-title">{{ note.noteName }}</div>
                  <div class="note-date">{{ formatDate(note.updateTime) }}</div>
                </div>
                <div v-if="getFilteredNotesForNotebook(notebook.noteBookId).length === 0" class="no-notes">
                  暂无笔记
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 搜索模式：显示搜索结果 -->
        <template v-else>
          <div class="section-title">
            <el-icon><Search /></el-icon>
            <span>搜索结果</span>
          </div>
          <div class="search-results-list">
            <div
              v-for="note in searchResults"
              :key="note.noteId"
              class="note-item search-result-item"
              :class="{ 'active': selectedNoteId === note.noteId }"
              @click="selectSearchNote(note)"
            >
              <div class="note-title">{{ note.noteName }}</div>
              <div class="note-info">
                <span class="note-notebook">{{ note.noteBookName }}</span>
                <span class="note-date">{{ formatDate(note.updateTime) }}</span>
              </div>
            </div>
            <div v-if="searchResults.length === 0 && searchText.trim() && !isSearching" class="no-notes">
              未找到相关笔记
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 新建笔记本对话框 -->
    <el-dialog v-model="visible" title="新建笔记本" width="400px">
      <el-input
        v-model="bookName"
        size="large"
        placeholder="请输入笔记本名称"
        :prefix-icon="Notebook"
        ref="bookNameInput"
        @keyup.enter="handleOk"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleOk">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 全屏搜索对话框 -->
    <el-dialog 
      v-model="showSearchDialog" 
      title="搜索笔记" 
      :fullscreen="true"
      class="search-dialog"
    >
      <div class="search-content">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入笔记名称或内容关键词..."
          :prefix-icon="Search"
          size="large"
          @input="handleSearch"
          @keyup.enter="handleSearch"
          clearable
          class="search-input"
        />
        
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="results-header">搜索结果 ({{ searchResults.length }})</div>
          <div 
            v-for="note in searchResults" 
            :key="note.noteId"
            class="search-result-item"
            @click="selectSearchResult(note)"
          >
            <div class="result-title">{{ note.noteName }}</div>
            <div class="result-info">
              <span class="result-notebook">{{ note.noteBookName }}</span>
              <span class="result-date">{{ formatDate(note.updateTime) }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="searchKeyword && hasSearched" class="no-results">
          <el-empty description="未找到相关笔记" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotesStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Notebook, Search, Share, MoreFilled, ArrowRight, ArrowDown, Loading } from '@element-plus/icons-vue'
import { sysHandler } from '@/utils/sysHandler'

const router = useRouter()
const route = useRoute()
const notesStore = useNotesStore()

// 响应式数据
const visible = ref(false)
const bookName = ref('')
const renameId = ref(undefined)
const bookNameInput = ref(null)
const showSearchDialog = ref(false)
const searchKeyword = ref('')
const hasSearched = ref(false)

// 新增的响应式数据
const searchText = ref('')
const selectedNoteId = ref(null)
const expandedNotebooks = ref(new Set())
const notesByNotebook = ref({})

// 搜索相关状态
const isSearchMode = ref(false) // 是否处于搜索模式
const searchResults = ref([]) // 全局搜索结果
const isSearching = ref(false) // 是否正在搜索
let searchTimer = null // 搜索防抖定时器

// 计算属性
const notebooks = computed(() => notesStore.notebooks)

// 获取当前笔记本的笔记列表
const getFilteredNotesForNotebook = (notebookId) => {
  const notes = notesByNotebook.value[notebookId] || []
  // 在搜索模式下不进行本地过滤
  if (isSearchMode.value) {
    return notes
  }
  
  if (!searchText.value.trim()) {
    return notes
  }
  return notes.filter(note => 
    note.noteName.toLowerCase().includes(searchText.value.toLowerCase())
  )
}

// 搜索输入处理
const handleSearchInput = (value) => {
  if (!value.trim()) {
    exitSearchMode()
    return
  }
  
  // 进入搜索模式
  isSearchMode.value = true
  
  // 防抖搜索
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  searchTimer = setTimeout(() => {
    performSearch()
  }, 500) // 500ms防抖
}

// 清空搜索
const handleSearchClear = () => {
  exitSearchMode()
}

// 执行搜索
const performSearch = async () => {
  if (!searchText.value.trim()) {
    exitSearchMode()
    return
  }
  
  isSearching.value = true
  
  try {
    const res = await notesStore.searchAllNotes({ key: searchText.value })
    
    if (res && res.data && res.data.rows) {
      // 处理搜索结果，添加笔记本名称
      searchResults.value = res.data.rows.map(note => ({
        noteId: note.noteId,
        noteName: note.noteName,
        noteBookName: note.NoteBook ? note.NoteBook.noteBookName : '未知笔记本',
        noteBookId: note.NoteBook ? note.NoteBook.noteBookId : null,
        updateTime: note.updateTime,
        noteContent: note.NoteContent ? note.NoteContent.noteContentText : ''
      }))
    } else {
      searchResults.value = []
    }
  } catch (err) {
    console.error('搜索失败:', err)
    ElMessage.error('搜索失败')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 退出搜索模式
const exitSearchMode = () => {
  isSearchMode.value = false
  searchText.value = ''
  searchResults.value = []
  isSearching.value = false
  
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

// 选择搜索结果中的笔记
const selectSearchNote = (note) => {
  selectedNoteId.value = note.noteId
  
  if (note.noteBookId) {
    router.push(`/book/${note.noteBookId}/note/${note.noteId}`)
  } else {
    // 如果没有笔记本ID，尝试找到第一个笔记本
    if (notebooks.value.length > 0) {
      router.push(`/book/${notebooks.value[0].noteBookId}/note/${note.noteId}`)
    }
  }
}

// 检查笔记本是否展开
const isNotebookExpanded = (notebook) => {
  return expandedNotebooks.value.has(notebook.noteBookId)
}

// 检查笔记本是否激活（当前选中的笔记本）
const isNotebookActive = (notebook) => {
  const bid = route.params.nbi
  return notebook.noteBookId == bid
}

// 切换笔记本展开/收起状态
const toggleNotebook = async (notebook) => {
  const notebookId = notebook.noteBookId
  
  if (expandedNotebooks.value.has(notebookId)) {
    expandedNotebooks.value.delete(notebookId)
  } else {
    expandedNotebooks.value.add(notebookId)
    
    // 如果还没有加载过这个笔记本的笔记，则加载
    if (!notesByNotebook.value[notebookId]) {
      try {
        await loadNotesForNotebook(notebookId)
      } catch (err) {
        console.error('加载笔记失败:', err)
      }
    }
  }
}

// 加载指定笔记本的笔记
const loadNotesForNotebook = async (notebookId) => {
  try {
    const res = await notesStore.getNotesByBook({ nbi: notebookId })
    if (res && res.rows) {
      notesByNotebook.value[notebookId] = res.rows
    } else {
      notesByNotebook.value[notebookId] = []
    }
  } catch (err) {
    console.error('获取笔记列表失败:', err)
    notesByNotebook.value[notebookId] = []
  }
}

// 选择笔记
const selectNote = async (note) => {
  selectedNoteId.value = note.noteId
  
  // 找到当前笔记所在的笔记本ID
  const currentNotebookId = Object.keys(notesByNotebook.value).find(notebookId => 
    notesByNotebook.value[notebookId].some(n => n.noteId === note.noteId)
  )
  
  if (currentNotebookId) {
    // 直接跳转，让NoteEditor组件通过路由监听来加载笔记详情
    router.push(`/book/${currentNotebookId}/note/${note.noteId}`)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 方法
const handleNoteBookCommand = (command, item) => {
  if (command === 'rename') {
    reNameBook(item)
  } else if (command === 'delete') {
    showDeleteConfirm(item)
  }
}

const showModal = (item) => {
  visible.value = true
  if (item) {
    renameId.value = item.noteBookId
    bookName.value = item.noteBookName
  } else {
    renameId.value = undefined
    bookName.value = ''
  }
  
  nextTick(() => {
    if (bookNameInput.value) {
      bookNameInput.value.focus()
    }
  })
}

const handleOk = async () => {
  if (!bookName.value || bookName.value.trim().length === 0) {
    ElMessage.error('笔记本名称必须填写')
    return
  }

  const p = {
    noteBookName: bookName.value,
    noteBookId: renameId.value,
  }

  try {
    const res = await notesStore.createNoteBook(p)
    if (res && res.data && !renameId.value) {
      router.push(`/book/${res.data.noteBookId}`)
    }
    handleCancel()
  } catch (err) {
    console.error('创建笔记本失败:', err)
  }
}

const handleCancel = () => {
  visible.value = false
  bookName.value = ''
  renameId.value = undefined
}

const showDeleteConfirm = (item) => {
  ElMessageBox.confirm(
    '删除以后将无法恢复',
    `您确定要删除 '${item.noteBookName}' 笔记本`,
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      const res = await notesStore.delNoteBook(item)
      if (res && res.status && res.status.startsWith('err_')) {
        sysHandler.errHandler(res.status)
      } else {
        notesStore.getNotebooks()
      }
    } catch (err) {
      console.error('删除笔记本失败:', err)
    }
  }).catch(() => {
    console.log('取消删除')
  })
}

const newNote = async () => {
  const p = {
    noteName: '未命名笔记'
  }

  const bid = route.params.nbi
  let nbid = undefined

  try {
    nbid = parseInt(bid)
  } catch (err) {
    // ignore
  }

  if (nbid) {
    p.noteBookId = nbid
  } else if (notebooks.value.length > 0) {
    // 如果没有指定笔记本，使用第一个笔记本
    p.noteBookId = notebooks.value[0].noteBookId
  }

  try {
    const res = await notesStore.createNote(p)
    notesStore.getNotebooks()
    
    if (res && res.data) {
      // 刷新对应笔记本的笔记列表
      await loadNotesForNotebook(res.data.noteBookId)
      
      // 确保笔记本展开
      expandedNotebooks.value.add(res.data.noteBookId)
      
      router.push(`/book/${res.data.noteBookId}/note/${res.data.noteId}`)
    } else {
      console.error('创建笔记失败')
    }
  } catch (err) {
    console.error('创建笔记错误:', err)
  }
}

const isActive = (item) => {
  const bid = route.params.nbi
  return item.noteBookId == bid
}

const reNameBook = (item) => {
  showModal(item)
}

const goToShare = () => {
  router.push('/share')
}

const showSearchModal = () => {
  showSearchDialog.value = true
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  hasSearched.value = true
  
  try {
    // 调用后台搜索API
    const res = await notesStore.searchNotes({ keyword: searchKeyword.value })
    
    if (res && res.data && res.data.rows) {
      // 根据后台返回的结构处理搜索结果
      searchResults.value = res.data.rows.map(note => ({
        noteId: note.noteId,
        noteName: note.noteName,
        noteBookName: note.NoteBook ? note.NoteBook.noteBookName : '未知笔记本',
        noteBookId: note.NoteBook ? note.NoteBook.noteBookId : null,
        updateTime: note.updateTime,
        noteContent: note.NoteContent ? note.NoteContent.noteContentText : ''
      }))
    } else {
      searchResults.value = []
    }
  } catch (err) {
    console.error('搜索失败:', err)
    ElMessage.error('搜索失败')
    searchResults.value = []
  }
}

const selectSearchResult = (note) => {
  // 跳转到选中的笔记
  if (note.noteBookId) {
    router.push(`/book/${note.noteBookId}/note/${note.noteId}`)
  } else {
    router.push(`/book/1/note/${note.noteId}`) // 默认笔记本
  }
  showSearchDialog.value = false
}

// 监听路由变化，同步选中的笔记
watch(
  () => route.params,
  async (newParams) => {
    if (newParams.noteId) {
      selectedNoteId.value = parseInt(newParams.noteId)
    }
    
    if (newParams.nbi) {
      const notebookId = parseInt(newParams.nbi)
      expandedNotebooks.value.add(notebookId)
      
      // 加载当前笔记本的笔记（如果还没加载过）
      if (!notesByNotebook.value[notebookId]) {
        await loadNotesForNotebook(notebookId)
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 组件挂载后的初始化
  
  // 监听笔记删除事件
  const handleNoteDeleted = (event) => {
    const { noteId, notebookId } = event.detail
    console.log('Nav组件收到笔记删除事件:', { noteId, notebookId })
    
    // 清除对应笔记本的缓存，强制重新加载
    if (notesByNotebook.value[notebookId]) {
      delete notesByNotebook.value[notebookId]
    }
    
    // 如果当前展开了这个笔记本，重新加载笔记列表
    if (expandedNotebooks.value.has(notebookId)) {
      loadNotesForNotebook(notebookId)
    }
  }
  
  // 监听笔记移动事件
  const handleNoteMoved = (event) => {
    const { noteId, fromNotebookId, toNotebookId } = event.detail
    console.log('Nav组件收到笔记移动事件:', { noteId, fromNotebookId, toNotebookId })
    
    // 清除源笔记本和目标笔记本的缓存
    if (notesByNotebook.value[fromNotebookId]) {
      delete notesByNotebook.value[fromNotebookId]
    }
    if (notesByNotebook.value[toNotebookId]) {
      delete notesByNotebook.value[toNotebookId]
    }
    
    // 重新加载已展开笔记本的笔记列表
    if (expandedNotebooks.value.has(fromNotebookId)) {
      loadNotesForNotebook(fromNotebookId)
    }
    if (expandedNotebooks.value.has(toNotebookId)) {
      loadNotesForNotebook(toNotebookId)
    }
  }

  // 监听笔记更新事件（标题或内容变更）
  const handleNoteUpdated = (event) => {
    const { noteId, noteName } = event.detail || {}
    if (!noteId) return

    // 在已加载的笔记缓存中查找并更新标题
    Object.keys(notesByNotebook.value).forEach(nbId => {
      const arr = notesByNotebook.value[nbId]
      if (!Array.isArray(arr)) return
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].noteId == noteId) {
          // 更新标题并触发响应式更新
          arr[i].noteName = noteName || arr[i].noteName
          // 如果当前笔记本展开，重新加载确保数据一致（可选）
          // loadNotesForNotebook(parseInt(nbId))
          break
        }
      }
    })
  }
  
  window.addEventListener('noteDeleted', handleNoteDeleted)
  window.addEventListener('noteMoved', handleNoteMoved)
  window.addEventListener('noteUpdatedExternally', handleNoteUpdated)
  
  // 在组件销毁时清理事件监听器
  onBeforeUnmount(() => {
    window.removeEventListener('noteDeleted', handleNoteDeleted)
    window.removeEventListener('noteMoved', handleNoteMoved)
  window.removeEventListener('noteUpdatedExternally', handleNoteUpdated)
  })
})

onBeforeUnmount(() => {
  // 清理搜索定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
</script>

<style scoped>
.nav {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* Top section: App name (60px height) */
.app-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
}

.app-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

/* Bottom section: Navigation content */
.nav-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Search section */
.search-section {
  margin-bottom: 16px;
}

.nav-search-input :deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.nav-search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.search-cancel-btn {
  padding: 0 8px;
  height: 24px;
  font-size: 12px;
  color: #909399;
}

.search-cancel-btn:hover {
  color: #409eff;
}

.search-status {
  margin-top: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-loading {
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-count {
  color: #67c23a;
}

.search-empty {
  color: #f56c6c;
}

/* Action buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

/* 覆盖Element Plus的默认按钮间距 */
.action-buttons .el-button + .el-button {
  margin-left: 0;
}

.nav-button {
  width: 100%;
  justify-content: flex-start;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;
  text-align: left;
}

.nav-button :deep(.el-button__content) {
  justify-content: flex-start;
  width: 100%;
}

.nav-button :deep(.el-icon) {
  margin-right: 8px;
}

.nav-button.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.nav-button.el-button--default {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}

.nav-button.el-button--default:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* Notebook section */
.notebook-section {
  margin-top: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

/* Notebook tree structure */
.notebook-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notebook-group {
  margin-bottom: 2px;
}

.notebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  color: #606266;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  font-weight: 500;
}

.notebook-header:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.notebook-header.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-left: 3px solid #409eff;
  padding-left: 5px;
}

.notebook-main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0; /* 防止flex溢出 */
}

.expand-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.notebook-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.note-count {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.notebook-dropdown {
  opacity: 0;
  transition: opacity 0.3s ease;
  flex-shrink: 0;
}

.notebook-group:hover .notebook-dropdown {
  opacity: 1;
}

.dropdown-trigger {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-trigger:hover {
  background-color: #e4e7ed;
  color: #606266;
}

/* Notes list under each notebook */
.notes-list {
  margin-top: 2px;
  border-left: 2px solid #f0f0f0;
  margin-left: 16px;
  margin-right: 8px; /* 添加右边距防止溢出 */
  width: calc(100% - 24px); /* 限制宽度，24px = margin-left(16px) + margin-right(8px) */
}

.note-item {
  display: flex;
  flex-direction: column;
  padding: 8px 10px; /* 减少左右padding */
  margin-bottom: 1px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid transparent;
  position: relative;
  width: 100%;
  box-sizing: border-box; /* 确保padding包含在宽度内 */
}

.note-item::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 1px;
  background-color: #e4e7ed;
}

.note-item:hover {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
  /* 移除 transform: translateX(2px); 防止溢出 */
}

.note-item.active {
  background-color: #409eff;
  color: #ffffff;
  border-color: #409eff;
  /* 移除 transform: translateX(2px); 防止溢出 */
}

.note-item.active::before {
  background-color: #ffffff;
}

.note-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  width: 100%;
  box-sizing: border-box;
}

.note-date {
  font-size: 11px;
  opacity: 0.7;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
}

.note-item.active .note-date {
  opacity: 0.9;
}

.no-notes {
  padding: 10px 8px; /* 减少padding */
  font-size: 12px;
  color: #909399;
  text-align: center;
  font-style: italic;
  background-color: #fafafa;
  border-radius: 4px;
  margin: 4px 0;
  width: 100%;
  box-sizing: border-box;
}

/* Search results list */
.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result-item {
  padding: 10px 12px;
  margin-bottom: 2px;
}

.search-result-item .note-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.7;
}

.search-result-item.active .note-info {
  opacity: 0.9;
}

.note-notebook {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-item:not(.active) .note-notebook {
  background-color: #e4e7ed;
  color: #606266;
}

/* Search dialog styles */
.search-dialog :deep(.el-dialog__body) {
  padding: 40px;
}

.search-content {
  max-width: 800px;
  margin: 0 auto;
}

.search-input {
  margin-bottom: 24px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-results {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  padding: 16px 20px;
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
}

.search-result-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-result-item:hover {
  background-color: #ecf5ff;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.result-notebook {
  background-color: #e4e7ed;
  padding: 2px 8px;
  border-radius: 4px;
  color: #606266;
}

.no-results {
  padding: 40px;
  text-align: center;
}
</style>