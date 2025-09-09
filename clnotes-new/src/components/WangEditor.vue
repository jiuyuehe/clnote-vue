<template>
  <div class="wang-editor">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 500px; overflow-y: hidden;"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import Cookies from 'js-cookie'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  onTextChange: {
    type: Function,
    default: () => {}
  },
  onImageUpdate: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['update:modelValue'])

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

const valueHtml = ref('')
const mode = 'default' // 或 'simple'

const toolbarConfig = {
  // 工具栏配置
}

const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    // 配置上传图片
    uploadImage: {
      server: '/upload/stream',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*'],
      headers: {
        'ct': Cookies.get('ct') || (import.meta.env.DEV 
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs'
          : ''),
        'cv': '3.6.0',
        'utt': 'fdfs',
        'dft': 'public'
      },

      // 自定义插入图片
      customInsert(res, insertFn) {
        console.log('上传图片结果:', res)
        
        if (res.status && res.status.startsWith("err_")) {
          console.error("上传图片失败")
          return
        }
        
        // 构造图片 URL
        const url = 'http://192.168.0.29/' + res.fsFileName
        insertFn(url, '', '')
        
        // 调用外部回调
        props.onImageUpdate(res.fsFileName)
      },

      // 上传错误
      onError(file, err, res) {
        console.error('图片上传出错', err, res)
      }
    }
  }
}

const handleCreated = (editor) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

const handleChange = (editor) => {
  const html = editor.getHtml()
  emit('update:modelValue', html)
  props.onTextChange()
}

// 监听外部 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== valueHtml.value) {
    valueHtml.value = newVal
  }
}, { immediate: true })

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 暴露方法给父组件
defineExpose({
  getHtml: () => editorRef.value?.getHtml() || '',
  getText: () => editorRef.value?.getText() || '',
  setHtml: (html) => {
    if (editorRef.value) {
      editorRef.value.setHtml(html)
    }
  },
  disable: (val) => {
    if (editorRef.value) {
      if (val) {
        editorRef.value.disable()
      } else {
        editorRef.value.enable()
      }
    }
  }
})
</script>

<style scoped>
.wang-editor {
  border: 1px solid #ccc;
  z-index: 100; /* 按需定义 */
}
</style>