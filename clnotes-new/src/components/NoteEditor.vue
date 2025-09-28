<template>
  <div class="note-editor">
    <div v-if="selectedNote" class="editor-content">
      <!-- Upper section: Note title and toolbar -->
      <div class="note-header">
        <div class="title-section">
          <el-input
            v-model="title"
            class="note-title-input"
            @input="onTitleInput"
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
            type="success"
            size="small" 
            :icon="autoSaveStatus === 'saved' && !hasContentChanged && !hasTitleChanged ? Check : Loading"
            class="toolbar-btn auto-save-btn"
            :disabled="autoSaveStatus === 'saving' || (!hasContentChanged && !hasTitleChanged && autoSaveStatus === 'saved')"
            :class="{
              'is-saving': autoSaveStatus === 'saving',
              'is-saved': autoSaveStatus === 'saved' && !hasContentChanged && !hasTitleChanged,
              'is-unsaved': autoSaveStatus === 'unsaved' || hasContentChanged || hasTitleChanged
            }"
            @click="manualSave"
          >
            {{ 
              autoSaveStatus === 'saving' ? '保存中...' : 
              (autoSaveStatus === 'saved' && !hasContentChanged && !hasTitleChanged) ? '已保存' : 
              '未保存' 
            }}
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
                <el-dropdown-item divided command="move">移动笔记</el-dropdown-item>
                <el-dropdown-item command="delete">删除笔记</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- Lower section: Rich text editor -->
      <div class="editor-container">
        <WangEditor
          :modelValue="noteContent"
          @update:modelValue="handleTextChange"
          @image-update="handleImageUpdate"
          ref="editorRef"
        />
      </div>
    </div>
    <div v-else class="no-note-selected">
      <el-empty description="请选择一个笔记开始编辑" />
    </div>

    <!-- 分享对话框 -->
    <ShareDialog
      v-model="showShareModal"
      :noteId="selectedNote?.noteId"
      @shared="handleShared"
    />

    <!-- 移动笔记对话框 -->
    <el-dialog 
      v-model="showMoveDialog" 
      title="移动笔记" 
      width="400px"
      class="move-dialog"
    >
      <div class="move-form">
        <p class="move-info">将笔记"{{ selectedNote?.noteName }}"移动到：</p>
        <el-select
          v-model="moveToNotebookId"
          placeholder="请选择目标笔记本"
          style="width: 100%"
          size="large"
        >
          <el-option
            v-for="notebook in availableNotebooks"
            :key="notebook.noteBookId"
            :label="notebook.noteBookName"
            :value="notebook.noteBookId"
            :disabled="notebook.noteBookId === currentNotebookId"
          />
        </el-select>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMoveDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleMoveNote"
            :loading="isMoving"
          >
            确认移动
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/store'
import { Share, ArrowDown, Check, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WangEditor from './WangEditor.vue'
import ShareDialog from './ShareDialog.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const editorRef = ref(null)
const showShareModal = ref(false)
const showMoveDialog = ref(false)
const moveToNotebookId = ref(null)
const isMoving = ref(false)
let autoSaveTimer = null

const selectedNote = computed(() => notesStore.noteDetail)

const noteContent = ref('')
const originalContent = ref('') // 用于跟踪原始内容
const originalTitle = ref('') // 用于跟踪原始标题
const hasContentChanged = ref(false) // 标记内容是否已改变
const hasTitleChanged = ref(false) // 标记标题是否已改变
// 局部标题字段，避免直接在模板对计算属性进行 v-model
const title = ref('')

// 监听选中笔记的变化，更新编辑器内容
watch(
  selectedNote,
  (newNote) => {
    if (newNote && newNote.NoteContent) {
      const content = newNote.NoteContent.noteContentText || ''
      const theTitle = newNote.noteName || ''
      noteContent.value = content
      originalContent.value = content // 保存原始内容
      originalTitle.value = theTitle // 保存原始标题
      title.value = theTitle
      hasContentChanged.value = false // 重置改变标记
      hasTitleChanged.value = false
    } else {
      noteContent.value = ''
      originalContent.value = ''
      originalTitle.value = ''
      hasContentChanged.value = false
      hasTitleChanged.value = false
    }
  },
  { immediate: true, deep: true }
)

// 监听标题字段的变化，标记标题是否被修改
watch(
  () => selectedNote.value?.noteName,
  (newTitle) => {
    if (typeof newTitle === 'undefined' || newTitle === null) return
    hasTitleChanged.value = newTitle !== originalTitle.value
  }
)

// 自动保存状态
const autoSaveStatus = ref('saved') // 'saved', 'saving', 'unsaved'

// 当前笔记本ID
const currentNotebookId = computed(() => parseInt(route.params.nbi))

// 可用的笔记本列表（排除当前笔记本）
const availableNotebooks = computed(() => notesStore.notebooks)

const updateNoteTitle = async () => {
  if (selectedNote.value) {
    // 检查标题是否真的发生了变化
  if (title.value === originalTitle.value) {
      console.log('标题未改变，无需保存')
      return
    }

    try {
      const p = {
        noteId: selectedNote.value.noteId,
    noteName: title.value
      }

      await notesStore.createNote(p, 'update')
      // 更新本地列表与缓存
      try { notesStore.updateNoteList(p) } catch (e) {}
      // 确保侧栏数据刷新（部分实现需要重新拉取）
      try { await notesStore.getNotesByBook({ nbi: currentNotebookId.value }) } catch (e) {}

      // 更新原始标题并清理标记
      originalTitle.value = title.value
      hasTitleChanged.value = false

      // 更新 store 中的 noteDetail，保持和 performSave 一致
      try {
        const updatedDetail = Object.assign({}, selectedNote.value)
        updatedDetail.noteName = title.value
        notesStore.setNoteDetail(updatedDetail)
      } catch (e) {}

      // Dispatch event so Nav updates cached lists
      try {
        window.dispatchEvent(new CustomEvent('noteUpdatedExternally', {
          detail: { noteId: p.noteId, noteName: p.noteName }
        }))
      } catch (e) {}
    } catch (err) {
      console.error('更新笔记标题失败:', err)
    }
  }
}

// 标题输入处理，立即标记为已修改（使用本地 title）
const onTitleInput = (val) => {
  try {
    hasTitleChanged.value = title.value !== originalTitle.value
  } catch (e) {
    hasTitleChanged.value = false
  }
}

// 处理文本变化，实现自动保存
const handleTextChange = (newContent) => {
  // 检查内容是否真的发生了变化
  if (newContent === originalContent.value) {
    // 内容没有变化，不需要保存
    autoSaveStatus.value = 'saved'
    hasContentChanged.value = false
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    return
  }
  
  noteContent.value = newContent
  hasContentChanged.value = true
  autoSaveStatus.value = 'unsaved'
  
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(async () => {
    await performSave()
  }, 3000) // 3秒后自动保存
}

// 手动保存（支持标题变更或内容变更）
const manualSave = async () => {
  // 在内容或标题发生变化时保存
  if (hasContentChanged.value || hasTitleChanged.value) {
    await performSave()
  } else {
    console.log('内容或标题未改变，无需保存')
  }
}

// 执行保存操作
const performSave = async () => {
  if (!selectedNote.value || (!hasContentChanged.value && !hasTitleChanged.value)) {
    console.log('无需保存：笔记不存在或内容/标题未改变')
    return
  }

  autoSaveStatus.value = 'saving'

  try {
    // 构建保存参数，支持仅标题变更或同时变更内容
    const noteContentToSave = hasContentChanged.value ? noteContent.value : (selectedNote.value.NoteContent?.noteContentText || '')

    // 获取文本摘要（前100个字符）
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = noteContentToSave
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    const noteSummary = textContent.substring(0, 100)

    const p = {
      noteId: selectedNote.value.noteId,
      noteName: title.value,
      noteContent: noteContentToSave,
      noteSummary: noteSummary
    }

    const res = await notesStore.createNote(p, 'update')

    if (res) {
      autoSaveStatus.value = 'saved'

      // 如果保存了内容，则更新对应标记和缓存
      if (hasContentChanged.value) {
        hasContentChanged.value = false
        originalContent.value = noteContentToSave
        if (selectedNote.value.NoteContent) {
          selectedNote.value.NoteContent.noteContentText = noteContentToSave
          selectedNote.value.NoteContent.noteContentSummary = noteSummary
        }
      }

      // 如果保存了标题，则更新原始标题标记
      if (hasTitleChanged.value) {
        originalTitle.value = selectedNote.value.noteName
        hasTitleChanged.value = false
      }

  // 更新左侧列表（快速更新）并确保刷新笔记列表
  try { notesStore.updateNoteList({ noteId: p.noteId, noteName: p.noteName }) } catch (e) {}
      try { await notesStore.getNotesByBook({ nbi: currentNotebookId.value }) } catch (e) {}

      console.log('保存成功')

      // 更新 store 中的 noteDetail 以保持数据一致
      try {
  const updatedDetail = Object.assign({}, selectedNote.value)
        if (hasContentChanged.value) {
          if (!updatedDetail.NoteContent) updatedDetail.NoteContent = {}
          updatedDetail.NoteContent.noteContentText = noteContentToSave
          updatedDetail.NoteContent.noteContentSummary = noteSummary
        }
  // 更新标题
  updatedDetail.noteName = title.value
        notesStore.setNoteDetail(updatedDetail)
      } catch (e) {}

      // Dispatch a window event so Nav/Sidebar can refresh immediately
      try {
        window.dispatchEvent(new CustomEvent('noteUpdatedExternally', {
          detail: { noteId: p.noteId, noteName: p.noteName }
        }))
      } catch (e) {}

      // 2秒后恢复到普通状态
      setTimeout(() => {
        if (autoSaveStatus.value === 'saved') {
          autoSaveStatus.value = 'saved'
        }
      }, 2000)
    } else {
      autoSaveStatus.value = 'unsaved'
      ElMessage.error('保存失败')
    }

  } catch (err) {
    console.error('保存失败:', err)
    autoSaveStatus.value = 'unsaved'
    ElMessage.error('保存失败')
  }
}

// 添加Ctrl+S快捷键支持
onMounted(() => {
  const handleKeydown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      manualSave()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)

  // 订阅 BroadcastChannel（现代浏览器）
  let bc = null
  try {
    if (window.BroadcastChannel) {
      bc = new BroadcastChannel('clnote-updates')
      bc.onmessage = (ev) => {
        handleExternalUpdate(ev.data)
      }
    }
  } catch (e) {
    // ignore
  }

  // 退回兼容方案：监听 localStorage 的 storage 事件
  const storageHandler = (ev) => {
    if (ev.key === 'clnote:note-updated' && ev.newValue) {
      handleExternalUpdate(ev.newValue)
    }
  }
  window.addEventListener('storage', storageHandler)

  // 清理事件监听器
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    try {
      if (bc) bc.close()
    } catch (e) {}
    window.removeEventListener('storage', storageHandler)
  })
})

// 处理图片上传
const handleImageUpdate = (fileName) => {
  console.log('图片上传成功:', fileName)
}

// 处理来自其他窗口/标签页的外部更新（通过 BroadcastChannel 或 localStorage 触发）
const handleExternalUpdate = (payload) => {
  if (!payload) return
  let data = payload
  if (typeof payload === 'string') {
    try {
      data = JSON.parse(payload)
    } catch (e) {
      return
    }
  }

  const nid = data.noteId
  if (!nid) return

  // 更新左侧笔记列表的标题
  try {
    notesStore.updateNoteList({ noteId: nid, noteName: data.noteName })
  } catch (e) {
    // ignore
  }

  // 如果当前打开的笔记就是被修改的笔记，更新详情和编辑器内容
  if (selectedNote.value && selectedNote.value.noteId == nid) {
    const updated = Object.assign({}, selectedNote.value)
    if (data.noteName) updated.noteName = data.noteName
    if (!updated.NoteContent) updated.NoteContent = {}
    if (data.noteContent) updated.NoteContent.noteContentText = data.noteContent
    // 更新 store 中的 noteDetail
    notesStore.setNoteDetail(updated)

    // 同步到编辑器 UI
  noteContent.value = updated.NoteContent.noteContentText || ''
    originalContent.value = noteContent.value
    originalTitle.value = updated.noteName || ''
    hasContentChanged.value = false
  try { ElMessage.info('笔记已在其他窗口更新，内容已同步') } catch (e) {}
  }
}

const showShareDialog = async () => {
  if (!selectedNote.value) {
    ElMessage.warning('请先选择一个笔记')
    return
  }
  
  console.log('打开分享对话框，笔记ID:', selectedNote.value.noteId) // 调试用
  
  // 确保有笔记列表数据
  if (!notesStore.noteList || notesStore.noteList.length === 0) {
    try {
      await notesStore.getNotesByBook({ nbi: currentNotebookId.value })
    } catch (err) {
      console.error('获取笔记列表失败:', err)
    }
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
    case 'move':
      showMoveNote()
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

    // 获取笔记内容
    let currentNoteContent = ''
    if (selectedNote.value.NoteContent && selectedNote.value.NoteContent.noteContentText) {
      currentNoteContent = selectedNote.value.NoteContent.noteContentText
    } else {
      // 如果没有内容，使用当前编辑器的内容
      currentNoteContent = noteContent.value || ''
    }

    console.log('导出内容:', currentNoteContent) // 调试用

    if (!currentNoteContent) {
      ElMessage.warning('笔记内容为空')
      return
    }

    // 创建下载链接
    let content = ''
    let fileName = ''
    let mimeType = ''

    switch (format) {
      case 'markdown':
        content = convertToMarkdown(currentNoteContent)
        fileName = `${selectedNote.value.noteName || '未命名笔记'}.md`
        mimeType = 'text/markdown'
        break
      case 'txt':
        content = stripHtml(currentNoteContent)
        fileName = `${selectedNote.value.noteName || '未命名笔记'}.txt`
        mimeType = 'text/plain'
        break
      case 'html':
        content = currentNoteContent
        fileName = `${selectedNote.value.noteName || '未命名笔记'}.html`
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

// HTML转Markdown转换
const convertToMarkdown = (html) => {
  if (!html) return ''
  
  // 创建一个临时div来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // 基本的HTML到Markdown转换
  let markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/g, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/g, '###### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n') + '\n'
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
      let counter = 1
      return content.replace(/<li[^>]*>(.*?)<\/li>/g, () => `${counter++}. $1\n`) + '\n'
    })
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![]($1)')
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, '> $1\n\n')
    
  // 清理多余的HTML标签
  markdown = markdown.replace(/<[^>]*>/g, '')
  
  // 清理多余的空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  
  return markdown.trim()
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
    
    const noteIdToDelete = selectedNote.value.noteId
    const currentNoteIdInRoute = route.params.noteId ? parseInt(route.params.noteId) : null
    
    let res
    try {
      // 首先尝试单个删除接口
      res = await notesStore.delNote({
        noteId: noteIdToDelete
      })
    } catch (error) {
      console.log('单个删除接口失败，尝试批量删除接口')
      // 如果单个删除失败，尝试批量删除接口
      res = await notesStore.delNotes({
        noteIds: [noteIdToDelete]
      })
    }
    
    if (res && (res.status === 'ok' || res.success || res.data)) {
      ElMessage.success('笔记删除成功')
      
      // 清空当前笔记详情
      notesStore.setNoteDetail(null)
      
      // 检查当前路由是否正好在被删除的笔记页面上
      const needRouteChange = currentNoteIdInRoute && currentNoteIdInRoute === noteIdToDelete
      
      // 重新加载当前笔记本的笔记列表以获取最新数据
      await notesStore.getNotesByBook({ nbi: currentNotebookId.value })
      
      // 重新加载笔记本列表以更新笔记数量
      await notesStore.getNotebooks()
      
      // 通过事件总线或window事件通知Nav组件刷新笔记列表
      // 触发自定义事件，让Nav组件监听并刷新对应笔记本的笔记列表
      window.dispatchEvent(new CustomEvent('noteDeleted', {
        detail: { 
          noteId: noteIdToDelete, 
          notebookId: currentNotebookId.value 
        }
      }))
      
      // 如果当前正在被删除的笔记页面上，跳转回笔记本页面
      if (needRouteChange) {
        router.replace(`/book/${currentNotebookId.value}`)
      }
      
    } else {
      ElMessage.error('删除失败: ' + (res?.msg || res?.message || '未知错误'))
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除笔记失败:', error)
      ElMessage.error('删除失败')
    }
    // 用户取消删除时不显示错误
  }
}

const handleShared = (shareData) => {
  console.log('笔记分享成功:', shareData)
}

// 显示移动笔记对话框
const showMoveNote = () => {
  if (!selectedNote.value) {
    ElMessage.warning('请先选择一个笔记')
    return
  }
  
  // 重置选择的笔记本
  moveToNotebookId.value = null
  showMoveDialog.value = true
}

// 执行移动笔记
const handleMoveNote = async () => {
  if (!moveToNotebookId.value) {
    ElMessage.error('请选择目标笔记本')
    return
  }
  
  if (moveToNotebookId.value === currentNotebookId.value) {
    ElMessage.error('不能移动到当前笔记本')
    return
  }
  
  isMoving.value = true
  const noteIdToMove = selectedNote.value.noteId
  const fromNotebookId = currentNotebookId.value
  const toNotebookId = moveToNotebookId.value
  
  try {
    const res = await notesStore.moveNotes({
      noteIds: [noteIdToMove],
      noteBookId: toNotebookId
    })
    
    if (res && (res.status === 'ok' || res.success || res.data)) {
      ElMessage.success('笔记移动成功')
      showMoveDialog.value = false
      
      // 清空当前笔记详情
      notesStore.setNoteDetail(null)
      
      // 重新加载当前笔记本的笔记列表以更新计数
      await notesStore.getNotesByBook({ nbi: fromNotebookId })
      
      // 重新加载笔记本列表以更新所有笔记本的笔记数量
      await notesStore.getNotebooks()
      
      // 通知Nav组件笔记已移动
      window.dispatchEvent(new CustomEvent('noteMoved', {
        detail: { 
          noteId: noteIdToMove, 
          fromNotebookId: fromNotebookId,
          toNotebookId: toNotebookId
        }
      }))
      
      // 跳转回当前笔记本页面
      router.replace(`/book/${fromNotebookId}`)
      
    } else {
      ElMessage.error('移动失败: ' + (res?.msg || res?.message || '未知错误'))
    }
  } catch (err) {
    console.error('移动笔记失败:', err)
    ElMessage.error('移动失败')
  } finally {
    isMoving.value = false
  }
}

// 监听路由变化，加载笔记详情
watch(
  () => route.params.noteId,
  async (newNoteId, oldNoteId) => {
    // 清除之前的自动保存定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    
    if (newNoteId) {
      try {
        await notesStore.getNoteDetail({ ni: newNoteId })
        // 重置自动保存状态
        autoSaveStatus.value = 'saved'
        hasContentChanged.value = false
      } catch (err) {
        console.error('获取笔记详情失败:', err)
      }
    } else {
      notesStore.setNoteDetail(null)
      noteContent.value = ''
      originalContent.value = ''
      originalTitle.value = ''
      hasContentChanged.value = false
      autoSaveStatus.value = 'saved'
    }
  },
  { immediate: true }
)

// 清理定时器
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.editor-content {
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

.auto-save-btn.is-saving {
  color: #e6a23c;
  border-color: #f5dab1;
  background-color: #fdf6ec;
}

.auto-save-btn.is-saved {
  color: #67c23a;
  border-color: #c2e7b0;
  background-color: #f0f9ff;
}

.auto-save-btn.is-unsaved {
  color: #909399;
  border-color: #e4e7ed;
  background-color: #f5f7fa;
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
  display: flex;
  flex-direction: column;
}

/* 确保WangEditor组件能够使用全部高度 */
.editor-container :deep(.wang-editor) {
  height: 100%;
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

/* 移动对话框样式 */
.move-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.move-form {
  padding: 20px 0;
}

.move-info {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
