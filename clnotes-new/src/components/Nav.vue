<template>
  <div class="nav">
    <div class="book-opt">
      <div class="action-buttons">
        <el-button 
          type="primary" 
          size="small" 
          :icon="Plus" 
          @click="newNote"
          class="action-btn"
        >
          新建笔记
        </el-button>
        <el-button 
          type="default" 
          size="small" 
          :icon="Notebook" 
          @click="showModal()"
          class="action-btn"
        >
          新建笔记本
        </el-button>
        <el-button 
          type="default" 
          size="small" 
          :icon="Search" 
          @click="toggleSearch"
          class="action-btn"
        >
          搜索
        </el-button>
        <el-button 
          type="default" 
          size="small" 
          :icon="Share" 
          @click="showShareDialog"
          class="action-btn"
        >
          分享
        </el-button>
      </div>
      
      <!-- 搜索输入框 -->
      <div v-show="showSearchInput" class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记..."
          :prefix-icon="Search"
          @input="handleSearch"
          @keyup.enter="handleSearch"
          clearable
        />
      </div>
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
          <el-icon><Collection /></el-icon><span> 分类</span>
        </div>
        <ul class="category-list">
          <li 
            v-for="category in categories" 
            :key="category.id" 
            class="category-item"
            :class="{ active: selectedCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <div class="category-content">
              <div 
                class="category-color" 
                :style="{ backgroundColor: category.color }"
              ></div>
              <span>{{ category.name }}</span>
            </div>
          </li>
        </ul>
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

    <!-- 分享对话框 -->
    <ShareDialog
      v-model="showShareModal"
      @shared="handleShared"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotesStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, ArrowDown, Document, Notebook, ArrowDownBold, Search, Share, Collection } from '@element-plus/icons-vue'
import { sysHandler } from '@/utils/sysHandler'
import ShareDialog from './ShareDialog.vue'

const router = useRouter()
const route = useRoute()
const notesStore = useNotesStore()

// 响应式数据
const visible = ref(false)
const bookName = ref('')
const renameId = ref(undefined)
const bookNameInput = ref(null)
const showSearchInput = ref(false)
const searchKeyword = ref('')
const showShareModal = ref(false)

// 计算属性
const notebooks = computed(() => notesStore.notebooks)
const categories = computed(() => notesStore.categories)
const selectedCategory = computed(() => notesStore.selectedCategory)

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

const toggleSearch = () => {
  showSearchInput.value = !showSearchInput.value
  if (!showSearchInput.value) {
    searchKeyword.value = ''
  }
}

const handleSearch = () => {
  // TODO: Implement search functionality
  console.log('搜索关键词:', searchKeyword.value)
}

const showShareDialog = () => {
  showShareModal.value = true
}

const handleShared = (shareData) => {
  console.log('笔记分享成功:', shareData)
  // 可以在这里添加成功后的处理逻辑
}

const selectCategory = (categoryId) => {
  notesStore.setSelectedCategory(selectedCategory.value === categoryId ? null : categoryId)
}

onMounted(() => {
  // 组件挂载后的初始化
})
</script>

<style scoped>
.nav {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.book-opt {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  flex: 1;
  min-width: 80px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-container {
  margin-top: 12px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.notebook-nav {
  display: block;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin-bottom: 4px;
  backdrop-filter: blur(10px);
}

.notebook-nav:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateX(4px);
}

.notebook-nav.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.category-list {
  padding-left: 20px;
}

.category-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateX(4px);
}

.category-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
</style>