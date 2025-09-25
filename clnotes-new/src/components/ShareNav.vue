<template>
  <div class="share-nav">
    <el-container>
      <el-main>
        <div class="share-content">
          <h2>我的分享</h2>
          <el-table :data="shareNoteList" style="width: 100%">
            <el-table-column prop="Note.noteName" label="笔记名称" width="300">
              <template #default="scope">
                {{ scope.row.Note ? scope.row.Note.noteName : '未知笔记' }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="分享时间" width="200">
              <template #default="scope">
                {{ formatDate(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="shareUrl" label="分享链接" min-width="300">
              <template #default="scope">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="share-url">{{ getShareUrl(scope.row.noteShareCode) }}</span>
                  <el-button size="small" type="text" @click="copyShareUrl(scope.row.noteShareCode)">复制</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    @click="copyShareUrl(scope.row.noteShareCode)"
                  >
                    复制
                  </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      @click="openEdit(scope.row)"
                    >
                      修改
                    </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="cancelShare(scope.row)"
                  >
                    取消
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <!-- 编辑分享对话框 -->
          <el-dialog v-model="editDialogVisible" title="修改分享设置" width="500px">
            <div class="share-form">
              <div class="form-item">
                <label>访问权限</label>
                <el-radio-group v-model="editForm.accessPermission">
                  <el-radio label="readonly">只读</el-radio>
                  <el-radio label="editable">可编辑</el-radio>
                </el-radio-group>
              </div>

              <div class="form-item">
                <label>分享范围</label>
                <el-radio-group v-model="editForm.shareScope">
                  <el-radio label="public">公开</el-radio>
                  <el-radio label="private">私密</el-radio>
                </el-radio-group>
              </div>

              <div v-if="editForm.shareScope === 'private'" class="form-item">
                <label>访问密码</label>
                <el-input v-model="editForm.sharePwd" placeholder="设置访问密码"></el-input>
              </div>

              <div class="form-item">
                <label>有效期</label>
                <el-radio-group v-model="editForm.expireType">
                  <el-radio label="permanent">永久</el-radio>
                  <el-radio label="custom">自定义</el-radio>
                </el-radio-group>
                <el-date-picker v-if="editForm.expireType === 'custom'" v-model="editForm.expireTime"
                  format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
             type="date" placeholder="选择过期日期" style="width:100%; margin-top:8px;" />
              </div>
            </div>
            <template #footer>
              <div style="text-align:right">
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitEdit">保存</el-button>
              </div>
            </template>
          </el-dialog>
          
          <el-empty v-if="shareNoteList.length === 0" description="暂无分享的笔记" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { createFetch } from '@/utils/fetch-creator'
import { useNotesStore } from '@/store'
import { ElMessage, ElMessageBox } from 'element-plus'

const notesStore = useNotesStore()

const shareNoteList = computed(() => notesStore.shareNoteList)

const getShareUrl = (noteShareId) => {
  return `${window.location.origin}/noteshare.html?nsc=${noteShareId}`
}

const copyShareUrl = async (noteShareId) => {
  const url = getShareUrl(noteShareId)
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('链接已复制到剪贴板')
  }
}

const cancelShare = (item) => {
  ElMessageBox.confirm(
    '取消分享后，分享链接将失效，确定要取消分享吗？',
    '取消分享',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await notesStore.cancelShareNote({ noteShareId: item.noteShareId })
      ElMessage.success('已取消分享')
      // 重新获取分享列表
      notesStore.getShareNotes()
    } catch (err) {
      console.error('取消分享失败:', err)
      ElMessage.error('取消分享失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  notesStore.getShareNotes()
})

// 编辑对话框状态
const editDialogVisible = ref(false)
const editForm = reactive({
  noteShareId: null,
  accessPermission: 'readonly',
  shareScope: 'public',
  sharePwd: '',
  expireType: 'permanent',
  expireTime: ''
})

const openEdit = (row) => {
  editForm.noteShareId = row.noteShareId
  editForm.accessPermission = row.accessPermission || 'readonly'
  editForm.shareScope = row.shareScope || 'public'
  editForm.sharePwd = row.sharePwd || ''
  editForm.expireType = row.expireTime ? 'custom' : 'permanent'
  editForm.expireTime = row.expireTime || ''
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.noteShareId) return
  try {
    const params = {
      accessPermission: editForm.accessPermission,
      shareScope: editForm.shareScope
    }
    if (editForm.shareScope === 'private') {
      // 后端期望字段为 password
      params.password = editForm.sharePwd
    }
    if (editForm.expireType === 'custom') {
      params.expireTime = editForm.expireTime
    }

    // Prefer store method; if missing (hot-reload issue), fallback to createFetch
    if (typeof notesStore.updateShareNote === 'function') {
      await notesStore.updateShareNote(editForm.noteShareId, params)
    } else {
      await createFetch({ url: `/note/share/${editForm.noteShareId}`, method: 'put', body: params })
    }

    ElMessage.success('修改成功')
    editDialogVisible.value = false
    notesStore.getShareNotes()
  } catch (err) {
    console.error('修改分享失败:', err)
    ElMessage.error('修改失败')
  }
}

</script>

<style scoped>
.share-nav {
  height: 100%;
}

.share-content {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #303133;
}

.el-button + .el-button {
  margin-left: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
}

.share-form .form-item {
  margin-bottom: 16px;
}
.share-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}

.share-url {
  color: #409eff;
  word-break: break-all;
  font-size: 13px;
}
</style>