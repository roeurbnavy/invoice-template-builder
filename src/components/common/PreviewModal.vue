<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useSettingsStore } from "../../stores/settings.js";
import { getNestedValue, SAMPLE_DATA } from "../../utils/variableResolver.js";

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

const computedTableHeight = computed(() => {
  const itemTable = blockStore.orderedBlocks.find(
    (b) => b.type === "item_table",
  );
  if (!itemTable) return 0;

  const bindingField = itemTable.dataBinding?.field || "items";

  let sourceData = settingsStore.sampleData;
  if (!sourceData || Object.keys(sourceData).length === 0) {
    sourceData = SAMPLE_DATA;
  }
  if (!sourceData) sourceData = {};

  const allItems =
    getNestedValue(sourceData, bindingField) || itemTable.items || [];
  const itemsCount = Array.isArray(allItems) ? allItems.length : 0;

  const headerFontSize =
    itemTable.headerFontSize ?? itemTable.bodyFontSize ?? 12;
  const bodyFontSize = itemTable.bodyFontSize ?? 12;

  // Extract padding sizes
  const hTop = itemTable.headerPaddingTop ?? (itemTable.cellPaddingTop ?? (itemTable.cellPadding ?? 6));
  const hBottom = itemTable.headerPaddingBottom ?? (itemTable.cellPaddingBottom ?? (itemTable.cellPadding ?? 6));
  const headerMinHeight = headerFontSize + hTop + hBottom + 10;
  const headerHeight = itemTable.showHeader !== false ? headerMinHeight : 0;

  const pTop = itemTable.cellPaddingTop ?? (itemTable.cellPadding ?? 5);
  const pBottom = itemTable.cellPaddingBottom ?? (itemTable.cellPadding ?? 5);
  const rowMinHeight = bodyFontSize + pTop + pBottom + 8;

  const defaultRowHeight = itemTable.defaultRowHeight ?? 30;
  let rowsHeight = 0;
  for (let i = 0; i < itemsCount; i++) {
    const customHeight = itemTable.rowStyles?.[i]?.height;
    rowsHeight += Math.max(customHeight ?? defaultRowHeight, rowMinHeight);
  }

  const emptyRowsCount = Math.max(0, (itemTable.emptyRows ?? 0) - itemsCount);
  const emptyRowsHeight = emptyRowsCount * Math.max(defaultRowHeight, rowMinHeight);

  let specialRowsHeight = 0;
  if (Array.isArray(itemTable.specialRows)) {
    itemTable.specialRows.forEach((sr) => {
      if (sr.type === "divider") {
        specialRowsHeight += (sr.thickness ?? 1) + 8;
      } else {
        specialRowsHeight += Math.max(defaultRowHeight, rowMinHeight);
      }
    });
  }

  return headerHeight + rowsHeight + emptyRowsHeight + specialRowsHeight + 10;
});

const tableShiftOffset = computed(() => {
  const itemTable = blockStore.orderedBlocks.find(
    (b) => b.type === "item_table",
  );
  if (!itemTable) return 0;

  const designHeight = parseFloat(itemTable.height) || 200;
  const designY    = parseFloat(itemTable.y) || 0;
  const actualHeight = computedTableHeight.value;

  if (actualHeight <= designHeight) return 0;

  const contentDelta = actualHeight - designHeight;

  // Compute the repeated header height (thead repeats on every new page)
  const headerFontSize = itemTable.headerFontSize ?? itemTable.bodyFontSize ?? 12;
  const hTop    = itemTable.headerPaddingTop ?? (itemTable.cellPaddingTop ?? (itemTable.cellPadding ?? 6));
  const hBottom = itemTable.headerPaddingBottom ?? (itemTable.cellPaddingBottom ?? (itemTable.cellPadding ?? 6));
  const headerH = itemTable.showHeader !== false ? (headerFontSize + hTop + hBottom + 10) : 0;

  const MM_TO_PX = 3.7795;
  const fmt = canvasStore.currentFormat;
  const pageH = fmt?.height ?? 1123;

  const marginTopPx    = (settingsStore.printMarginTop    ?? 0) * MM_TO_PX;
  const marginBottomPx = (settingsStore.printMarginBottom ?? 0) * MM_TO_PX;
  const marginTop1Px   = (settingsStore.printMarginTopFirst ?? 0) * MM_TO_PX;

  const page1Space = (pageH - marginBottomPx) - designY;

  // Each subsequent page: full page minus margins AND minus repeated header
  const subPageRowSpace = pageH - marginTopPx - marginBottomPx - headerH;

  let pageBreaks = 0;
  if (actualHeight > page1Space) {
    let remaining = actualHeight - page1Space;
    pageBreaks = 1;
    while (remaining > subPageRowSpace) {
      remaining -= subPageRowSpace;
      pageBreaks++;
    }
  }

  // Gap added by @page margins at each page break
  const gapFromBreaks = pageBreaks > 0
    ? marginTop1Px + (pageBreaks - 1) * marginTopPx + pageBreaks * marginBottomPx
    : 0;

  // Repeated <thead> adds headerH pixels for each page break
  const repeatedHeaderGap = pageBreaks * headerH;

  return contentDelta + repeatedHeaderGap + gapFromBreaks;
});

const computedDocumentHeight = computed(() => {
  const fmt = canvasStore.currentFormat;
  const pageH = fmt?.height ?? 1123;

  // If the table doesn't overflow, content is designed for exactly one page
  if (tableShiftOffset.value === 0) return pageH;

  // Table overflows — find the true bottom of all shifted blocks
  let maxHeight = pageH;
  blockStore.orderedBlocks.forEach((block) => {
    const blockHeight = parseFloat(block.height) || 0;
    const blockY = parseFloat(block.y) || 0;

    const itemTable = blockStore.orderedBlocks.find(
      (b) => b.type === "item_table",
    );
    const itemTableY = itemTable ? parseFloat(itemTable.y) || 0 : 0;
    const yOffset = (itemTable && blockY > itemTableY) ? tableShiftOffset.value : 0;

    const bottom = blockY + yOffset + blockHeight;
    if (bottom > maxHeight) maxHeight = bottom;
  });

  return maxHeight + 20;
});

const paperStyle = computed(() => {
  const fmt = canvasStore.currentFormat;
  return {
    width: `${fmt?.width ?? 794}px`,
    height: `${computedDocumentHeight.value}px`,
    minHeight: `${fmt?.height ?? 1123}px`,
    background: "#ffffff",
    position: "relative",
    overflow: "visible",
    boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
    borderRadius: "2px",
    flexShrink: 0,
    fontFamily: settingsStore.globalFont || "Noto Sans, sans-serif",
    fontSize: `${settingsStore.globalFontSize || 13}px`,
    color: "#000000",
    "--print-margin-top": `${settingsStore.printMarginTop ?? 15}mm`,
    "--print-margin-bottom": `${settingsStore.printMarginBottom ?? 15}mm`,
    "--print-margin-top-first": `${settingsStore.printMarginTopFirst ?? 0}mm`,
  };
});

const previewBlocks = computed(() => {
  return blockStore.orderedBlocks.filter((b) => {
    if (b.hidden) return false;
    if (b.visibleFormats && !b.visibleFormats.includes(canvasStore.formatId))
      return false;
    return true;
  });
});

function getBlockStyle(block) {
  const itemTable = blockStore.orderedBlocks.find(
    (b) => b.type === "item_table",
  );
  let yOffset = 0;
  const blockY = parseFloat(block.y) || 0;
  const itemTableY = itemTable ? parseFloat(itemTable.y) || 0 : 0;

  if (itemTable && blockY > itemTableY) {
    yOffset = tableShiftOffset.value;
  }
  return {
    position: "absolute",
    left: `${parseFloat(block.x) || 0}px`,
    top: `${blockY + yOffset}px`,
    width: `${parseFloat(block.width) || 0}px`,
    height:
      block.type === "item_table"
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

function getPageBlocks(pageIdx) {
  return previewBlocks.value.map((block) => {
    if (block.type === "carbon_copy_label") {
      const modified = { ...block };
      if (pageIdx === 1) {
        modified.content = block.content || "ORIGINAL";
      } else if (pageIdx === 2) {
        modified.content = "DUPLICATE";
      } else if (pageIdx === 3) {
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
            v-for="pageIdx in printCopies"
            :key="pageIdx"
            :style="paperStyle"
            class="preview-paper"
          >
            <div
              v-for="block in getPageBlocks(pageIdx)"
              :key="block.id"
              :style="getBlockStyle(block)"
            >
              <component
                :is="getRenderer(block.type)"
                :block="block"
                :fill-mode="false"
                style="width: 100%; height: 100%"
              />
            </div>

            <div v-if="previewBlocks.length === 0" class="preview-empty">
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
