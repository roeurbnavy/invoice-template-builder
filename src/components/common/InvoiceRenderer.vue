<script setup>
import { computed } from "vue";
import { PAPER_FORMATS, getFormatDimensions } from "../../constants/paperFormats.js";

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

const paperDimensions = computed(() =>
    getFormatDimensions(props.formatId, props.orientation)
);

const paperStyle = computed(() => {
    const dim = paperDimensions.value;
    return {
        width: `${dim.width}px`,
        height: `${dim.height}px`,
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: props.globalFont,
        fontSize: `${props.globalFontSize}px`,
        color: "#000000",
    };
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

const filteredBlocks = computed(() => {
    return props.blocks.filter(b => {
        if (b.hidden) return false;
        if (b.visibleFormats && !b.visibleFormats.includes(props.formatId)) return false;
        return true;
    });
});
</script>

<template>
    <div class="invoice-renderer-sheet" :style="paperStyle">
        <div
            v-for="block in filteredBlocks"
            :key="block.id"
            :style="getBlockStyle(block)"
        >
            <component
                :is="getRenderer(block.type)"
                :block="block"
                :preview-data="data"
            />
        </div>
    </div>
</template>
