<template>
  <div class="wang-editor">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      class="editor-content"
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
import { getFixedCt } from '@/utils/auth'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'image-update', 'video-update'])

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
        'ct': getFixedCt() || (import.meta.env.DEV 
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs'
          : ''),
        'cv': '3.6.0',
        'utt': 'fdfs',
        'dft': 'public'
      },

      // 自定义form data
      customBrowseAndUpload: null,
      
      // 文件上传前的钩子，可以添加额外参数
      onBeforeUpload(file) {
        return file
      },

      // 自定义上传参数
      meta: {},
      
      // 重写上传方法来添加自定义参数
      customUpload(file, insertFn) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('param', JSON.stringify({
          fileName: file.name,
          fileSize: file.size
        }))

        fetch('/upload/stream', {
          method: 'POST',
          headers: {
            'ct': getFixedCt() || (import.meta.env.DEV 
              ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs'
              : ''),
            'cv': '3.6.0',
            'utt': 'fdfs',
            'dft': 'public'
          },
          body: formData
        })
        .then(response => response.json())
        .then(res => {
          console.log('上传图片结果:', res)
          
          if (res.status && res.status.startsWith("err_")) {
            console.error("上传图片失败")
            return
          }
          
          // 构造图片 URL
          const url = window.location.origin + '/' + res.fsFileName
          insertFn(url, '', '')
          
          // 调用外部回调
          emit('image-update', res.fsFileName)
        })
        .catch(err => {
          console.error('图片上传出错', err)
        })
      },

      // 上传错误
      onError(file, err, res) {
        console.error('图片上传出错', err, res)
      }
    },

    // 配置上传视频
    uploadVideo: {
      server: '/upload/stream',
      fieldName: 'file',
      maxFileSize: 500 * 1024 * 1024, // 50M
      maxNumberOfFiles: 5,
      allowedFileTypes: ['video/*'],
      headers: {
        'ct': getFixedCt() || (import.meta.env.DEV 
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs'
          : ''),
        'cv': '3.6.0',
        'utt': 'fdfs',
        'dft': 'public'
      },

      // 自定义form data
      customBrowseAndUpload: null,
      
      // 文件上传前的钩子，可以添加额外参数
      onBeforeUpload(file) {
        return file
      },

      // 自定义上传参数
      meta: {},
      
      // 重写上传方法来添加自定义参数
      customUpload(file, insertFn) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('param', JSON.stringify({
          fileName: file.name,
          fileSize: file.size
        }))

        fetch('/upload/stream', {
          method: 'POST',
          headers: {
            'ct': getFixedCt() || (import.meta.env.DEV 
              ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJlbnRJZCI6MSwidGltZSI6MTUwOTk4MjAyNywia2V5IjoiYm5pNDVwYTFuYmJmIiwiaWF0IjoxNTA5OTgyMDI3fQ.Z55zBSLCH265w28B_tJawH725q2uHUXdZHm4m2adOLs'
              : ''),
            'cv': '3.6.0',
            'utt': 'fdfs',
            'dft': 'public'
          },
          body: formData
        })
        .then(response => response.json())
        .then(res => {
          console.log('上传视频结果:', res)
          
          if (res.status && res.status.startsWith("err_")) {
            console.error("上传视频失败")
            return
          }
          
          // 构造视频 URL
          const url = window.location.origin + '/' + res.fsFileName
          insertFn(url, '', '')
          
          // 调用外部回调
          emit('video-update', res.fsFileName)
        })
        .catch(err => {
          console.error('视频上传出错', err)
        })
      },

      // 上传错误
      onError(file, err, res) {
        console.error('视频上传出错', err, res)
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
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid #ccc;
  background: #fafafa;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
}

/* 重写编辑器内部样式 */
.wang-editor :deep(.w-e-text-container) {
  height: 100% !important;
}

.wang-editor :deep(.w-e-scroll) {
  height: 100% !important;
  overflow-y: auto !important;
}

.wang-editor :deep(.w-e-text-placeholder) {
  top: 10px;
  left: 10px;
}
</style>