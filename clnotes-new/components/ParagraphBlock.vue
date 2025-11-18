<template>
  <div
    class="paragraph"
    :class="{ hovered: hoveredId === paragraph.id, editing: editing }"
    :data-paragraph-id="paragraph.id"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="line-number">{{ index + 1 }}</div>
    <div class="content-wrapper">
      <div
        class="content"
        :contenteditable="editing"
        @dblclick="requestFullEdit"
        @input="onInput"
        @blur="onBlur"
        ref="contentEl"
        v-html="renderedHTML"
      ></div>
      <div v-if="!editing" class="actions">
        <button class="small" @click="startEdit">编辑</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';

const props = defineProps({ paragraph: Object, index: Number, side: String, hoveredId: [String, Number] });
const emit = defineEmits(['hover', 'leave', 'updateParagraph', 'requestEdit']);

const editing = ref(false);
const contentEl = ref(null);

watch(() => props.paragraph.text, (v) => { if (!editing.value && contentEl.value) { contentEl.value.innerText = v || ''; } }, { deep: true });

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\\]\]/g, '\$&'); }

const renderedHTML = computed(() => {
  const text = props.paragraph.text || '';
  const annotations = props.paragraph.annotations || [];
  let escaped = escapeHtml(text);
  annotations.forEach(a => {
    if (a.type === 'term' && a.text) {
      const termEsc = escapeRegExp(a.text);
      const re = new RegExp(termEsc, 'g');
      escaped = escaped.replace(re, `<mark class="term">${a.text}</mark>`);
    }
  });
  return escaped.replace(/\n/g, '<br/>');
});

function onMouseEnter() { emit('hover', { side: props.side, id: props.paragraph.id }); }
function onMouseLeave() { emit('leave'); }

function startEdit() {
  editing.value = true;
  nextTick(() => {
    if (contentEl.value) {
      contentEl.value.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(contentEl.value);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  });
}

function onInput() { if (!contentEl.value) return; const text = contentEl.value.innerText; emit('updateParagraph', { id: props.paragraph.id, text }); }
function onBlur() { editing.value = false; }
function requestFullEdit() { emit('requestEdit', { side: props.side, id: props.paragraph.id, text: props.paragraph.text || '' }); }
</script>

<style scoped>
.paragraph { display: flex; padding: 10px 12px; border-bottom: 1px solid var(--border-color, #eee); align-items: flex-start; gap: 12px; }
.paragraph.hovered { background: rgba(220, 240, 255, 0.45); }
.line-number { min-width: 36px; color: var(--muted, #888); text-align: right; padding-right: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }
.content-wrapper { flex: 1; display: flex; align-items: flex-start; gap: 8px; }
.content { width: 100%; outline: none; white-space: pre-wrap; word-break: break-word; }
.content[contenteditable="true"] { background: #fffbe6; border-radius: 6px; padding: 6px; box-shadow: inset 0 0 0 1px #ffe58f; }
mark.term { background: #fffae6; color: #a16207; padding: 0 4px; border-radius: 3px; }
.actions { margin-left: 6px; }
.small { font-size: 12px; padding: 4px 6px; }
</style>
