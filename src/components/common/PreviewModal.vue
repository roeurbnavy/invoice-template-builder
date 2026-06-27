<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useSettingsStore } from "../../stores/settings.js";

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
import DocumentHeaderBlockRenderer from "../blocks/DocumentHeaderBlockRenderer.vue";
import CheckboxesRowBlockRenderer from "../blocks/CheckboxesRowBlockRenderer.vue";
import StampBoxBlockRenderer from "../blocks/StampBoxBlockRenderer.vue";
import CutLineBlockRenderer from "../blocks/CutLineBlockRenderer.vue";
import CarbonCopyLabelBlockRenderer from "../blocks/CarbonCopyLabelBlockRenderer.vue";
import ReceiptHeaderBlockRenderer from "../blocks/ReceiptHeaderBlockRenderer.vue";
import ReceiptFooterBlockRenderer from "../blocks/ReceiptFooterBlockRenderer.vue";

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
    document_header: DocumentHeaderBlockRenderer,
    checkboxes_row: CheckboxesRowBlockRenderer,
    stamp_box: StampBoxBlockRenderer,
    cut_line: CutLineBlockRenderer,
    carbon_copy_label: CarbonCopyLabelBlockRenderer,
    receipt_header: ReceiptHeaderBlockRenderer,
    receipt_footer: ReceiptFooterBlockRenderer,
    page_number: TextBlockRenderer,
    amount_in_words: TextBlockRenderer,
    balance_due: TotalsBlockRenderer,
    deposit_paid: TotalsBlockRenderer,
};

const canvasStore = useCanvasStore();
const blockStore = useBlockStore();
const settingsStore = useSettingsStore();

const visible = ref(false);
let previewModeBackup = false;

const paperStyle = computed(() => {
    const fmt = canvasStore.currentFormat;
    return {
        width: `${fmt?.width ?? 794}px`,
        height: `${fmt?.height ?? 1123}px`,
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
});

const previewBlocks = computed(() => {
    return blockStore.orderedBlocks.filter(b => !b.hidden);
});

function getBlockStyle(block) {
    return {
        position: "absolute",
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
        transform: block.rotation ? `rotate(${block.rotation}deg)` : "none",
        opacity: block.opacity ?? 1,
        zIndex: block.zIndex ?? 0,
        pointerEvents: "none",
    };
}

function getRenderer(type) {
    return RENDERERS[type] ?? GenericBlockRenderer;
}

watch(() => canvasStore.showPreview, async (val) => {
    if (!val) return;
    previewModeBackup = canvasStore.previewMode;
    canvasStore.previewMode = true;
    await nextTick();
    visible.value = true;
});

function close() {
    canvasStore.previewMode = previewModeBackup;
    canvasStore.showPreview = false;
    visible.value = false;
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
                        {{ canvasStore.currentFormat?.label || 'A4' }} · {{ canvasStore.orientation }}
                    </span>
                </div>
                <div class="preview-header-right">
                    <button class="preview-print-btn" @click="window.print()">
                        Print
                    </button>
                    <button class="preview-close-btn" @click="close">
                        Close
                    </button>
                </div>
            </div>

            <div class="preview-body">
                <div class="preview-scroll">
                    <div :style="paperStyle" class="preview-paper">
                        <div
                            v-for="block in previewBlocks"
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
    from { opacity: 0; }
    to { opacity: 1; }
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
