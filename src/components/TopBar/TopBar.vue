<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useSettingsStore } from "../../stores/settings.js";
import { useTemplateStore } from "../../stores/template.js";
import { useHistoryStore } from "../../stores/history.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useFormatMigration } from "../../composables/useFormatMigration.js";
import {
  FileText,
  Building2,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  PenLine,
  Layout,
  ChevronDown,
  SwitchCamera,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Printer,
  Eye,
  EyeOff,
  Grid3x3,
  Sun,
  Moon,
  X,
  HelpCircle,
} from "@lucide/vue";

import ConfirmModal from "../common/ConfirmModal.vue";

const emit = defineEmits(["close", "save"]);

const canvasStore = useCanvasStore();
const settingsStore = useSettingsStore();
const templateStore = useTemplateStore();
const historyStore = useHistoryStore();
const blockStore = useBlockStore();
const { switchFormat, switchOrientation } = useFormatMigration();

const showConfirmModal = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmType = ref("warning");
const confirmCallback = ref(null);
const cancelCallback = ref(null);

function triggerConfirm(title, message, type, onConfirm, onCancel) {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmType.value = type || "warning";
  confirmCallback.value = onConfirm;
  cancelCallback.value = onCancel;
  showConfirmModal.value = true;
}

function handleConfirmModal() {
  if (confirmCallback.value) confirmCallback.value();
  showConfirmModal.value = false;
}

function handleCancelModal() {
  if (cancelCallback.value) cancelCallback.value();
  showConfirmModal.value = false;
}

const showSaveModal = ref(false);
const saveName = ref(templateStore.currentTemplateName);
const showHelpModal = ref(false);

// ─── Export loading & toast ───────────────────────────────────
const toast = ref({ visible: false, message: "", type: "success" });
let toastTimer = null;

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  toast.value = { visible: true, message, type };
  toastTimer = setTimeout(() => {
    toast.value.visible = false;
  }, 3500);
}

// ─── Formats ─────────────────────────────────────────────────
const formats = ["A4", "A5", "RECEIPT_58", "RECEIPT_80"];
const formatLabels = {
  A4: "A4",
  A5: "A5",
  RECEIPT_58: "58mm",
  RECEIPT_80: "80mm",
};

// ─── Template Name Input Handlers ─────────────────────────────
function handleNameInput(val) {
  if (val.trim()) {
    templateStore.currentTemplateName = val;
  }
}

function handleNameBlur(e) {
  const val = e.target.value.trim();
  if (!val) {
    e.target.value = templateStore.currentTemplateName || "Untitled Template";
  } else {
    templateStore.currentTemplateName = val;
  }
  e.target.style.border = "1px dashed transparent";
  e.target.style.background = "transparent";
}

// ─── Undo / Redo ─────────────────────────────────────────────
function handleUndo() {
  const snapshot = historyStore.undo();
  if (snapshot) blockStore.setBlocks(snapshot);
}
function handleRedo() {
  const snapshot = historyStore.redo();
  if (snapshot) blockStore.setBlocks(snapshot);
}

// ─── Save to browser (localStorage) ──────────────────────────
function handleSave() {
  saveName.value = templateStore.currentTemplateName;
  showSaveModal.value = true;
}

function confirmSave() {
  const schema = buildSchema(saveName.value);
  emit("save", schema);
  showSaveModal.value = false;
  showToast(`✓ "${saveName.value}" saved`, "success");
}

// ─── Save to device (download JSON) ──────────────────────────
function downloadJson() {
  const schema = buildSchema(
    saveName.value || templateStore.currentTemplateName,
  );
  templateStore.exportAsJson(schema);
  showSaveModal.value = false;
}

function buildSchema(name) {
  return {
    name,
    format: canvasStore.formatId,
    orientation: canvasStore.orientation,
    blocks: JSON.parse(JSON.stringify(blockStore.blocks)),
    settings: {
      globalFont: settingsStore.globalFont,
      globalFontSize: settingsStore.globalFontSize,
      documentType: settingsStore.documentType,
      layoutMode: settingsStore.layoutMode,
      repeatHeader: settingsStore.repeatHeader,
      repeatFooter: settingsStore.repeatFooter,
    },
  };
}

// ─── Print ───────────────────────────────────────────────────
async function handlePrint() {
  const backupZoom = canvasStore.zoom;
  const backupFillMode = canvasStore.fillMode;
  const backupShowPreview = canvasStore.showPreview;

  // Set zoom to 1, disable fill mode, and show preview to render the paginated InvoiceRenderer
  canvasStore.showPreview = true;
  canvasStore.setZoom(1);
  canvasStore.setFillMode(false);

  // Wait for Vue's next tick and a short timeout to let the browser compute the layout reflow
  await nextTick();
  await new Promise((r) => setTimeout(r, 300));

  window.print();

  // Restore state after print dialog closes
  setTimeout(() => {
    canvasStore.showPreview = backupShowPreview;
    canvasStore.setZoom(backupZoom);
    canvasStore.setFillMode(backupFillMode);
  }, 500);
}

// ─── Document type & reset ────────────────────────────────────
function handleDocumentTypeChange(e) {
  const newType = e.target.value;
  if (blockStore.blocks.length === 0) {
    settingsStore.setDocumentType(newType);
    const { width, height } = canvasStore.paperDimensions;
    blockStore.loadPreset(newType, width, height);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
    return;
  }

  triggerConfirm(
    "Load Preset Layout",
    `Load default preset layout for "${newType}"? This will overwrite your current canvas.`,
    "warning",
    () => {
      settingsStore.setDocumentType(newType);
      const { width, height } = canvasStore.paperDimensions;
      blockStore.loadPreset(newType, width, height);
      historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
    },
    () => {
      settingsStore.setDocumentType(newType);
    },
  );
}

function handleResetToDefault() {
  const currentType = settingsStore.documentType;
  triggerConfirm(
    "Reset Canvas",
    `Reset the canvas to the default layout for "${currentType}"? This will overwrite your current changes.`,
    "warning",
    () => {
      const { width, height } = canvasStore.paperDimensions;
      blockStore.loadPreset(currentType, width, height);
      historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
    },
  );
}

const isLightTheme = ref(true);

onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    isLightTheme.value = false;
    document.body.classList.remove("light");
  } else {
    isLightTheme.value = true;
    document.body.classList.add("light");
  }
});

function toggleTheme() {
  isLightTheme.value = !isLightTheme.value;
  if (isLightTheme.value) {
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light");
    localStorage.setItem("theme", "dark");
  }
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-scroll">
      <!-- Logo -->
      <div class="topbar-logo">
        <FileText :size="18" />
        <span>Invoice Builder</span>
      </div>

      <div class="topbar-sep" />

      <!-- Template Name Editor -->
      <div style="display: flex; align-items: center; gap: 4px">
        <input
          type="text"
          :value="templateStore.currentTemplateName"
          class="inp"
          style="
            background: transparent;
            border: 1px dashed transparent;
            font-size: 12px;
            font-weight: 500;
            color: var(--color-panel-text);
            width: 140px;
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.15s ease;
          "
          placeholder="Template Name"
          title="Click to rename template"
          @input="handleNameInput($event.target.value)"
          @blur="handleNameBlur"
          @keydown.enter="$event.target.blur()"
          onfocus="
            this.style.border = '1px solid var(--color-panel-border)';
            this.style.background = 'var(--color-input-bg)';
          "
        />
      </div>

      <div class="topbar-sep" />

      <!-- Document Type -->
      <select
        :value="settingsStore.documentType"
        class="topbar-select"
        @change="handleDocumentTypeChange"
      >
        <option v-for="dt in settingsStore.documentTypes" :key="dt" :value="dt">
          {{ dt }}
        </option>
      </select>

      <div class="topbar-sep" />

      <!-- Paper Formats -->
      <div class="format-toggle" style="display: flex; gap: 2px">
        <button
          v-for="(val, key) in canvasStore.paperFormats"
          :key="key"
          class="format-btn"
          :class="{ active: canvasStore.formatId === key }"
          @click="switchFormat(key)"
        >
          {{ val.label || key }}
        </button>
      </div>

      <!-- Orientation Toggle -->
      <button
        class="btn btn-ghost btn-icon"
        data-tooltip="Toggle Orientation"
        @click="
          switchOrientation(
            canvasStore.orientation === 'portrait' ? 'landscape' : 'portrait',
          )
        "
      >
        <SwitchCamera :size="14" />
      </button>

      <div class="topbar-sep" />

      <!-- Undo / Redo -->
      <button
        class="btn btn-ghost btn-icon"
        :class="{ 'opacity-40': !historyStore.canUndo }"
        data-tooltip="Undo (Ctrl+Z)"
        :disabled="!historyStore.canUndo"
        @click="handleUndo"
      >
        <RotateCcw :size="14" />
      </button>
      <button
        class="btn btn-ghost btn-icon"
        :class="{ 'opacity-40': !historyStore.canRedo }"
        data-tooltip="Redo (Ctrl+Shift+Z)"
        :disabled="!historyStore.canRedo"
        @click="handleRedo"
      >
        <RotateCw :size="14" />
      </button>

      <div class="topbar-sep" />

      <!-- Save -->
      <button
        class="btn btn-ghost"
        data-tooltip="Save template changes"
        @click="handleSave"
      >
        <Save :size="13" />
        Save
      </button>

      <!-- Reset to Default -->
      <button
        class="btn btn-ghost text-warning"
        data-tooltip="Reset to default preset"
        @click="handleResetToDefault"
      >
        <RefreshCw :size="13" />
        Reset
      </button>

      <!-- Ruler -->
      <button
        class="btn btn-ghost"
        :class="{ active: canvasStore.showRulers }"
        data-tooltip="Toggle Ruler"
        @click="canvasStore.showRulers = !canvasStore.showRulers"
      >
        <Layout :size="13" />
        Ruler
      </button>

      <!-- Grid -->
      <button
        class="btn btn-ghost"
        :class="{ active: canvasStore.showGrid }"
        data-tooltip="Toggle Grid"
        @click="canvasStore.showGrid = !canvasStore.showGrid"
      >
        <Grid3x3 :size="13" />
        Grid
      </button>

      <!-- Preview -->
      <button
        class="btn btn-ghost"
        data-tooltip="Preview rendered document (sample data)"
        @click="canvasStore.showPreview = true"
      >
        <Eye :size="13" />
        Preview
      </button>

      <!-- Print -->
      <button
        class="btn btn-ghost"
        data-tooltip="Print (Ctrl+P)"
        @click="handlePrint"
      >
        <Printer :size="13" />
        Print
      </button>

      <div class="topbar-sep" />

      <!-- Closed -->
      <button
        class="btn btn-ghost text-danger"
        data-tooltip="Close Builder"
        @click="emit('close')"
      >
        <X :size="13" />
        Closed
      </button>

      <!-- Shortcuts / Help -->
      <button
        class="btn btn-ghost"
        data-tooltip="View Keyboard Shortcuts & Guide"
        @click="showHelpModal = true"
      >
        <HelpCircle :size="13" />
        Shortcuts
      </button>

      <div class="topbar-sep" />

      <!-- Theme Toggle -->
      <button
        class="btn btn-ghost btn-icon"
        :data-tooltip="
          isLightTheme ? 'Switch to Dark Mode' : 'Switch to Light Mode'
        "
        @click="toggleTheme"
      >
        <component :is="isLightTheme ? Moon : Sun" :size="13" />
      </button>
    </div>
  </header>

  <!-- ─── Save Modal ─────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showSaveModal"
      class="fixed inset-0 z-9999 flex items-center justify-center p-4 backdrop-blur-md"
      style="background: rgba(15, 23, 42, 0.45)"
      @click.self="showSaveModal = false"
    >
      <div
        class="panel"
        style="
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 420px;
          border: 1px solid var(--color-panel-border);
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.15),
            0 8px 10px -6px rgba(0, 0, 0, 0.15);
          animation: modalEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        "
      >
        <div
          style="
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          "
        >
          <div
            style="
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: rgba(0, 180, 216, 0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--color-accent);
              flex-shrink: 0;
            "
          >
            <FileText :size="20" />
          </div>
          <div style="flex: 1">
            <h3
              style="
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 4px 0;
                color: var(--color-panel-text);
              "
            >
              Save Template
            </h3>
            <p
              style="
                font-size: 11px;
                color: var(--color-panel-muted);
                margin: 0;
                line-height: 1.5;
              "
            >
              "Save" stores the template. "Download .json" saves a copy to your
              device.
            </p>
          </div>
        </div>

        <div class="field-single" style="margin-bottom: 24px">
          <label
            class="field-label"
            style="display: block; margin-bottom: 6px; font-weight: 600"
            >Template Name</label
          >
          <input
            v-model="saveName"
            class="inp"
            placeholder="My Invoice Template"
            style="padding: 8px 12px; font-size: 12px; border-radius: 8px"
          />
        </div>

        <div
          class="flex gap-2 justify-end"
          style="
            border-top: 1px solid var(--color-panel-border);
            padding-top: 16px;
          "
        >
          <button
            class="btn btn-ghost"
            style="padding: 8px 16px; border-radius: 8px"
            @click="showSaveModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-panel"
            style="
              gap: 5px;
              padding: 8px 16px;
              border-radius: 8px;
              border: 1px solid var(--color-panel-border);
            "
            @click="downloadJson"
          >
            <Download :size="13" />
            Download .json
          </button>
          <button
            class="btn btn-accent"
            style="
              gap: 5px;
              padding: 8px 16px;
              border-radius: 8px;
              font-weight: 600;
            "
            @click="confirmSave"
          >
            <Save :size="13" />
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ─── Toast notification ────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="toast.visible"
      class="export-toast"
      :class="`export-toast--${toast.type}`"
    >
      {{ toast.message }}
    </div>
  </Teleport>

  <!-- ─── Keyboard Shortcuts Modal ───────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showHelpModal"
      class="fixed inset-0 z-9999 flex items-center justify-center p-4 backdrop-blur-md"
      style="background: rgba(10, 10, 20, 0.65)"
      @click.self="showHelpModal = false"
    >
      <div
        class="confirm-modal-card panel"
        style="
          border-radius: 14px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          border: 1px solid var(--color-panel-border);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
          animation: modalEntrance 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: var(--color-panel);
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--color-panel-border); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; border-radius: 6px; background: rgba(0, 180, 216, 0.15); display: flex; align-items: center; justify-content: center; color: var(--color-accent);">
              <HelpCircle :size="16" />
            </div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--color-panel-text, #ffffff);">Keyboard Shortcuts & Guide</h3>
          </div>
          <button
            class="btn btn-ghost btn-icon"
            style="width: 28px; height: 28px;"
            @click="showHelpModal = false"
          >
            <X :size="14" />
          </button>
        </div>

        <div style="max-height: 380px; overflow-y: auto; padding-right: 6px; margin-bottom: 20px;">
          <div style="display: flex; flex-direction: column;">
            
            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Undo Action</span>
              <kbd class="shortcut-kbd">Ctrl + Z</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Redo Action</span>
              <kbd class="shortcut-kbd">Ctrl + Y / ⇧⌘Z</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Copy selected block</span>
              <kbd class="shortcut-kbd">Ctrl + C</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Paste copied block</span>
              <kbd class="shortcut-kbd">Ctrl + V</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Duplicate selected block</span>
              <kbd class="shortcut-kbd">Ctrl + D</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Lock / Unlock block</span>
              <kbd class="shortcut-kbd">Ctrl + L</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Delete selected blocks</span>
              <kbd class="shortcut-kbd">Backspace / Del</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Nudge selected block (1px)</span>
              <kbd class="shortcut-kbd">Arrow Keys</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Nudge selected block (10px)</span>
              <kbd class="shortcut-kbd">Shift + Arrow Keys</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Zoom In / Out</span>
              <kbd class="shortcut-kbd">Ctrl + (+) / (-)</kbd>
            </div>

            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Select multiple blocks</span>
              <kbd class="shortcut-kbd">Shift + Click blocks</kbd>
            </div>
            
            <div class="shortcut-row">
              <span style="font-size: 12px; font-weight: 500; color: var(--color-panel-text);">Deselect selection</span>
              <kbd class="shortcut-kbd">Escape</kbd>
            </div>

          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button
            class="btn btn-accent"
            style="padding: 8px 20px; font-size: 12px; font-weight: 600;"
            @click="showHelpModal = false"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ─── Confirmation Modal ────────────────────────────── -->
  <ConfirmModal
    :show="showConfirmModal"
    :title="confirmTitle"
    :message="confirmMessage"
    :type="confirmType"
    @confirm="handleConfirmModal"
    @cancel="handleCancelModal"
  />
</template>

<style scoped>
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.export-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  animation: toast-in 0.2s ease;
}
.export-toast--success {
  background: rgba(34, 197, 94, 0.92);
  color: #fff;
}
.export-toast--error {
  background: rgba(239, 68, 68, 0.92);
  color: #fff;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
@keyframes modalEntrance {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.shortcut-kbd {
  background: var(--color-input-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--color-panel-border, rgba(255, 255, 255, 0.15));
  color: var(--color-panel-text, #ffffff);
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-family: monospace;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px dashed var(--color-panel-border, rgba(255, 255, 255, 0.08));
}
.shortcut-row:last-child {
  border-bottom: none;
}
</style>
