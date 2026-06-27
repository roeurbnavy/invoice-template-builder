<script setup>
import { onMounted, watch } from 'vue'
import TopBar from './components/TopBar/TopBar.vue'
import LeftPanel from './components/LeftPanel/LeftPanel.vue'
import CanvasWorkspace from './components/Canvas/CanvasWorkspace.vue'
import InspectorPanel from './components/Inspector/InspectorPanel.vue'
import PreviewModal from './components/common/PreviewModal.vue'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'
import { useExport } from './composables/useExport.js'
import { useHistoryStore } from './stores/history.js'
import { useBlockStore } from './stores/blocks.js'
import { useCanvasStore } from './stores/canvas.js'
import { useSettingsStore } from './stores/settings.js'
import { useTemplateStore } from './stores/template.js'

useKeyboardShortcuts()
useExport()

const historyStore = useHistoryStore()
const blockStore = useBlockStore()
const canvasStore = useCanvasStore()
const settingsStore = useSettingsStore()
const templateStore = useTemplateStore()

onMounted(() => {
  // Load draft from localStorage if it exists
  const draftStr = localStorage.getItem('invoice_builder_draft')
  let loaded = false
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr)
      if (draft && Array.isArray(draft.blocks)) {
        blockStore.setBlocks(draft.blocks)
        if (draft.format) canvasStore.setFormat(draft.format)
        if (draft.orientation) canvasStore.setOrientation(draft.orientation)
        if (draft.name) templateStore.currentTemplateName = draft.name
        if (draft.settings) {
          if (draft.settings.company) settingsStore.setCompany(draft.settings.company)
          if (draft.settings.documentType) settingsStore.setDocumentType(draft.settings.documentType)
          if (draft.settings.currency) settingsStore.setCurrency(draft.settings.currency)
          if (draft.settings.globalFont) settingsStore.setGlobalFont(draft.settings.globalFont)
          if (draft.settings.globalFontSize) settingsStore.setGlobalFontSize(draft.settings.globalFontSize)
        }
        loaded = true
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage:', e)
    }
  }

  // Load default layout on initial load if no draft loaded and canvas is blank
  if (!loaded && blockStore.blocks.length === 0) {
    const { width, height } = canvasStore.paperDimensions
    blockStore.loadPreset('Custom', width, height)
  }

  // Push initial state to history
  historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)))

  // Listen for save shortcut event
  document.addEventListener('app:save', () => {
    document.dispatchEvent(new CustomEvent('app:do-save'))
  })
})

// Apply global font to all blocks when changed
watch(
    () => settingsStore.globalFont,
    (newFont) => {
        const updated = blockStore.blocks.map(b => {
            if ('fontFamily' in b) {
                return { ...b, fontFamily: newFont };
            }
            return b;
        });
        blockStore.setBlocks(updated);
    }
);

// Auto-save watch
watch(
  [
    () => blockStore.blocks,
    () => canvasStore.formatId,
    () => canvasStore.orientation,
    () => settingsStore.company,
    () => settingsStore.documentType,
    () => settingsStore.currency,
    () => settingsStore.globalFont,
    () => settingsStore.globalFontSize,
    () => templateStore.currentTemplateName,
  ],
  () => {
    const schema = {
      name: templateStore.currentTemplateName,
      format: canvasStore.formatId,
      orientation: canvasStore.orientation,
      blocks: JSON.parse(JSON.stringify(blockStore.blocks)),
      settings: {
        company: settingsStore.company,
        documentType: settingsStore.documentType,
        currency: settingsStore.currency,
        globalFont: settingsStore.globalFont,
        globalFontSize: settingsStore.globalFontSize,
      },
    }
    localStorage.setItem('invoice_builder_draft', JSON.stringify(schema))
  },
  { deep: true }
)
</script>

<template>
  <div class="app-layout">
    <TopBar />
    <div class="app-main">
      <LeftPanel />
      <CanvasWorkspace />
      <InspectorPanel />
    </div>
    <PreviewModal />
  </div>
</template>
