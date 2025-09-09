<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #f5f5f5; border-right: 1px solid lightgray">
      <Nav />
    </el-aside>
    <el-container>
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
}

#app {
  height: 100%;
}
</style>
