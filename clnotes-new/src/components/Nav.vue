<template>
  <div class="nav">
    <!-- Top section: App name (120px height) -->
    <div class="app-header">
      <h3 class="app-title">云笔记</h3>
    </div>

    <!-- Bottom section: Action buttons and navigation -->
    <div class="nav-content">
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
        <el-button 
          type="default" 
          size="default" 
          :icon="Search" 
          @click="showSearchModal"
          class="nav-button"
        >
          搜索笔记
        </el-button>
      </div>

      <!-- Notebook list -->
      <div class="notebook-section">
        <div class="section-title">
          <el-icon><Notebook /></el-icon>
          <span>我的笔记本</span>
        </div>
        <ul class="notebook-list">
          <li v-for="item in notebooks" :key="item.noteBookId" class="notebook-item">
            <router-link
              :to="`/loading/${item.noteBookId}`"
              active-class="active"
              :class="['notebook-link', { active: isActive(item) }]"
            >
              <el-icon><Notebook /></el-icon>
              <span class="notebook-name">{{ item.noteBookName }}</span>
              <span v-if="item.noteCount > 0" class="note-count">({{ item.noteCount }})</span>

              <el-dropdown
                @command="(command) => handleNoteBookCommand(command, item)"
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
            </router-link>
          </li>
        </ul>
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotesStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Notebook, Search, Share, MoreFilled } from '@element-plus/icons-vue'
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
const searchResults = ref([])
const hasSearched = ref(false)

// 计算属性
const notebooks = computed(() => notesStore.notebooks)

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
  }

  try {
    const res = await notesStore.createNote(p)
    notesStore.getNotebooks()
    
    if (res && res.data) {
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  // 组件挂载后的初始化
})
</script>

<style scoped>
.nav {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* Top section: App name (120px height) */
.app-header {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.app-title {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

/* Bottom section: Navigation content */
.nav-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Action buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.nav-button {
  width: 100%;
  justify-content: flex-start;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;
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

.notebook-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notebook-item {
  margin-bottom: 4px;
}

.notebook-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #606266;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.notebook-link:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.notebook-link.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-left: 3px solid #409eff;
}

.notebook-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-count {
  font-size: 12px;
  color: #909399;
}

.notebook-dropdown {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.notebook-item:hover .notebook-dropdown {
  opacity: 1;
}

.dropdown-trigger {
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
  color: #909399;
}

.dropdown-trigger:hover {
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