<script setup>
import { onMounted, watch } from "vue";
import TopBar from "./components/TopBar/TopBar.vue";
import LeftPanel from "./components/LeftPanel/LeftPanel.vue";
import CanvasWorkspace from "./components/Canvas/CanvasWorkspace.vue";
import InspectorPanel from "./components/Inspector/InspectorPanel.vue";
import PreviewModal from "./components/common/PreviewModal.vue";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts.js";
import { useExport } from "./composables/useExport.js";
import { useHistoryStore } from "./stores/history.js";
import { useBlockStore } from "./stores/blocks.js";
import { useCanvasStore } from "./stores/canvas.js";
import { useSettingsStore } from "./stores/settings.js";
import { useTemplateStore } from "./stores/template.js";

const props = defineProps({
  schemas: { type: Object, default: null },
  sampleData: { type: Object, default: null },
  presets: { type: Object, default: null },
  initialBlocks: { type: Array, default: null },
  fonts: { type: Array, default: null },
  paperFormats: { type: Object, default: null },
  initialName: { type: String, default: null }
})

const emit = defineEmits(['save', 'change', 'close', 'closed'])

useKeyboardShortcuts()
useExport()

const historyStore = useHistoryStore()
const blockStore = useBlockStore()
const canvasStore = useCanvasStore()
const settingsStore = useSettingsStore()
const templateStore = useTemplateStore()

onMounted(() => {
  // Inject dynamic schemas / sampleData / presets if passed
  if (props.schemas) settingsStore.setDocumentSchemas(props.schemas);
  if (props.sampleData) settingsStore.setSampleData(props.sampleData);
  if (props.presets) blockStore.setDocumentPresets(props.presets);
  if (props.fonts) settingsStore.fonts = props.fonts;
  if (props.paperFormats) canvasStore.setPaperFormats(props.paperFormats);
  if (props.initialName) templateStore.currentTemplateName = props.initialName;

  let loaded = false;

  // Load initial blocks from props if provided
  if (props.initialBlocks && Array.isArray(props.initialBlocks)) {
    blockStore.setBlocks(props.initialBlocks);
    loaded = true;
  } else {
    // Fallback to loading draft from localStorage if it exists
    const draftStr = localStorage.getItem("invoice_builder_draft");
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft && Array.isArray(draft.blocks)) {
          blockStore.setBlocks(draft.blocks);
          if (draft.format) canvasStore.setFormat(draft.format);
          if (draft.orientation) canvasStore.setOrientation(draft.orientation);
          if (draft.name) templateStore.currentTemplateName = draft.name;
          if (draft.settings) {
            if (draft.settings.documentType)
              settingsStore.setDocumentType(draft.settings.documentType);
            if (draft.settings.globalFont)
              settingsStore.setGlobalFont(draft.settings.globalFont);
            if (draft.settings.globalFontSize)
              settingsStore.setGlobalFontSize(draft.settings.globalFontSize);
            if (draft.settings.printMarginTop !== undefined)
              settingsStore.setPrintMarginTop(draft.settings.printMarginTop);
            if (draft.settings.printMarginBottom !== undefined)
              settingsStore.setPrintMarginBottom(draft.settings.printMarginBottom);
            if (draft.settings.printMarginTopFirst !== undefined)
              settingsStore.setPrintMarginTopFirst(draft.settings.printMarginTopFirst);
          }
          loaded = true;
        }
      } catch (e) {
        console.error("Failed to load draft from localStorage:", e);
      }
    }
  }

  // Load default layout on initial load if no draft loaded and canvas is blank
  if (!loaded && blockStore.blocks.length === 0) {
    const { width, height } = canvasStore.paperDimensions;
    const defaultType = props.schemas
      ? Object.keys(props.schemas)[0]
      : "Custom";
    blockStore.loadPreset(defaultType || "Custom", width, height);
  }

  // Push initial state to history
  historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));

  // Listen for save shortcut event
  document.addEventListener("app:save", () => {
    document.dispatchEvent(new CustomEvent("app:do-save"));
  });

  document.addEventListener("app:do-save", () => {
    const schema = {
      name: templateStore.currentTemplateName,
      format: canvasStore.formatId,
      orientation: canvasStore.orientation,
      blocks: JSON.parse(JSON.stringify(blockStore.blocks)),
      settings: {
        documentType: settingsStore.documentType,
        globalFont: settingsStore.globalFont,
        globalFontSize: settingsStore.globalFontSize,
        printMarginTop: settingsStore.printMarginTop,
        printMarginBottom: settingsStore.printMarginBottom,
        printMarginTopFirst: settingsStore.printMarginTopFirst,
      },
    };
    emit('save', schema);
  });
});

// Apply global font to all blocks when changed
watch(
  () => settingsStore.globalFont,
  (newFont) => {
    const updated = blockStore.blocks.map((b) => {
      if ("fontFamily" in b) {
        return { ...b, fontFamily: newFont };
      }
      return b;
    });
    blockStore.setBlocks(updated);
  },
);

// Auto-save watch
watch(
  [
    () => blockStore.blocks,
    () => canvasStore.formatId,
    () => canvasStore.orientation,
    () => settingsStore.documentType,
    () => settingsStore.globalFont,
    () => settingsStore.globalFontSize,
    () => settingsStore.printMarginTop,
    () => settingsStore.printMarginBottom,
    () => settingsStore.printMarginTopFirst,
    () => templateStore.currentTemplateName,
  ],
  () => {
    const schema = {
      name: templateStore.currentTemplateName,
      format: canvasStore.formatId,
      orientation: canvasStore.orientation,
      blocks: JSON.parse(JSON.stringify(blockStore.blocks)),
      settings: {
        documentType: settingsStore.documentType,
        globalFont: settingsStore.globalFont,
        globalFontSize: settingsStore.globalFontSize,
        printMarginTop: settingsStore.printMarginTop,
        printMarginBottom: settingsStore.printMarginBottom,
        printMarginTopFirst: settingsStore.printMarginTopFirst,
      },
    };
    localStorage.setItem("invoice_builder_draft", JSON.stringify(schema));
    emit('change', schema);
  },
  { deep: true },
);
</script>

<template>
  <div class="app-layout">
    <TopBar @close="emit('close'); emit('closed')" @save="(schema) => emit('save', schema)" />
    <div class="app-main">
      <LeftPanel />
      <CanvasWorkspace />
      <InspectorPanel />
    </div>
    <PreviewModal />
  </div>
</template>
