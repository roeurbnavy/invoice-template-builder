<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useSettingsStore } from "../../stores/settings.js";
import InvoiceRenderer from "./InvoiceRenderer.vue";

const canvasStore = useCanvasStore();
const blockStore = useBlockStore();
const settingsStore = useSettingsStore();

const visible = ref(false);
let previewModeBackup = false;

const printCopies = ref(1);

function getBlocksForCopy(copyIdx) {
  return blockStore.orderedBlocks.map((block) => {
    if (block.type === "carbon_copy_label") {
      const modified = { ...block };
      if (copyIdx === 1) {
        modified.content = block.content || "ORIGINAL";
      } else if (copyIdx === 2) {
        modified.content = "DUPLICATE";
      } else if (copyIdx === 3) {
        modified.content = "TRIPLICATE";
      }
      return modified;
    }
    return block;
  });
}

watch(
  () => canvasStore.showPreview,
  async (val) => {
    if (val) {
      // settingsStore.setSampleData({ items: fakeData });
      previewModeBackup = canvasStore.previewMode;
      canvasStore.previewMode = true;
      document.body.classList.add("preview-open");
      await nextTick();
      visible.value = true;
    } else {
      document.body.classList.remove("preview-open");
    }
  },
);

function close() {
  canvasStore.previewMode = previewModeBackup;
  canvasStore.showPreview = false;
  visible.value = false;
  document.body.classList.remove("preview-open");
}

function onKeydown(e) {
  if (e.key === "Escape" && visible.value) {
    close();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="preview-overlay" @click.self="close">
      <div class="preview-header">
        <div class="preview-header-left">
          <span class="preview-title">Document Preview</span>
          <span class="preview-badge">{{ settingsStore.documentType }}</span>
          <span class="preview-info">
            {{ canvasStore.currentFormat?.label || "A4" }} ·
            {{ canvasStore.orientation }}
          </span>
        </div>
        <div class="preview-header-right">
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-right: 12px;
            "
          >
            <span class="preview-copies-label">Print Copies:</span>
            <select v-model="printCopies" class="preview-copies-select">
              <option :value="1">1 Copy (Original)</option>
              <option :value="2">2 Copies (Original &amp; Duplicate)</option>
              <option :value="3">
                3 Copies (Original, Duplicate &amp; Triplicate)
              </option>
            </select>
          </div>
          <button class="preview-close-btn" @click="close">Close</button>
        </div>
      </div>

      <div class="preview-body">
        <div
          class="preview-scroll"
          style="display: flex; flex-direction: column"
        >
          <template v-if="blockStore.orderedBlocks.length > 0">
            <InvoiceRenderer
              v-for="copyIdx in printCopies"
              :key="copyIdx"
              :blocks="getBlocksForCopy(copyIdx)"
              :format-id="canvasStore.currentFormat?.id || 'A4'"
              :orientation="canvasStore.orientation"
              :global-font="settingsStore.globalFont || 'Noto Sans, sans-serif'"
              :global-font-size="settingsStore.globalFontSize || 13"
              :layout-mode="settingsStore.layoutMode"
              :repeat-header="settingsStore.repeatHeader"
              :repeat-footer="settingsStore.repeatFooter"
            />
          </template>
          <div v-else class="preview-empty">
            No blocks on canvas. Add blocks to see a preview.
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #16162a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  gap: 12px;
}
.preview-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.preview-badge {
  font-size: 10px;
  font-weight: 600;
  color: #00b4d8;
  background: rgba(0, 180, 216, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
}
.preview-info {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}
.preview-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.preview-print-btn {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  background: #00b4d8;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
}
.preview-print-btn:hover {
  background: #0098b8;
}
.preview-close-btn {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
}
.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.preview-body {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: 30px;
  background: #12121e;
}
.preview-scroll {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.preview-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
}
:deep(.invoice-renderer-sheet) {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  border-radius: 2px !important;
  flex-shrink: 0 !important;
  margin-bottom: 30px !important;
}
:deep(.invoice-renderer-pages:last-child .invoice-renderer-sheet:last-child) {
  margin-bottom: 0 !important;
}
.preview-copies-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.preview-copies-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: white;
  outline: none;
  cursor: pointer;
}
.preview-copies-select option {
  background: #16162a;
  color: white;
}
</style>
