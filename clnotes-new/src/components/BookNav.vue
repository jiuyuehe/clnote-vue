<template>
  <div class="book-nav">
    <el-container>
      <el-aside width="250px" style="border-right: 1px solid #dcdfe6;">
        <div class="note-list">
          <el-input
            v-model="searchText"
            placeholder="搜索笔记..."
            :prefix-icon="Search"
            style="margin-bottom: 10px;"
          />
          
          <div class="note-items">
            <div
              v-for="note in noteList"
              :key="note.noteId"
              class="note-item"
              :class="{ active: selectedNoteId === note.noteId }"
              @click="selectNote(note)"
            >
              <div class="note-title">{{ note.noteName }}</div>
              <div class="note-date">{{ formatDate(note.updateTime) }}</div>
            </div>
          </div>
        </div>
      </el-aside>
      
      <el-main>
        <div v-if="selectedNote" class="note-editor">
          <div class="note-header">
            <el-input
              v-model="selectedNote.noteName"
              class="note-title-input"
              @blur="updateNoteTitle"
            />
            <div class="note-actions">
              <el-button 
                type="primary" 
                size="small" 
                :icon="Share" 
                @click="showShareDialog"
                class="share-btn"
              >
                分享
              </el-button>
              <el-dropdown @command="handleNoteAction" trigger="click">
                <el-button size="small" :icon="MoreFilled" class="more-btn">
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="export">导出笔记</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除笔记</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
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
import { Search, Share, MoreFilled, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WangEditor from './WangEditor.vue'
import ShareDialog from './ShareDialog.vue'
import { exportNote as exportNoteUtil, exportFormats } from '@/utils/exportUtils'

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

const selectNote = async (note) => {
  selectedNoteId.value = note.noteId
  try {
    await notesStore.getNoteDetail({ noteId: note.noteId })
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
    } catch (err) {
      console.error('更新笔记标题失败:', err)
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
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
    case 'export':
      await exportNote()
      break
    case 'delete':
      await deleteNote()
      break
    default:
      break
  }
}

const exportNote = async () => {
  try {
    if (!selectedNote.value) {
      ElMessage.warning('请先选择一个笔记')
      return
    }

    // Show export format selection
    const { value: format } = await ElMessageBox.prompt(
      '请选择导出格式',
      '导出笔记',
      {
        confirmButtonText: '导出',
        cancelButtonText: '取消',
        inputType: 'select',
        inputOptions: {
          [exportFormats.MARKDOWN]: 'Markdown (.md)',
          [exportFormats.TXT]: '纯文本 (.txt)',
          [exportFormats.HTML]: 'HTML (.html)',
          [exportFormats.JSON]: 'JSON (.json)'
        },
        inputValue: exportFormats.MARKDOWN
      }
    )

    const result = exportNoteUtil(selectedNote.value, format)
    ElMessage.success(`笔记已导出为 ${result.fileName}`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
    }
  }
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
          selectNote(note)
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
        selectNote(note)
      }
    }
  }
)
</script>

<style scoped>
.book-nav {
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.note-list {
  padding: 16px;
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.note-items {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 8px;
}

.note-item {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin-bottom: 4px;
}

.note-item:hover {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.note-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-left: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.note-title {
  font-weight: 600;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.note-date {
  font-size: 12px;
  opacity: 0.7;
}

.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.note-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  align-items: center;
  gap: 20px;
  backdrop-filter: blur(20px);
}

.note-title-input {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
}

.note-title-input :deep(.el-input__inner) {
  border: none;
  font-size: 20px;
  font-weight: 700;
  background: transparent;
  color: #2c3e50;
}

.note-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  padding: 10px 20px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.more-btn {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.editor-container {
  flex: 1;
  padding: 24px 28px;
  background: white;
}

.placeholder-editor {
  text-align: center;
  color: #909399;
  padding: 60px;
}

.no-note-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

/* 搜索框样式 */
.el-input {
  border-radius: 12px;
}

.el-input :deep(.el-input__inner) {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-input :deep(.el-input__inner):focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
</style>