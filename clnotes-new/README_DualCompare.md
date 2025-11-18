# DualCompare 组件（Vue 3，JS）

功能概览
- 左列原文，右列译文，按段落显示并标注行号（行号由父组件在数据中维护或计算）。
- 双向滚动同步（可通过 syncScroll prop 打开/关闭）。
- 鼠标 hover 段落时，另一侧段落高亮（通过 hoveredId 实现）。
- 段落内支持内联编辑（contenteditable）与全段编辑弹窗。
- 支持文本选中后右键操作：标记成术语（持久化为 annotations JSON）、重新翻译（通过事件通知父组件调用翻译 API）、修改内容（打开编辑器）。
- 所有修改通过 emits 发回父组件（组件为受控组件）。

文件说明
- components/DualCompare.vue — 主容器组件（props / emits）
- components/ParagraphBlock.vue — 段落渲染组件，负责 annotations 高亮与内联编辑
- styles/dual-compare.css — 基础样式

Props & Emits（简要）
- Props:
  - originals: Paragraph[]
  - translations: Paragraph[]
  - syncScroll?: boolean (默认 true)
- Emits:
  - update-original: { id, text }
  - update-translation: { id, text }
  - mark-term: { side, paragraphId, term, annotations } — 当用户标记术语时触发，父组件应将 annotations 持久化（例如保存到数据库或本地 JSON）
  - retranslate-request: { index, paragraphId, sourceText } — 请求父组件执行翻译（父组件可调用后端 API 并在翻译完成后更新 translations）
  - request-edit: { side, paragraphId, text } — 请求父组件打开更复杂的编辑/历史界面

使用示例（父组件）
```vue
<template>
  <DualCompare
    :originals="originals"
    :translations="translations"
    :syncScroll="true"
    @update-original="onUpdateOriginal"
    @update-translation="onUpdateTranslation"
    @mark-term="onMarkTerm"
    @retranslate-request="onRetranslateRequest"
  />
</template>

<script setup>
import { ref } from 'vue';
import DualCompare from '@/components/DualCompare.vue';

const originals = ref([
  { id: 'o-1', text: '这是第一段原文。' },
  { id: 'o-2', text: '第二段原文。' },
]);
const translations = ref([
  { id: 't-1', text: 'First paragraph.' },
  { id: 't-2', text: 'Second paragraph.' },
]);

function onUpdateOriginal(payload) { /* persist original update... */ }
function onUpdateTranslation(payload) { /* persist translation update... */ }
function onMarkTerm(payload) { /* persist annotations JSON for paragraphId */ }
async function onRetranslateRequest(payload) { /* call backend translate API and update translations[payload.index] */ }
</script>
```

扩展建议
- 可将 annotations 存到段落对象外的全局注释表，然后只在渲染层做 join，以便支持跨段落注释/检索。
- 可将 retranslate 请求直接在组件内集成一个可配置的翻译 hook（props 传入 translateFn）。
