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
import {
  notification,
  dismissNotification,
} from "./composables/useNotification.js";

const props = defineProps({
  schemas: { type: Object, default: null },
  sampleData: { type: Object, default: null },
  presets: { type: Object, default: null },
  initialBlocks: { type: Array, default: null },
  fonts: { type: Array, default: null },
  paperFormats: { type: Object, default: null },
  initialName: { type: String, default: null },
});

const emit = defineEmits(["save", "change", "close", "closed"]);

useKeyboardShortcuts();
useExport();

const historyStore = useHistoryStore();
const blockStore = useBlockStore();
const canvasStore = useCanvasStore();
const settingsStore = useSettingsStore();
const templateStore = useTemplateStore();

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

            if (draft.settings.repeatHeader !== undefined)
              settingsStore.setRepeatHeader(draft.settings.repeatHeader);
            if (draft.settings.repeatFooter !== undefined)
              settingsStore.setRepeatFooter(draft.settings.repeatFooter);
            if (draft.settings.layoutMode !== undefined)
              settingsStore.setLayoutMode(draft.settings.layoutMode);
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
        layoutMode: settingsStore.layoutMode,
        repeatHeader: settingsStore.repeatHeader,
        repeatFooter: settingsStore.repeatFooter,
      },
    };
    emit("save", schema);
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

// Toggle migration for layoutMode
watch(
  () => settingsStore.layoutMode,
  (newMode, oldMode) => {
    if (newMode === oldMode) return;
    const pageH = canvasStore.paperDimensions.height;
    const tableBlock = blockStore.blocks.find((b) => b.type === "item_table");
    const tableBottom = tableBlock ? tableBlock.y + tableBlock.height : 532;

    const updatedBlocks = blockStore.blocks.map((b) => {
      const copy = { ...b };
      if (newMode === "sections") {
        if (copy.type === "item_table") {
          copy.section = "table";
        } else if (copy.y < (tableBlock?.y ?? 332)) {
          copy.section = "header";
        } else {
          // Everything after the table goes into footer (relative to table bottom)
          copy.section = "footer";
          copy.y = copy.y - tableBottom;
        }
      } else {
        // sections -> freeform
        // Restore absolute Y for footer blocks (relative to table bottom)
        if (copy.section === "footer") {
          copy.y = copy.y + tableBottom;
        }
        delete copy.section;
      }
      return copy;
    });

    blockStore.setBlocks(updatedBlocks);
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
    () => settingsStore.layoutMode,
    () => settingsStore.repeatHeader,
    () => settingsStore.repeatFooter,
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
        layoutMode: settingsStore.layoutMode,
        repeatHeader: settingsStore.repeatHeader,
        repeatFooter: settingsStore.repeatFooter,
      },
    };
    localStorage.setItem("invoice_builder_draft", JSON.stringify(schema));
    emit("change", schema);
  },
  { deep: true },
);

function handleClose() {
  window.localStorage.removeItem("invoice_builder_draft");
  emit("close");
  emit("closed");
}
</script>

<template>
  <div class="app-layout">
    <TopBar
      @close="handleClose"
      @save="(schema) => emit('save', schema)"
    />
    <div class="app-main">
      <LeftPanel />
      <CanvasWorkspace />
      <InspectorPanel />
    </div>
    <PreviewModal />

    <!-- Toast notification -->
    <Transition name="toast">
      <div
        v-if="notification"
        class="app-toast"
        :class="`app-toast--${notification.type}`"
        @click="dismissNotification"
      >
        <span class="app-toast__icon">
          {{
            notification.type === "warning"
              ? "⚠"
              : notification.type === "error"
                ? "✕"
                : "ℹ"
          }}
        </span>
        <span class="app-toast__msg">{{ notification.message }}</span>
        <button class="app-toast__close" @click.stop="dismissNotification">
          ✕
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.app-toast--warning {
  background: rgba(146, 64, 14, 0.95);
  color: #fde68a;
}
.app-toast--error {
  background: rgba(127, 29, 29, 0.95);
  color: #fca5a5;
}
.app-toast--info {
  background: rgba(12, 74, 110, 0.95);
  color: #bae6fd;
}
.app-toast__icon {
  font-size: 16px;
  flex-shrink: 0;
}
.app-toast__msg {
  flex: 1;
  line-height: 1.4;
}
.app-toast__close {
  background: none;
  border: none;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.7;
  padding: 0 2px;
  flex-shrink: 0;
}
.app-toast__close:hover {
  opacity: 1;
}
/* Slide-up transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
