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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/store'
import { Search } from '@element-plus/icons-vue'
import WangEditor from './WangEditor.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const searchText = ref('')
const selectedNoteId = ref(null)
const editorRef = ref(null)
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
}

.note-list {
  padding: 10px;
  height: 100%;
}

.note-items {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.note-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.note-item:hover {
  background-color: #f5f7fa;
}

.note-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.note-title {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-date {
  font-size: 12px;
  color: #909399;
}

.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.note-header {
  padding: 10px 20px;
  border-bottom: 1px solid #dcdfe6;
}

.note-title-input {
  font-size: 18px;
  font-weight: 500;
}

.note-title-input .el-input__inner {
  border: none;
  font-size: 18px;
  font-weight: 500;
}

.editor-container {
  flex: 1;
  padding: 20px;
}

.placeholder-editor {
  text-align: center;
  color: #909399;
  padding: 50px;
}

.no-note-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>