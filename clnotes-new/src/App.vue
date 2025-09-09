<template>
  <el-container style="height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <el-aside width="280px" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-right: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);">
      <Nav />
    </el-aside>
    <el-container style="background: #ffffff; border-radius: 16px 0 0 0; overflow: hidden;">
      <router-view />
    </el-container>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Element Plus 组件样式覆盖 */
.el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-dialog {
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.el-input__inner {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-input__inner:focus {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}
</style>
