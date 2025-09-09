<template>
  <el-container style="height: 100vh; background: #f5f7fa;">
    <el-aside width="250px" style="background: #ffffff; border-right: 1px solid #e4e7ed; height: 100%;">
      <Nav />
    </el-aside>
    <el-main style="background: #ffffff; height: 100%; padding: 0;">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import Nav from '@/components/Nav.vue'
import { useNotesStore } from '@/store'
import { onMounted } from 'vue'

const notesStore = useNotesStore()

onMounted(() => {
  notesStore.getNotebooks()
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #f5f7fa;
}

#app {
  height: 100%;
}

/* 全局样式优化 */
* {
  box-sizing: border-box;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 组件样式覆盖 - 简约蓝白主题 */
.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.el-dialog {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.el-input__wrapper {
  border-radius: 4px;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #409eff;
}
</style>
