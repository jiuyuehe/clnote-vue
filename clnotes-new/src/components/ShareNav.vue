<template>
  <div class="share-nav">
    <el-container>
      <el-main>
        <div class="share-content">
          <h2>我的分享</h2>
          <el-table :data="shareNoteList" style="width: 100%">
            <el-table-column prop="noteName" label="笔记名称" width="300" />
            <el-table-column prop="shareTime" label="分享时间" width="200">
              <template #default="scope">
                {{ formatDate(scope.row.shareTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="shareUrl" label="分享链接" min-width="300">
              <template #default="scope">
                <el-input
                  :value="getShareUrl(scope.row.shareId)"
                  readonly
                  style="margin-right: 10px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button
                  size="small"
                  @click="copyShareUrl(scope.row.shareId)"
                >
                  复制链接
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="cancelShare(scope.row)"
                >
                  取消分享
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-if="shareNoteList.length === 0" description="暂无分享的笔记" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/store'
import { ElMessage, ElMessageBox } from 'element-plus'

const notesStore = useNotesStore()

const shareNoteList = computed(() => notesStore.shareNoteList)

const getShareUrl = (shareId) => {
  return `${window.location.origin}/noteshare.html?shareId=${shareId}`
}

const copyShareUrl = async (shareId) => {
  const url = getShareUrl(shareId)
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
      await notesStore.cancelShareNote({ shareId: item.shareId })
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
</style>