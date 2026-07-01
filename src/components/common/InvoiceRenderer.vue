<script setup>
import { computed, ref, provide, onMounted, watch } from "vue";
const emit = defineEmits(["ready"]);
import {
  PAPER_FORMATS,
  getFormatDimensions,
} from "../../constants/paperFormats.js";
// import { getNestedValue, SAMPLE_DATA } from "../../utils/variableResolver.js";
import { useSettingsStore } from "../../stores/settings.js";
// import { computeTableShiftOffset } from "../../utils/tableLayout.js";

// Block renderers — same as PreviewModal.vue
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

const props = defineProps({
  blocks: { type: Array, required: true },
  data: { type: Object, default: null },
  formatId: { type: String, default: "A4" },
  orientation: { type: String, default: "portrait" },
  globalFont: { type: String, default: "Noto Sans, sans-serif" },
  globalFontSize: { type: Number, default: 13 },
  layoutMode: { type: String, default: null },
  repeatHeader: { type: Boolean, default: null },
  repeatFooter: { type: Boolean, default: null },
});

const pageSizeCss = computed(() => `${props.formatId} ${props.orientation}`);

// Merged active settings, prioritizing props over Pinia global state
const activeSettings = computed(() => {
  let settingsStore = null;
  try {
    settingsStore = useSettingsStore();
  } catch (e) {}

  return {
    layoutMode: props.layoutMode !== null ? props.layoutMode : (settingsStore?.layoutMode || 'freeform'),
    repeatHeader: props.repeatHeader !== null ? props.repeatHeader : (settingsStore?.repeatHeader || false),
    repeatFooter: props.repeatFooter !== null ? props.repeatFooter : (settingsStore?.repeatFooter || false),
    globalFont: props.globalFont || settingsStore?.globalFont || 'Noto Sans, sans-serif',
    globalFontSize: props.globalFontSize || settingsStore?.globalFontSize || 13,
  };
});

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

import { paginateTemplate } from "../../utils/pagination.js";
import { resolveBlockBinding, resolveVariables } from "../../utils/variableResolver.js";

const pages = computed(() => {
  const format = PAPER_FORMATS[props.formatId] || PAPER_FORMATS.A4;
  const data = paginateTemplate(
    props.blocks,
    props.data,
    format,
    activeSettings.value,
  );
  return data;
});

const tableMeasurements = ref({});

const registerTableHeight = (instanceId, height) => {
  tableMeasurements.value[instanceId] = height;
};

provide("registerTableHeight", registerTableHeight);

const estimateBlockHeight = (block) => {
  const height = parseFloat(block.height) || 32;
  if (!["text", "field_row", "notes", "bank_details", "carbon_copy_label"].includes(block.type)) {
    return height;
  }

  // Estimate text content
  let text = "";
  let fontSize = parseFloat(block.fontSize) || 13;
  let lineHeight = block.lineHeight || 1.4;
  let width = parseFloat(block.width) || 200;

  if (block.type === "text" || block.type === "notes" || block.type === "bank_details" || block.type === "carbon_copy_label") {
    let content = block.content || "";
    try {
      content = resolveVariables(content, props.data, true);
    } catch(e) {}
    text = content;
  } else if (block.type === "field_row") {
    // For field row, the value container is narrower
    const labelW = parseFloat(block.labelWidth) || 40;
    width = width * (1 - labelW / 100) - 10;
    
    // Resolve value
    let val = block.value || "";
    try {
      const binding = resolveBlockBinding(block, props.data, true);
      if (binding !== null) val = String(binding);
    } catch(e) {}
    text = val;
  }

  if (!text) return height;

  // Detect Khmer
  const isKhmer = /[\u1780-\u17FF]/.test(text);
  const avgCharWidth = fontSize * (isKhmer ? 0.72 : 0.48);
  const charsPerLine = Math.max(8, Math.floor(width / avgCharWidth));
  
  // Split by newlines first
  const paragraphs = text.split(/\r?\n/);
  let totalLines = 0;
  paragraphs.forEach(p => {
    totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
  });

  const contentH = totalLines * fontSize * lineHeight;
  const padding = 6; // vertical padding fallback
  return Math.max(height, contentH + padding);
};

const adjustedPages = computed(() => {
  const layoutMode = activeSettings.value.layoutMode;

  const measurements = tableMeasurements.value;
  const result = pages.value.map((page) => {
    // First, let's build the list of blocks with their estimated/measured heights
    const blocksWithHeights = page.blocks.map((block) => {
      let actualHeight = parseFloat(block.height) || 0;
      if (block.type === "item_table" && block._instanceId) {
        const measured = measurements[block._instanceId];
        const estimated = block._estimatedHeight || block._designHeight || actualHeight;
        actualHeight = measured || estimated;
      } else {
        actualHeight = estimateBlockHeight(block);
      }
      return {
        ...block,
        _originalY: block._originalY ?? (parseFloat(block.y) || 0),
        _designHeight: block._designHeight ?? (parseFloat(block.height) || 0),
        _actualHeight: actualHeight,
      };
    });

    // Sort blocks by originalY (ascending) to process from top to bottom
    const sorted = [...blocksWithHeights].sort((a, b) => a._originalY - b._originalY);

    // Track adjusted Y coordinate for each block ID
    const adjustedYMap = {};

    sorted.forEach((block) => {
      let currentY = block._originalY;

      // Find all blocks above B that overlap horizontally
      sorted.forEach((above) => {
        if (above.id !== block.id && above._originalY < block._originalY) {
          // Check horizontal overlap
          const blockX = parseFloat(block.x) || 0;
          const blockW = parseFloat(block.width) || 0;
          const aboveX = parseFloat(above.x) || 0;
          const aboveW = parseFloat(above.width) || 0;

          const overlapX = (aboveX < blockX + blockW) && (blockX < aboveX + aboveW);

          if (overlapX) {
            // Block 'above' is directly above 'block' in the column
            const aboveActualBottom = (adjustedYMap[above.id] ?? above._originalY) + above._actualHeight;
            const designGap = block._originalY - (above._originalY + above._designHeight);
            const safeGap = designGap < 0 ? 0 : designGap;

            const targetTop = aboveActualBottom + safeGap;
            if (targetTop > currentY) {
              currentY = targetTop;
            }
          }
        }
      });

      adjustedYMap[block.id] = currentY;
    });

    // Now construct the final adjusted blocks array
    const tableBlock = page.blocks.find(
      (b) => b.type === "item_table" && b._instanceId,
    );
    const hasEmptyRows = tableBlock ? tableBlock._hasEmptyRows !== false : true;

    // The Y coordinate of the table block's top and bottom in the original design template
    const designTableTop = tableBlock ? (tableBlock._designY ?? (parseFloat(tableBlock.y) || 0)) : 0;
    const designTableBottom = tableBlock ? (designTableTop + (tableBlock._designHeight || 0)) : 0;
    const actualTableBottom = tableBlock ? (adjustedYMap[tableBlock.id] + (measurements[tableBlock._instanceId] || tableBlock._estimatedHeight || tableBlock._designHeight || 0)) : 0;

    const bottomThreshold = page.height - 180;

    const adjustedBlocks = page.blocks.map((block) => {
      const adjustedY = adjustedYMap[block.id] ?? (parseFloat(block.y) || 0);

      // Repeated header/footer blocks have fixed page-relative Y already set
      // by the pagination engine — skip all re-anchoring logic.
      if (block._isRepeatedHeader || (block._isRepeatedFooter && layoutMode !== 'sections')) {
        return { ...block, y: parseFloat(block.y) || 0 };
      }

      if (layoutMode === 'sections') {
        if (block.section === 'footer') {
          // All footer blocks flow after the table in sections mode.
          // _sectionRelY is the relative Y from the table bottom (set by
          // formatFooterBlock). Anchor to the actual measured table bottom
          // so multi-line rows don't cause overlap.
          const relY = block._sectionRelY ?? (parseFloat(block.y) || 0) - (actualTableBottom || 0);
          const safeY = Math.max(actualTableBottom + relY, actualTableBottom);
          return { ...block, y: safeY };
        }
      }

      if (block._isFooter) {
        const originalY = block._originalY ?? (parseFloat(block.y) || 0);

        if (originalY >= bottomThreshold) {
          // Bottom-anchored block (signature lines, bottom terms)
          const safeY = Math.max(originalY, actualTableBottom + 10);
          return { ...block, y: safeY };
        }

        // Flowing footer block
        const designGap = originalY - designTableBottom;
        let rawY;
        if (!hasEmptyRows) {
          const effectiveGap = designGap < 0 ? 10 : designGap;
          rawY = actualTableBottom + effectiveGap;
        } else {
          // If flowing blocks were shifted by the table pushing them, or keep original Y
          const flowingFooterOriginals = page.blocks
            .filter((b) => b._isFooter && !b._isRepeatedFooter)
            .map((b) => b._originalY ?? (parseFloat(b.y) || 0))
            .filter((y) => y < bottomThreshold);
          
          const minFlowingY = flowingFooterOriginals.length > 0
            ? Math.min(...flowingFooterOriginals)
            : originalY;

          const overflow = Math.max(0, actualTableBottom + 10 - minFlowingY);
          rawY = originalY + overflow;
        }

        // Safety: Enforce minimum of 10px below the table bottom
        const safeY = Math.max(rawY, actualTableBottom + 10);
        return { ...block, y: safeY };
      }

      // Non-footer block: keep inside page bounds
      const clampedY = Math.min(
        adjustedY,
        page.height - (parseFloat(block.height) || 0) - 5,
      );
      return { ...block, y: clampedY };
    });

    return { ...page, blocks: adjustedBlocks };
  });
  return result;
});

function getPageStyle(page, pageIdx) {
  const dim = getFormatDimensions(props.formatId, props.orientation);
  const isLastPage = pageIdx === adjustedPages.value.length - 1;
  return {
    width: `${dim.width}px`,
    height: `${page.height}px`,
    background: "#ffffff",
    position: "relative",
    overflow: "hidden",
    fontFamily: props.globalFont,
    fontSize: `${props.globalFontSize}px`,
    color: "#000000",
    // Omit pageBreakAfter on the last page to prevent the browser from
    // inserting a blank trailing page in print/preview.
    ...(isLastPage ? {} : { pageBreakAfter: "always" }),
    boxSizing: "border-box",
  };
}

function getBlockStyle(block) {
  const isAutoHeight = ["text", "field_row", "notes", "bank_details", "carbon_copy_label"].includes(block.type);
  return {
    position: "absolute",
    left: `${parseFloat(block.x) || 0}px`,
    top: `${parseFloat(block.y) || 0}px`,
    width: `${parseFloat(block.width) || 0}px`,
    height: isAutoHeight ? "auto" : `${parseFloat(block.height) || 0}px`,
    minHeight: isAutoHeight ? `${parseFloat(block.height) || 0}px` : undefined,
    transform: block.rotation ? `rotate(${block.rotation}deg)` : "none",
    opacity: block.opacity ?? 1,
    zIndex: block._isFooter ? 10 : (block.zIndex ?? 0),
    pointerEvents: "none",
  };
}

function getRenderer(type) {
  return RENDERERS[type] ?? GenericBlockRenderer;
}

const containerEl = ref(null);
const isReadyEmitted = ref(false);

// Count the total number of table instances across all pages
const expectedTablesCount = computed(() => {
  let count = 0;
  pages.value.forEach(page => {
    page.blocks.forEach(block => {
      if (block.type === "item_table" && block._instanceId) {
        count++;
      }
    });
  });
  return count;
});

// Deterministic check to ensure fonts, images, and tables are fully loaded and measured
const checkReadyState = () => {
  if (isReadyEmitted.value) return;

  // 1. Wait until all tables have registered their measured heights
  const measuredCount = Object.keys(tableMeasurements.value).length;
  if (measuredCount < expectedTablesCount.value) {
    return;
  }

  // 2. Wait until fonts are loaded and all images in the container have completed loading
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => {
      if (!containerEl.value) return resolve();
      const imgs = containerEl.value.querySelectorAll("img");
      if (imgs.length === 0) return resolve();

      let loadedCount = 0;
      const onImgLoad = () => {
        loadedCount++;
        if (loadedCount >= imgs.length) resolve();
      };

      imgs.forEach((img) => {
        if (img.complete) {
          onImgLoad();
        } else {
          img.addEventListener("load", onImgLoad);
          img.addEventListener("error", onImgLoad); // Proceed even on broken image links
        }
      });
    }),
  ]).then(() => {
    // 50ms layout settle grace tick
    setTimeout(() => {
      if (!isReadyEmitted.value) {
        isReadyEmitted.value = true;
        emit("ready");
      }
    }, 50);
  });
};

// Listen for table height adjustments and run ready check
watch(
  tableMeasurements,
  () => {
    checkReadyState();
  },
  { deep: true }
);

onMounted(() => {
  // Trigger initial check (handles cases with no images or tables)
  checkReadyState();
  // Safe fallback timeout of 1.5 seconds in case of extreme loading delays
  setTimeout(() => {
    if (!isReadyEmitted.value) {
      isReadyEmitted.value = true;
      emit("ready");
    }
  }, 1500);
});
</script>

<template>
  <div ref="containerEl" class="invoice-renderer-pages">
    <div
      v-for="(page, pageIdx) in adjustedPages"
      :key="pageIdx"
      class="invoice-renderer-sheet"
      :style="getPageStyle(page, pageIdx)"
    >
      <div
        v-for="block in page.blocks"
        :key="block.id"
        :style="getBlockStyle(block)"
      >
        <component
          :is="getRenderer(block.type)"
          :block="block"
          :preview-data="data"
          style="width: 100%; height: 100%"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: v-bind(pageSizeCss);
    margin: 0;
  }
}
</style>
