<template>
  <el-dialog
    v-model="visible"
    title="分享笔记"
    width="500px"
    class="share-dialog"
    @closed="resetForm"
  >
    <div class="share-form">
      <!-- 笔记选择 -->
      <div class="form-item">
        <label class="form-label">选择笔记</label>
        <el-select
          v-model="shareForm.noteId"
          placeholder="请选择要分享的笔记"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="note in availableNotes"
            :key="note.noteId"
            :label="note.noteName"
            :value="note.noteId"
          />
        </el-select>
      </div>

      <!-- 访问权限 -->
      <div class="form-item">
        <label class="form-label">访问权限</label>
        <el-radio-group v-model="shareForm.accessPermission" class="permission-group">
          <el-radio value="readonly" class="permission-option">
            <div class="permission-content">
              <el-icon><View /></el-icon>
              <div>
                <div class="permission-title">只读</div>
                <div class="permission-desc">其他人只能查看，无法编辑</div>
              </div>
            </div>
          </el-radio>
          <el-radio value="editable" class="permission-option">
            <div class="permission-content">
              <el-icon><Edit /></el-icon>
              <div>
                <div class="permission-title">可编辑</div>
                <div class="permission-desc">其他人可以查看和编辑笔记</div>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 分享范围 -->
      <div class="form-item">
        <label class="form-label">分享范围</label>
        <el-radio-group v-model="shareForm.shareScope" class="scope-group">
          <el-radio value="public" class="scope-option">
            <div class="scope-content">
              <el-icon><Link /></el-icon>
              <div>
                <div class="scope-title">公开</div>
                <div class="scope-desc">任何人通过链接都可以访问</div>
              </div>
            </div>
          </el-radio>
          <el-radio value="private" class="scope-option">
            <div class="scope-content">
              <el-icon><Lock /></el-icon>
              <div>
                <div class="scope-title">私密</div>
                <div class="scope-desc">只有您指定的人可以访问</div>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 私密分享时的用户输入 -->
      <div v-if="shareForm.shareScope === 'private'" class="form-item">
        <label class="form-label">指定用户（邮箱）</label>
        <el-input
          v-model="shareForm.privateEmails"
          type="textarea"
          :rows="3"
          placeholder="请输入用户邮箱，多个邮箱用逗号分隔"
        />
      </div>

      <!-- 分享链接结果 -->
      <div v-if="shareResult" class="share-result">
        <label class="form-label">分享链接</label>
        <el-input
          v-model="shareResult.shareUrl"
          readonly
          class="share-url-input"
        >
          <template #append>
            <el-button @click="copyShareUrl" :icon="DocumentCopy">
              复制
            </el-button>
          </template>
        </el-input>
        <div class="share-info">
          <p><strong>分享码:</strong> {{ shareResult.noteShareCode }}</p>
          <p><strong>创建时间:</strong> {{ formatDate(shareResult.createTime) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleShare"
          :loading="isSharing"
        >
          {{ shareResult ? '重新分享' : '创建分享' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { View, Edit, Link, Lock, DocumentCopy } from '@element-plus/icons-vue'
import { useNotesStore } from '@/store'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  noteId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'shared'])

const notesStore = useNotesStore()

const visible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const shareForm = ref({
  noteId: null,
  accessPermission: 'readonly',
  shareScope: 'public',
  privateEmails: ''
})

const shareResult = ref(null)
const isSharing = ref(false)

const availableNotes = computed(() => notesStore.noteList)

const resetForm = () => {
  shareForm.value = {
    noteId: props.noteId || null,
    accessPermission: 'readonly',
    shareScope: 'public',
    privateEmails: ''
  }
  shareResult.value = null
}

const handleShare = async () => {
  if (!shareForm.value.noteId) {
    ElMessage.error('请选择要分享的笔记')
    return
  }

  if (shareForm.value.shareScope === 'private' && !shareForm.value.privateEmails.trim()) {
    ElMessage.error('私密分享需要指定用户邮箱')
    return
  }

  isSharing.value = true
  
  try {
    const params = {
      noteId: shareForm.value.noteId,
      accessPermission: shareForm.value.accessPermission,
      shareScope: shareForm.value.shareScope
    }
    
    if (shareForm.value.shareScope === 'private') {
      params.privateEmails = shareForm.value.privateEmails
    }

    const res = await notesStore.shareNote(params)
    
    if (res && res.data) {
      shareResult.value = {
        ...res.data,
        shareUrl: `${window.location.origin}/#/share?code=${res.data.noteShareCode}`
      }
      
      ElMessage.success('分享创建成功')
      emit('shared', res.data)
    } else {
      ElMessage.error('分享创建失败')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享创建失败')
  } finally {
    isSharing.value = false
  }
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareResult.value.shareUrl)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const closeDialog = () => {
  visible.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 当 props.noteId 变化时，更新表单
import { watch } from 'vue'
watch(() => props.noteId, (newNoteId) => {
  if (newNoteId) {
    shareForm.value.noteId = newNoteId
  }
})
</script>

<style scoped>
.share-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.share-form {
  padding: 20px 0;
}

.form-item {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}

.permission-group,
.scope-group {
  width: 100%;
}

.permission-option,
.scope-option {
  width: 100%;
  margin-bottom: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.permission-option:hover,
.scope-option:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
}

.permission-option.is-checked,
.scope-option.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.permission-content,
.scope-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permission-title,
.scope-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.permission-desc,
.scope-desc {
  font-size: 12px;
  color: #909399;
}

.share-result {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.share-url-input {
  margin-bottom: 12px;
}

.share-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>