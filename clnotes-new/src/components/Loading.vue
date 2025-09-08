<template>
  <div style="text-align: center; padding: 20px;">
    <el-icon class="is-loading">
      <Loading />
    </el-icon>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/store'
import { Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const handleNavigation = async (nbi) => {
  if (!nbi) {
    router.push('/book')
    return
  }

  try {
    const res = await notesStore.getNotesByBook({ nbi })
    
    if (res && res.rows && res.rows.length > 0) {
      router.push(`/book/${res.rows[0].NoteBook.noteBookId}/note/${res.rows[0].noteId}`)
    } else {
      router.push(`/book/${nbi}`)
    }
  } catch (err) {
    console.error('获取笔记列表失败:', err)
    router.push(`/book/${nbi}`)
  }
}

onMounted(() => {
  handleNavigation(route.params.nbi)
})

// 监听路由参数变化
watch(
  () => route.params.nbi,
  (newNbi, oldNbi) => {
    if (newNbi !== oldNbi) {
      handleNavigation(newNbi)
    }
  }
)
</script>

<style scoped>
.is-loading {
  font-size: 24px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>