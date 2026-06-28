<script setup>
import { computed } from "vue";
import { PAPER_FORMATS, getFormatDimensions } from "../../constants/paperFormats.js";
import { getNestedValue, SAMPLE_DATA } from "../../utils/variableResolver.js";
import { useSettingsStore } from "../../stores/settings.js";

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
    printMarginTop: { type: Number, default: 15 },
    printMarginBottom: { type: Number, default: 15 },
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

const computedTableHeight = computed(() => {
    const itemTable = props.blocks.find(b => b.type === 'item_table');
    if (!itemTable) return 0;
    
    const bindingField = itemTable.dataBinding?.field || 'items';
    
    let sourceData = props.data;
    if (!sourceData || Object.keys(sourceData).length === 0) {
        try {
            const settingsStore = useSettingsStore();
            sourceData = settingsStore.sampleData;
        } catch (e) {}
    }
    if (!sourceData || Object.keys(sourceData).length === 0) {
        sourceData = SAMPLE_DATA;
    }
    if (!sourceData) sourceData = {};
    
    const allItems = getNestedValue(sourceData, bindingField) || itemTable.items || [];
    const itemsCount = Array.isArray(allItems) ? allItems.length : 0;
    
    const headerFontSize = itemTable.headerFontSize ?? itemTable.bodyFontSize ?? 12;
    const headerHeight = itemTable.showHeader !== false ? (headerFontSize + 24) : 0;
    
    const defaultRowHeight = itemTable.defaultRowHeight ?? 30;
    let rowsHeight = 0;
    for (let i = 0; i < itemsCount; i++) {
        const customHeight = itemTable.rowStyles?.[i]?.height;
        rowsHeight += customHeight ?? defaultRowHeight;
    }
    
    const emptyRowsCount = Math.max(0, (itemTable.emptyRows ?? 0) - itemsCount);
    const emptyRowsHeight = emptyRowsCount * defaultRowHeight;
    
    let specialRowsHeight = 0;
    if (Array.isArray(itemTable.specialRows)) {
        itemTable.specialRows.forEach(sr => {
            if (sr.type === 'divider') {
                specialRowsHeight += (sr.thickness ?? 1) + 8;
            } else {
                specialRowsHeight += defaultRowHeight;
            }
        });
    }
    
    return headerHeight + rowsHeight + emptyRowsHeight + specialRowsHeight + 10;
});

const tableHeightDelta = computed(() => {
    const itemTable = props.blocks.find(b => b.type === 'item_table');
    if (!itemTable) return 0;
    const designHeight = parseFloat(itemTable.height) || 200;
    const actualHeight = computedTableHeight.value;
    return actualHeight > designHeight ? (actualHeight - designHeight) : 0;
});

const computedDocumentHeight = computed(() => {
    const dim = paperDimensions.value;
    let maxHeight = dim.height;
    
    props.blocks.forEach(block => {
        const blockHeight = parseFloat(block.height) || 0;
        const blockY = parseFloat(block.y) || 0;
        
        let yOffset = 0;
        const itemTable = props.blocks.find(b => b.type === 'item_table');
        const itemTableY = itemTable ? (parseFloat(itemTable.y) || 0) : 0;
        
        if (itemTable && blockY > itemTableY) {
            yOffset = tableHeightDelta.value;
        }
        
        const bottom = blockY + yOffset + blockHeight;
        if (bottom > maxHeight) {
            maxHeight = bottom;
        }
    });
    
    return maxHeight + 40;
});

const paperStyle = computed(() => {
    const dim = paperDimensions.value;
    return {
        width: `${dim.width}px`,
        height: `${computedDocumentHeight.value}px`,
        minHeight: `${dim.height}px`,
        background: "#ffffff",
        position: "relative",
        overflow: "visible",
        fontFamily: props.globalFont,
        fontSize: `${props.globalFontSize}px`,
        color: "#000000",
        '--print-margin-top': `${props.printMarginTop ?? 15}mm`,
        '--print-margin-bottom': `${props.printMarginBottom ?? 15}mm`,
    };
});

function getBlockStyle(block) {
    const itemTable = props.blocks.find(b => b.type === 'item_table');
    let yOffset = 0;
    const blockY = parseFloat(block.y) || 0;
    const itemTableY = itemTable ? (parseFloat(itemTable.y) || 0) : 0;
    
    if (itemTable && blockY > itemTableY) {
        yOffset = tableHeightDelta.value;
    }
    return {
        position: "absolute",
        left: `${parseFloat(block.x) || 0}px`,
        top: `${blockY + yOffset}px`,
        width: `${parseFloat(block.width) || 0}px`,
        height: block.type === 'item_table' ? 'auto' : `${parseFloat(block.height) || 0}px`,
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
