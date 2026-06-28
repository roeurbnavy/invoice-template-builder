<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useSettingsStore } from "../../stores/settings.js";
import { getNestedValue, SAMPLE_DATA } from "../../utils/variableResolver.js";
import { computeTableShiftOffset } from "../../utils/tableLayout.js";

// Block renderers — same as CanvasBlock.vue
import TextBlockRenderer from "../blocks/TextBlockRenderer.vue";
import ImageBlockRenderer from "../blocks/ImageBlockRenderer.vue";
import DividerBlockRenderer from "../blocks/DividerBlockRenderer.vue";
import SpacerBlockRenderer from "../blocks/SpacerBlockRenderer.vue";
import ShapeBlockRenderer from "../blocks/ShapeBlockRenderer.vue";
import FieldRowBlockRenderer from "../blocks/FieldRowBlockRenderer.vue";
import DocumentTitleBlockRenderer from "../blocks/DocumentTitleBlockRenderer.vue";
import ItemTableBlockRenderer from "../blocks/ItemTableBlockRenderer.vue";
import TotalsBlockRenderer from "../blocks/TotalsBlockRenderer.vue";
import SignatureBlockRenderer from "../blocks/SignatureBlockRenderer.vue";
import HeaderGridBlockRenderer from "../blocks/HeaderGridBlockRenderer.vue";
import ContainerBlockRenderer from "../blocks/ContainerBlockRenderer.vue";
import CompanyInfoBlockRenderer from "../blocks/CompanyInfoBlockRenderer.vue";
import ClientInfoBlockRenderer from "../blocks/ClientInfoBlockRenderer.vue";
import NotesBlockRenderer from "../blocks/NotesBlockRenderer.vue";
import BankDetailsBlockRenderer from "../blocks/BankDetailsBlockRenderer.vue";
import WatermarkBlockRenderer from "../blocks/WatermarkBlockRenderer.vue";
import GenericBlockRenderer from "../blocks/GenericBlockRenderer.vue";
import CheckboxesRowBlockRenderer from "../blocks/CheckboxesRowBlockRenderer.vue";
import CutLineBlockRenderer from "../blocks/CutLineBlockRenderer.vue";
import CarbonCopyLabelBlockRenderer from "../blocks/CarbonCopyLabelBlockRenderer.vue";
import BarcodeBlockRenderer from "../blocks/BarcodeBlockRenderer.vue";
import TableBlockRenderer from "../blocks/TableBlockRenderer.vue";
import PageBreakBlockRenderer from "../blocks/PageBreakBlockRenderer.vue";

const RENDERERS = {
  text: TextBlockRenderer,
  dynamic_text: TextBlockRenderer,
  image: ImageBlockRenderer,
  divider: DividerBlockRenderer,
  spacer: SpacerBlockRenderer,
  shape: ShapeBlockRenderer,
  container: ContainerBlockRenderer,
  field_row: FieldRowBlockRenderer,
  header_grid: HeaderGridBlockRenderer,
  document_title: DocumentTitleBlockRenderer,
  document_number: DocumentTitleBlockRenderer,
  issue_date: FieldRowBlockRenderer,
  due_date: FieldRowBlockRenderer,
  reference_number: FieldRowBlockRenderer,
  item_table: ItemTableBlockRenderer,
  totals_block: TotalsBlockRenderer,
  subtotal: TotalsBlockRenderer,
  discount: TotalsBlockRenderer,
  tax: TotalsBlockRenderer,
  grand_total: TotalsBlockRenderer,
  signature_line: SignatureBlockRenderer,
  company_info: CompanyInfoBlockRenderer,
  client_info: ClientInfoBlockRenderer,
  notes: NotesBlockRenderer,
  terms: NotesBlockRenderer,
  footer_note: NotesBlockRenderer,
  thank_you: NotesBlockRenderer,
  bank_details: BankDetailsBlockRenderer,
  watermark: WatermarkBlockRenderer,
  payment_qr: ImageBlockRenderer,
  checkboxes_row: CheckboxesRowBlockRenderer,
  cut_line: CutLineBlockRenderer,
  carbon_copy_label: CarbonCopyLabelBlockRenderer,
  page_number: TextBlockRenderer,
  balance_due: TotalsBlockRenderer,
  deposit_paid: TotalsBlockRenderer,
  barcode: BarcodeBlockRenderer,
  table: TableBlockRenderer,
  page_break: PageBreakBlockRenderer,
};

const canvasStore = useCanvasStore();
const blockStore = useBlockStore();
const settingsStore = useSettingsStore();

const visible = ref(false);
let previewModeBackup = false;

import { paginateTemplate } from "../../utils/pagination.js";

const pages = computed(() => {
  const format = canvasStore.currentFormat || { id: "A4", label: "A4", width: 794, height: 1123, isThermal: false };
  return paginateTemplate(blockStore.orderedBlocks, null, format, settingsStore);
});

const allPreviewPages = computed(() => {
  const templatePages = pages.value;
  const list = [];

  for (let copyIdx = 1; copyIdx <= printCopies.value; copyIdx++) {
    templatePages.forEach((page) => {
      const pageCopy = {
        height: page.height,
        blocks: page.blocks.map(block => {
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
        })
      };
      list.push(pageCopy);
    });
  }
  return list;
});

function getPageStyle(page) {
  const fmt = canvasStore.currentFormat;
  return {
    width: `${fmt?.width ?? 794}px`,
    height: `${page.height}px`,
    minHeight: `${fmt?.height ?? 1123}px`,
    background: "#ffffff",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
    borderRadius: "2px",
    flexShrink: 0,
    fontFamily: settingsStore.globalFont || "Noto Sans, sans-serif",
    fontSize: `${settingsStore.globalFontSize || 13}px`,
    color: "#000000",
  };
}

function getBlockStyle(block) {
  return {
    position: "absolute",
    left: `${parseFloat(block.x) || 0}px`,
    top: `${parseFloat(block.y) || 0}px`,
    width: `${parseFloat(block.width) || 0}px`,
    height:
      block.type === "item_table" || block.type === "table"
        ? "auto"
        : `${parseFloat(block.height) || 0}px`,
    transform: block.rotation ? `rotate(${block.rotation}deg)` : "none",
    opacity: block.opacity ?? 1,
    zIndex: block.zIndex ?? 0,
    pointerEvents: "none",
  };
}

function getRenderer(type) {
  return RENDERERS[type] ?? GenericBlockRenderer;
}

const printCopies = ref(1);

watch(
  () => canvasStore.showPreview,
  async (val) => {
    if (val) {
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
            <span style="font-size: 11px; color: rgba(255, 255, 255, 0.6)"
              >Print Copies:</span
            >
            <select
              v-model="printCopies"
              style="
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 11px;
                color: white;
                outline: none;
                cursor: pointer;
              "
            >
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
          style="display: flex; flex-direction: column; gap: 30px"
        >
          <div
            v-for="(page, pageIdx) in allPreviewPages"
            :key="pageIdx"
            :style="getPageStyle(page)"
            class="preview-paper"
          >
            <div
              v-for="block in page.blocks"
              :key="block.id"
              :style="getBlockStyle(block)"
            >
              <component
                :is="getRenderer(block.type)"
                :block="block"
                :fill-mode="false"
                :style="{
                  width: '100%',
                  height: block.type === 'item_table' || block.type === 'table' ? 'auto' : '100%'
                }"
              />
            </div>

            <div v-if="page.blocks.length === 0" class="preview-empty">
              No blocks on canvas. Add blocks to see a preview.
            </div>
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
</style>
