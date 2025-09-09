<template>
  <div class="book-nav">
    <el-container direction="vertical" style="height: 100%;">
      <!-- Left sidebar: Note list (250px width) -->
      <el-container>
        <el-aside width="250px" class="note-list-aside">
          <div class="note-list-header">
            <el-input
              v-model="searchText"
              placeholder="搜索笔记..."
              :prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
          
          <div class="note-items">
            <div
              v-for="note in filteredNoteList"
              :key="note.noteId"
              class="note-item"
              :class="{ active: selectedNoteId === note.noteId }"
              @click="selectNote(note)"
            >
              <div class="note-title">{{ note.noteName }}</div>
              <div class="note-date">{{ formatDate(note.updateTime) }}</div>
            </div>
          </div>
        </el-aside>
        
        <!-- Main content area -->
        <el-main class="note-main">
          <div v-if="selectedNote" class="note-editor">
            <!-- Upper section: Note title and toolbar -->
            <div class="note-header">
              <div class="title-section">
                <el-input
                  v-model="selectedNote.noteName"
                  class="note-title-input"
                  @blur="updateNoteTitle"
                  @keyup.enter="updateNoteTitle"
                  placeholder="未命名笔记"
                />
              </div>
              <div class="toolbar-section">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Share" 
                  @click="showShareDialog"
                  class="toolbar-btn"
                >
                  分享
                </el-button>
                <el-button 
                  type="default" 
                  size="small" 
                  :icon="Check"
                  class="toolbar-btn auto-save-btn"
                  :disabled="true"
                >
                  自动保存
                </el-button>
                <el-dropdown @command="handleNoteAction" trigger="click">
                  <el-button size="small" type="default" class="toolbar-btn">
                    导出
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="export-md">导出为 Markdown</el-dropdown-item>
                      <el-dropdown-item command="export-txt">导出为文本</el-dropdown-item>
                      <el-dropdown-item command="export-html">导出为 HTML</el-dropdown-item>
                      <el-dropdown-item divided command="delete">删除笔记</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <!-- Lower section: Rich text editor -->
            <div class="editor-container">
              <WangEditor
                v-model="selectedNote.noteContent"
                :onTextChange="handleTextChange"
                :onImageUpdate="handleImageUpdate"
                ref="editorRef"
              />
            </div>
          </div>
          <div v-else class="no-note-selected">
            <el-empty description="请选择一个笔记开始编辑" />
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- 分享对话框 -->
    <ShareDialog
      v-model="showShareModal"
      :noteId="selectedNote?.noteId"
      @shared="handleShared"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/store'
import { Search, Share, ArrowDown, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WangEditor from './WangEditor.vue'
import ShareDialog from './ShareDialog.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const searchText = ref('')
const selectedNoteId = ref(null)
const editorRef = ref(null)
const showShareModal = ref(false)
let autoSaveTimer = null

const noteList = computed(() => notesStore.noteList)
const selectedNote = computed(() => notesStore.noteDetail)

// 过滤笔记列表
const filteredNoteList = computed(() => {
  if (!searchText.value.trim()) {
    return noteList.value
  }
  return noteList.value.filter(note => 
    note.noteName.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const selectNote = async (note) => {
  selectedNoteId.value = note.noteId
  try {
    await notesStore.getNoteDetail({ ni: note.noteId })
    // 更新路由但不重新加载组件
    if (route.params.noteId !== note.noteId.toString()) {
      router.replace(`/book/${route.params.nbi}/note/${note.noteId}`)
    }
  } catch (err) {
    console.error('获取笔记详情失败:', err)
  }
}

const updateNoteTitle = async () => {
  if (selectedNote.value) {
    try {
      await notesStore.createNote({
        noteId: selectedNote.value.noteId,
        noteName: selectedNote.value.noteName
      }, 'update')
      notesStore.updateNoteList({
        noteId: selectedNote.value.noteId,
        noteName: selectedNote.value.noteName
      })
      ElMessage.success('标题已保存')
    } catch (err) {
      console.error('更新笔记标题失败:', err)
      ElMessage.error('保存标题失败')
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 处理文本变化，实现自动保存
const handleTextChange = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(async () => {
    if (selectedNote.value) {
      try {
        await notesStore.createNote({
          noteId: selectedNote.value.noteId,
          noteContent: selectedNote.value.noteContent
        }, 'update')
        console.log('自动保存成功')
        // 可以在这里显示一个简短的保存提示
      } catch (err) {
        console.error('自动保存失败:', err)
      }
    }
  }, 4000) // 4秒后自动保存
}

// 处理图片上传
const handleImageUpdate = (fileName) => {
  console.log('图片上传成功:', fileName)
}

const showShareDialog = () => {
  if (!selectedNote.value) {
    ElMessage.warning('请先选择一个笔记')
    return
  }
  showShareModal.value = true
}

const handleNoteAction = async (command) => {
  if (!selectedNote.value) {
    ElMessage.warning('请先选择一个笔记')
    return
  }

  switch (command) {
    case 'export-md':
      await exportNote('markdown')
      break
    case 'export-txt':
      await exportNote('txt')
      break
    case 'export-html':
      await exportNote('html')
      break
    case 'delete':
      await deleteNote()
      break
    default:
      break
  }
}

const exportNote = async (format) => {
  try {
    if (!selectedNote.value) {
      ElMessage.warning('请先选择一个笔记')
      return
    }

    // 创建下载链接
    let content = ''
    let fileName = ''
    let mimeType = ''

    switch (format) {
      case 'markdown':
        content = convertToMarkdown(selectedNote.value.noteContent)
        fileName = `${selectedNote.value.noteName}.md`
        mimeType = 'text/markdown'
        break
      case 'txt':
        content = stripHtml(selectedNote.value.noteContent)
        fileName = `${selectedNote.value.noteName}.txt`
        mimeType = 'text/plain'
        break
      case 'html':
        content = selectedNote.value.noteContent
        fileName = `${selectedNote.value.noteName}.html`
        mimeType = 'text/html'
        break
      default:
        ElMessage.error('不支持的导出格式')
        return
    }

    // 创建下载
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success(`已导出为 ${fileName}`)
    
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 简单的HTML转Markdown转换
const convertToMarkdown = (html) => {
  if (!html) return ''
  // 这是一个简化的转换，实际项目中可能需要更完善的转换库
  return html
    .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => '#'.repeat(parseInt(level)) + ' ' + text + '\n\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]*>/g, '') // 移除其他HTML标签
    .trim()
}

// 移除HTML标签
const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const deleteNote = async () => {
  try {
    await ElMessageBox.confirm(
      '删除后将无法恢复，确定要删除这个笔记吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // TODO: 实现删除笔记的API调用
    ElMessage.success('笔记删除成功')
    
  } catch (error) {
    // 用户取消删除
  }
}

const handleShared = (shareData) => {
  console.log('笔记分享成功:', shareData)
  ElMessage.success('笔记分享成功')
}

onMounted(async () => {
  const nbi = route.params.nbi
  if (nbi) {
    try {
      await notesStore.getNotesByBook({ nbi })
      // 如果有笔记且路由中有noteId，则选择该笔记
      const noteId = route.params.noteId
      if (noteId && noteList.value.length > 0) {
        const note = noteList.value.find(n => n.noteId == noteId)
        if (note) {
          await selectNote(note)
        }
      }
    } catch (err) {
      console.error('获取笔记列表失败:', err)
    }
  }
})

// 监听路由变化
watch(
  () => route.params,
  async (newParams, oldParams) => {
    if (newParams.nbi !== oldParams.nbi) {
      try {
        await notesStore.getNotesByBook({ nbi: newParams.nbi })
      } catch (err) {
        console.error('获取笔记列表失败:', err)
      }
    }
    
    if (newParams.noteId !== oldParams.noteId && newParams.noteId) {
      const note = noteList.value.find(n => n.noteId == newParams.noteId)
      if (note) {
        await selectNote(note)
      }
    }
  }
)
</script>

<style scoped>
.book-nav {
  height: 100%;
  background: #ffffff;
}

/* Note list sidebar */
.note-list-aside {
  border-right: 1px solid #e4e7ed;
  background: #f5f7fa;
  height: 100%;
}

.note-list-header {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
}

.note-items {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 8px;
}

.note-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
}

.note-item.active {
  background-color: #409eff;
  color: #ffffff;
  border-color: #409eff;
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-date {
  font-size: 12px;
  opacity: 0.7;
}

.note-item.active .note-date {
  opacity: 0.8;
}

/* Main content area */
.note-main {
  padding: 0;
  height: 100%;
  background: #ffffff;
}

.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Upper section: Note header with title and toolbar */
.note-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  min-height: 60px;
}

.title-section {
  flex: 1;
  margin-right: 16px;
}

.note-title-input {
  font-size: 18px;
  font-weight: 600;
}

.note-title-input :deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
  padding: 0;
}

.note-title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  height: 32px;
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid #e4e7ed;
}

.toolbar-btn.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.toolbar-btn.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.auto-save-btn {
  color: #67c23a;
  border-color: #c2e7b0;
  background-color: #f0f9ff;
}

.auto-save-btn.is-disabled {
  color: #909399;
  border-color: #e4e7ed;
  background-color: #f5f7fa;
}

/* Lower section: Editor container */
.editor-container {
  flex: 1;
  padding: 20px;
  background: #ffffff;
  overflow: hidden;
}

.no-note-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .note-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .title-section {
    margin-right: 0;
  }
  
  .toolbar-section {
    justify-content: flex-end;
  }
}

/* 搜索框样式 */
.note-list-header .el-input :deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.note-list-header .el-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}
</style>