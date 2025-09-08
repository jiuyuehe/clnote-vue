<template>
  <div class="nav">
    <div class="book-opt">
      <el-dropdown @command="handleDropdownCommand">
        <span class="el-dropdown-link nav-add">
          <el-icon><Plus /></el-icon> 新增 
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="newNote">新建笔记</el-dropdown-item>
            <el-dropdown-item command="newNotebook">新建笔记本</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <ul>
      <li>
        <router-link to="/share" class="notebook-nav" active-class="active">
          <el-icon><Document /></el-icon>
          我的分享
        </router-link>
      </li>

      <li>
        <div class="nav-list">
          <el-icon><Notebook /></el-icon><span> 我的笔记本</span>
        </div>
        <ul class="note-over">
          <li v-for="item in notebooks" :key="item.noteBookId" class="notebook-nav-h">
            <router-link
              :to="`/loading/${item.noteBookId}`"
              active-class="active"
              :class="['notebook-nav', { active: isActive(item) }]"
              class="notebook-nav"
            >
              &nbsp; 
              <img 
                width="18" 
                height="18" 
                style="position: relative; top: 4px" 
                src="@/assets/note_yellow-min.png" 
                alt=""
              />
              &nbsp; {{ item.noteBookName }} 
              <span v-if="item.noteCount > 0">({{ item.noteCount }})</span>

              <el-dropdown
                @command="(command) => handleNoteBookCommand(command, item)"
                trigger="click"
                @visible-change="(visible) => showMenu(item, visible)"
              >
                <span class="ant-dropdown-link note-book-btn" @click.prevent>
                  <el-icon><ArrowDownBold /></el-icon>
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
      </li>
    </ul>

    <!-- 新建笔记本对话框 -->
    <el-dialog v-model="visible" title="新建笔记本" width="500px">
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
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotesStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, ArrowDown, Document, Notebook, ArrowDownBold } from '@element-plus/icons-vue'
import { sysHandler } from '@/utils/sysHandler'

const router = useRouter()
const route = useRoute()
const notesStore = useNotesStore()

// 响应式数据
const visible = ref(false)
const bookName = ref('')
const renameId = ref(undefined)
const bookNameInput = ref(null)

// 计算属性
const notebooks = computed(() => notesStore.notebooks)

// 方法
const handleDropdownCommand = (command) => {
  if (command === 'newNote') {
    newNote()
  } else if (command === 'newNotebook') {
    showModal()
  }
}

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

const showMenu = (item, visible) => {
  console.log('显示菜单:', visible, item)
}

onMounted(() => {
  // 组件挂载后的初始化
})
</script>

<style scoped>
.nav {
  padding: 10px;
}

.book-opt {
  margin-bottom: 20px;
}

.nav-add {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
}

.nav-add:hover {
  color: #66b1ff;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin-bottom: 5px;
}

.nav-list {
  padding: 8px 12px;
  color: #606266;
  font-weight: 500;
}

.notebook-nav {
  display: block;
  padding: 8px 12px;
  color: #606266;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
}

.notebook-nav:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.notebook-nav.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.note-over {
  padding-left: 20px;
}

.notebook-nav-h {
  position: relative;
}

.note-book-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.notebook-nav-h:hover .note-book-btn {
  opacity: 1;
}

.el-dropdown-link {
  cursor: pointer;
}
</style>