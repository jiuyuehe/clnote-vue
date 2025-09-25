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
                <div class="scope-desc">需要输入访问密码才能查看</div>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 私密分享时的密码输入 -->
      <div v-if="shareForm.shareScope === 'private'" class="form-item">
        <label class="form-label">访问密码</label>
        <el-input
          v-model="shareForm.sharePwd"
          type="password"
          placeholder="请设置访问密码（4-20位）"
          maxlength="20"
          show-password
        />
        <div class="form-tip">密码长度为4-20位，建议使用数字和字母组合</div>
      </div>

      <!-- 有效期设置 -->
      <div class="form-item">
        <label class="form-label">有效期</label>
        <el-radio-group v-model="shareForm.expireType" class="expire-group">
          <el-radio value="permanent">永久有效</el-radio>
          <el-radio value="custom">自定义时间</el-radio>
        </el-radio-group>
        
        <div v-if="shareForm.expireType === 'custom'" class="expire-date-section">
          <el-date-picker
            v-model="shareForm.expireTime"
            type="date"
            placeholder="选择过期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            style="width: 100%; margin-top: 8px;"
          />
          <div class="form-tip">分享链接将在选定日期的 23:59:59 过期</div>
        </div>
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
          <p><strong>访问权限:</strong> {{ shareForm.accessPermission === 'readonly' ? '只读' : '可编辑' }}</p>
          <p><strong>分享范围:</strong> {{ shareForm.shareScope === 'public' ? '公开' : '私密' }}</p>
          <p v-if="shareForm.shareScope === 'private'"><strong>访问密码:</strong> {{ shareForm.sharePwd }}</p>
          <p v-if="shareForm.expireType === 'custom'"><strong>过期时间:</strong> {{ shareForm.expireTime }}</p>
          <p v-else><strong>有效期:</strong> 永久有效</p>
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
  sharePwd: '',
  expireType: 'permanent',
  expireTime: ''
})

const shareResult = ref(null)
const isSharing = ref(false)

const availableNotes = computed(() => notesStore.noteList)

const resetForm = () => {
  shareForm.value = {
    noteId: props.noteId || null,
    accessPermission: 'readonly',
    shareScope: 'public',
    sharePwd: '',
    expireType: 'permanent',
    expireTime: ''
  }
  shareResult.value = null
}

const handleShare = async () => {
  if (!shareForm.value.noteId) {
    ElMessage.error('请选择要分享的笔记')
    return
  }

  // 验证私密分享（密码保护）
  if (shareForm.value.shareScope === 'private') {
    if (!shareForm.value.sharePwd.trim()) {
      ElMessage.error('私密分享需要设置访问密码')
      return
    }
    if (shareForm.value.sharePwd.length < 4 || shareForm.value.sharePwd.length > 20) {
      ElMessage.error('访问密码长度应为4-20位')
      return
    }
  }

  // 验证有效期
  if (shareForm.value.expireType === 'custom') {
    if (!shareForm.value.expireTime) {
      ElMessage.error('请选择过期日期')
      return
    }
  }

  isSharing.value = true
  
  try {
    const params = {
      noteId: shareForm.value.noteId,
      accessPermission: shareForm.value.accessPermission,
      shareScope: shareForm.value.shareScope
    }
    
    // 添加私密分享密码参数
    if (shareForm.value.shareScope === 'private') {
      params.password = shareForm.value.sharePwd
    }

    // 添加有效期参数
    if (shareForm.value.expireType === 'custom') {
      params.expireTime = shareForm.value.expireTime
    }

    const res = await notesStore.shareNote(params)
    
    if (res && res.data) {
      shareResult.value = {
        ...res.data,
        shareUrl: `${window.location.origin}/noteshare.html?nsc=${res.data.noteShareCode}`
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

// 限制日期选择（只能选择今天及以后的日期）
const disabledDate = (time) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() < today.getTime()
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
  display: flex;
  flex-direction: column;
}

.permission-option,
.scope-option {
  width: 100%;
  height: 54px;
  margin-bottom: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
  box-sizing: border-box;
  margin-right: 0 !important;
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
  height: 100%;
}

.permission-title,
.scope-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
  font-size: 14px;
  line-height: 1.2;
}

.permission-desc,
.scope-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.3;
  word-break: break-all;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.expire-group {
  margin-bottom: 12px;
}

.expire-date-section {
  margin-top: 8px;
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