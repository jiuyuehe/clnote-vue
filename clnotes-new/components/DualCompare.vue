<template>
  <div class="dual-compare">
    <div class="pane left-pane">
      <div class="pane-header">原文</div>
      <div
        class="pane-body"
        ref="leftContainer"
        @scroll="onScroll('left')"
        @contextmenu.prevent="onContextMenu($event, 'left')"
      >
        <ParagraphBlock
          v-for="(p, idx) in localOriginals"
          :key="p.id"
          :paragraph="p"
          :index="idx"
          side="left"
          :hoveredId="hoveredId"
          @hover="onHover"
          @leave="onLeave"
          @updateParagraph="onUpdate('left', $event)"
          @requestEdit="onRequestEdit"
          ref="leftParagraphs"
        />
      </div>
    </div>

    <div class="pane right-pane">
      <div class="pane-header">译文</div>
      <div
        class="pane-body"
        ref="rightContainer"
        @scroll="onScroll('right')"
        @contextmenu.prevent="onContextMenu($event, 'right')"
      >
        <ParagraphBlock
          v-for="(p, idx) in localTranslations"
          :key="p.id"
          :paragraph="p"
          :index="idx"
          side="right"
          :hoveredId="hoveredId"
          @hover="onHover"
          @leave="onLeave"
          @updateParagraph="onUpdate('right', $event)"
          @requestEdit="onRequestEdit"
          ref="rightParagraphs"
        />
      </div>
    </div>

    <!-- 自定义右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <button class="cm-item" @click="markAsTerm" :disabled="!contextMenu.hasSelection">标记成术语</button>
      <button class="cm-item" @click="retranslate" :disabled="!contextMenu.paragraphId">重新翻译</button>
      <button class="cm-item" @click="editParagraph" :disabled="!contextMenu.paragraphId">修改内容</button>
      <button class="cm-item" @click="closeContextMenu">取消</button>
    </div>

    <!-- 简单的编辑弹窗（用于 retranslate / edit content）-->
    <div v-if="editor.visible" class="editor-overlay" @click.self="closeEditor">
      <div class="editor-box">
        <h3>{{ editor.title }}</h3>
        <textarea v-model="editor.text" rows="8"></textarea>
        <div class="editor-actions">
          <button @click="saveEditor">保存</button>
          <button @click="closeEditor">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import ParagraphBlock from './ParagraphBlock.vue';

const props = defineProps({
  originals: { type: Array, default: () => [] },
  translations: { type: Array, default: () => [] },
  syncScroll: { type: Boolean, default: true },
});
const emit = defineEmits(['update-original', 'update-translation', 'mark-term', 'retranslate-request', 'request-edit']);

const localOriginals = ref(JSON.parse(JSON.stringify(props.originals || [])));
const localTranslations = ref(JSON.parse(JSON.stringify(props.translations || [])));

watch(() => props.originals, (v) => { localOriginals.value = v ? JSON.parse(JSON.stringify(v)) : []; }, { deep: true });
watch(() => props.translations, (v) => { localTranslations.value = v ? JSON.parse(JSON.stringify(v)) : []; }, { deep: true });

const leftContainer = ref(null);
const rightContainer = ref(null);
const hoveredId = ref(null);

const contextMenu = reactive({ visible: false, x: 0, y: 0, side: null, paragraphId: null, hasSelection: false, selectedText: '' });
const editor = reactive({ visible: false, title: '', side: null, paragraphId: null, text: '' });
let scrollLock = false;

function onHover(payload) { hoveredId.value = payload.id; }
function onLeave() { hoveredId.value = null; }

function onUpdate(side, payload) {
  if (side === 'left') {
    const p = localOriginals.value.find(x => x.id === payload.id);
    if (p) p.text = payload.text;
    emit('update-original', { id: payload.id, text: payload.text });
  } else {
    const p = localTranslations.value.find(x => x.id === payload.id);
    if (p) p.text = payload.text;
    emit('update-translation', { id: payload.id, text: payload.text });
  }
}

function onRequestEdit(payload) {
  emit('request-edit', { side: payload.side, paragraphId: payload.id, text: payload.text });
}

function onContextMenu(evt, side) {
  let el = evt.target;
  let paragraphId = null;
  const container = side === 'left' ? leftContainer.value : rightContainer.value;
  while (el && el !== container) {
    if (el.dataset && el.dataset.paragraphId) { paragraphId = el.dataset.paragraphId; break; }
    el = el.parentElement;
  }
  const sel = window.getSelection();
  const selectedText = sel ? sel.toString().trim() : '';

  contextMenu.visible = true;
  contextMenu.x = evt.clientX;
  contextMenu.y = evt.clientY;
  contextMenu.side = side;
  contextMenu.paragraphId = paragraphId;
  contextMenu.hasSelection = selectedText.length > 0;
  contextMenu.selectedText = selectedText;
}
function closeContextMenu() { contextMenu.visible = false; }

function markAsTerm() {
  if (!contextMenu.hasSelection || !contextMenu.paragraphId || !contextMenu.side) return;
  const side = contextMenu.side;
  const list = side === 'left' ? localOriginals.value : localTranslations.value;
  const p = list.find(x => x.id === contextMenu.paragraphId);
  if (!p) return;
  const term = contextMenu.selectedText;
  if (!p.annotations) p.annotations = [];
  if (!p.annotations.find(a => a.type === 'term' && a.text === term)) {
    p.annotations.push({ id: `a-${Date.now()}`, type: 'term', text: term });
  }
  emit('mark-term', { side, paragraphId: p.id, term, annotations: p.annotations });
  closeContextMenu();
}

function retranslate() {
  const side = contextMenu.side;
  const paragraphId = contextMenu.paragraphId;
  let index = -1;
  if (side === 'left') index = localOriginals.value.findIndex(x => x.id === paragraphId);
  else index = localTranslations.value.findIndex(x => x.id === paragraphId);
  const sourceText = contextMenu.hasSelection ? contextMenu.selectedText : (side === 'left' && paragraphId ? (localOriginals.value.find(x => x.id === paragraphId) || {}).text || '' : (paragraphId ? (localTranslations.value.find(x => x.id === paragraphId) || {}).text || '' : ''));
  emit('retranslate-request', { index, paragraphId, sourceText });
  closeContextMenu();
}

function editParagraph() {
  if (!contextMenu.paragraphId || !contextMenu.side) return;
  const list = contextMenu.side === 'left' ? localOriginals.value : localTranslations.value;
  const p = list.find(x => x.id === contextMenu.paragraphId);
  if (!p) return;
  openEditor('编辑段落', contextMenu.side, p.id, p.text);
  closeContextMenu();
}

function openEditor(title, side, paragraphId, text) { editor.visible = true; editor.title = title; editor.side = side; editor.paragraphId = paragraphId; editor.text = text || ''; }
function closeEditor() { editor.visible = false; editor.paragraphId = null; editor.text = ''; }
function saveEditor() { if (!editor.paragraphId || !editor.side) { closeEditor(); return; } onUpdate(editor.side, { id: editor.paragraphId, text: editor.text }); closeEditor(); }

let scrollTimer = null;
function onScroll(side) {
  if (!props.syncScroll) return;
  if (scrollLock) return;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => syncScroll(side), 20);
}
function syncScroll(side) {
  const srcContainer = side === 'left' ? leftContainer.value : rightContainer.value;
  const dstContainer = side === 'left' ? rightContainer.value : leftContainer.value;
  if (!srcContainer || !dstContainer) return;
  scrollLock = true;
  try {
    const srcParagraphEls = Array.from(srcContainer.querySelectorAll('.paragraph'));
    const srcRect = srcContainer.getBoundingClientRect();
    let topIndex = 0;
    for (let i = 0; i < srcParagraphEls.length; i++) {
      const r = srcParagraphEls[i].getBoundingClientRect();
      if (r.bottom > srcRect.top + 2) { topIndex = i; break; }
    }
    const dstParagraphEls = Array.from(dstContainer.querySelectorAll('.paragraph'));
    const target = dstParagraphEls[topIndex] || dstParagraphEls[dstParagraphEls.length - 1];
    if (target) {
      dstContainer.scrollTop = target.offsetTop - (srcParagraphEls[topIndex] ? srcParagraphEls[topIndex].offsetTop : 0) + srcContainer.scrollTop;
    }
  } finally {
    setTimeout(() => (scrollLock = false), 50);
  }
}

if (typeof window !== 'undefined') window.addEventListener('click', () => { contextMenu.visible = false; });
</script>

<style src="../styles/dual-compare.css"></style>
