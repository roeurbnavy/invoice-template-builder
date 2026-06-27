<script setup>
import { computed, ref } from "vue";
import { useBlockStore } from "../../stores/blocks.js";
import { useCanvasStore } from "../../stores/canvas.js";
import { useHistoryStore } from "../../stores/history.js";
import {
    computeAlignmentGuides,
    clearGuides,
} from "../../composables/useAlignmentGuides.js";

// Block renderers
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
    // New renderers
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

const props = defineProps({
    block: { type: Object, required: true },
});

const blockStore = useBlockStore();
const canvasStore = useCanvasStore();
const historyStore = useHistoryStore();

const isSelected = computed(() =>
    blockStore.selectedIds.includes(props.block.id),
);
const isMultiSelected = computed(
    () => blockStore.selectedIds.length > 1 && isSelected.value,
);
const renderer = computed(
    () => RENDERERS[props.block.type] ?? GenericBlockRenderer,
);
const isEditing = computed(() => canvasStore.editingBlockId === props.block.id);
const hasPointerEvents = computed(() => {
    if (isEditing.value) return true;
    if (props.block.type === 'item_table' && isSelected.value) return true;
    return false;
});

// Drag-move state
const moving = ref(false);
const moveStart = ref({ mouseX: 0, mouseY: 0, blockX: 0, blockY: 0 });

// Resize state
const resizing = ref(false);
const resizeHandle = ref("");
const resizeStart = ref({ mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 });

// Rotate state
const rotating = ref(false);
const rotatePivot = ref({ cx: 0, cy: 0 });
const rotateStart = ref({ angle: 0, blockRotation: 0 });

const blockStyle = computed(() => {
    const b = props.block;
    const z = canvasStore.zoom;
    return {
        position: "absolute",
        left: `${b.x * z}px`,
        top: `${b.y * z}px`,
        width: `${b.width * z}px`,
        height: `${b.height * z}px`,
        transform: `rotate(${b.rotation ?? 0}deg)`,
        opacity: b.opacity ?? 1,
        zIndex: b.zIndex ?? 0,
        userSelect: "none",
        pointerEvents: b.hidden ? "none" : ((props.block.childIds?.length ?? 0) > 0 ? "none" : "auto"),
        visibility: b.hidden ? "hidden" : "visible",
        cursor: isEditing.value
            ? "default"
            : b.locked
              ? "default"
              : moving.value
                ? "grabbing"
                : "grab",
        transition:
            moving.value || resizing.value || rotating.value
                ? "none"
                : undefined,
    };
});

// ─── Move & Edit ──────────────────────────────────────────────
function onDblClick(e) {
    if (props.block.locked) return;
    e.stopPropagation();
    canvasStore.editingBlockId = props.block.id;
}

function getParentContainer() {
    return blockStore.blocks.find(b => (b.childIds ?? []).includes(props.block.id));
}

function onMouseDown(e) {
    if (props.block.locked) return;
    if (e.button !== 0) return;
    e.stopPropagation();

    // If this block is a child of a group, redirect to parent
    const parent = getParentContainer();

    // Select logic
    if (e.shiftKey) {
        if (parent) return;
        if (isSelected.value) {
            blockStore.selectBlocks(
                blockStore.selectedIds.filter((id) => id !== props.block.id),
            );
        } else {
            blockStore.addToSelection(props.block.id);
        }
        return;
    }

    if (isSelected.value && !isEditing.value && !parent) {
        // Single click when already selected enters edit mode
        canvasStore.editingBlockId = props.block.id;
    }

    const moveTarget = parent ?? props.block;

    if (!isSelected.value || parent) {
        blockStore.selectBlock(moveTarget.id);
    }

    moving.value = true;
    moveStart.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        blockX: moveTarget.x,
        blockY: moveTarget.y,
    };

    const onMove = (me) => {
        if (!moving.value) return;
        const z = canvasStore.zoom;
        const dx = (me.clientX - moveStart.value.mouseX) / z;
        const dy = (me.clientY - moveStart.value.mouseY) / z;
        const newX = Math.round(moveStart.value.blockX + dx);
        const newY = Math.round(moveStart.value.blockY + dy);
        const moveTarget = getParentContainer() ?? props.block;
        blockStore.updateBlock(moveTarget.id, { x: newX, y: newY });
        // Also move other selected blocks
        if (isMultiSelected.value) {
            blockStore.selectedIds.forEach((id) => {
                if (id === moveTarget.id) return;
                const b = blockStore.blocks.find((bl) => bl.id === id);
                if (!b || b.locked) return;
                blockStore.updateBlock(id, {
                    x: Math.round(
                        b.x + dx - (moveTarget.x - moveStart.value.blockX),
                    ),
                    y: Math.round(
                        b.y + dy - (moveTarget.y - moveStart.value.blockY),
                    ),
                });
            });
        }
        // Also move children when dragging a container group
        const childIds = moveTarget.childIds ?? [];
        if (childIds.length > 0) {
            childIds.forEach((id) => {
                const b = blockStore.blocks.find((bl) => bl.id === id);
                if (!b || b.locked) return;
                blockStore.updateBlock(id, {
                    x: Math.round(b.x + dx - (moveTarget.x - moveStart.value.blockX)),
                    y: Math.round(b.y + dy - (moveTarget.y - moveStart.value.blockY)),
                });
            });
        }
        // Alignment guides
        const updated = blockStore.blocks.find(
            (bl) => bl.id === moveTarget.id,
        );
        if (updated)
            computeAlignmentGuides(
                updated,
                blockStore.blocks,
                canvasStore.zoom,
            );
    };

    const onUp = () => {
        moving.value = false;
        clearGuides();
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
}

// ─── Table Toolbar Actions ──────────────────────────────────
function addTableRow() {
    const newItems = JSON.parse(JSON.stringify(props.block.items ?? []));
    newItems.push({
        no: "",
        description: "",
        qty: "",
        unit_price: "",
        discount: "",
        tax: "",
        total: "",
    });
    blockStore.updateBlock(props.block.id, { items: newItems });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function addTableColumn() {
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const newId = `col_${Date.now()}`;
    columns.push({
        id: newId,
        label: "New Column",
        width: 10,
        visible: true,
    });
    blockStore.updateBlock(props.block.id, { columns });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function mergeTableCells() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length < 2) return;
    const allCols = props.block.columns ?? [];
    
    let minR = Infinity, maxR = -Infinity;
    let minCIdx = Infinity, maxCIdx = -Infinity;
    
    selected.forEach(cellKey => {
        const [rStr, colId] = cellKey.split(':');
        const r = parseInt(rStr);
        const cIdx = allCols.findIndex(c => c.id === colId);
        if (cIdx !== -1) {
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (cIdx < minCIdx) minCIdx = cIdx;
            if (cIdx > maxCIdx) maxCIdx = cIdx;
        }
    });
    
    if (minR === Infinity || minCIdx === Infinity) return;
    
    const newMerge = {
        startRow: minR,
        endRow: maxR,
        startCol: allCols[minCIdx].id,
        endCol: allCols[maxCIdx].id,
    };
    
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells ?? []));
    mergedCells.push(newMerge);
    blockStore.updateBlock(props.block.id, { mergedCells });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function deleteSelectedRows() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) return;
    const rowIdxs = [...new Set(selected.map(cell => parseInt(cell.split(':')[0])))];
    rowIdxs.sort((a, b) => b - a);
    const newItems = JSON.parse(JSON.stringify(props.block.items ?? []));
    let emptyRowsToDelete = 0;
    rowIdxs.forEach(r => {
        if (r < newItems.length) {
            newItems.splice(r, 1);
        } else {
            emptyRowsToDelete++;
        }
    });
    const updates = { items: newItems, selectedCells: [] };
    if (emptyRowsToDelete > 0) {
        const currentEmpty = props.block.emptyRows ?? 0;
        updates.emptyRows = Math.max(0, currentEmpty - emptyRowsToDelete);
    }
    blockStore.updateBlock(props.block.id, updates);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function deleteSelectedColumns() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) return;
    const colIds = [...new Set(selected.map(cell => cell.split(':')[1]))];
    const filteredColIds = colIds.filter(id => id !== 'no' && id !== 'total');
    if (filteredColIds.length === 0) return;
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const newCols = columns.filter(c => !filteredColIds.includes(c.id));
    blockStore.updateBlock(props.block.id, { columns: newCols, selectedCells: [] });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function clearSelectedCellsContent() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) return;
    const newItems = JSON.parse(JSON.stringify(props.block.items ?? []));
    let modified = false;
    selected.forEach(cellKey => {
        const [rStr, colId] = cellKey.split(':');
        const r = parseInt(rStr);
        if (r < newItems.length) {
            newItems[r][colId] = "";
            modified = true;
        }
    });
    if (modified) {
        blockStore.updateBlock(props.block.id, { items: newItems, selectedCells: [] });
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
    }
}

function applyTableStyle(prop, val) {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) return;
    const cellStyles = JSON.parse(JSON.stringify(props.block.cellStyles ?? {}));
    
    selected.forEach(cellKey => {
        if (!cellStyles[cellKey]) cellStyles[cellKey] = {};
        if (prop === 'bold') {
            cellStyles[cellKey].bold = !cellStyles[cellKey].bold;
        } else if (prop === 'italic') {
            cellStyles[cellKey].italic = !cellStyles[cellKey].italic;
        } else if (prop === 'hAlign') {
            cellStyles[cellKey].hAlign = val;
        } else if (prop === 'vAlign') {
            cellStyles[cellKey].vAlign = val;
        } else if (prop === 'bgColor') {
            cellStyles[cellKey].bgColor = val;
        } else if (prop === 'textColor') {
            cellStyles[cellKey].textColor = val;
        } else if (prop === 'border') {
            const cellBorders = JSON.parse(JSON.stringify(props.block.cellBorders ?? {}));
            cellBorders[cellKey] = {
                top: val, bottom: val, left: val, right: val
            };
            blockStore.updateBlock(props.block.id, { cellBorders });
        }
    });
    blockStore.updateBlock(props.block.id, { cellStyles });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

// ─── Resize ───────────────────────────────────────────────────
function onResizeStart(e, handle) {
    if (isEditing.value) return;
    e.stopPropagation();
    e.preventDefault();
    resizing.value = true;
    resizeHandle.value = handle;
    const initChildIds = props.block.childIds ?? [];
    const initChildren = initChildIds.map(id => {
        const b = blockStore.blocks.find(bl => bl.id === id);
        return b ? { id, x: b.x, y: b.y, w: b.width, h: b.height } : null;
    }).filter(Boolean);
    resizeStart.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: props.block.x,
        y: props.block.y,
        w: props.block.width,
        h: props.block.height,
        children: initChildren,
    };

    const onMove = (me) => {
        if (!resizing.value) return;
        const z = canvasStore.zoom;
        const dx = (me.clientX - resizeStart.value.mouseX) / z;
        const dy = (me.clientY - resizeStart.value.mouseY) / z;
        let { x: oldX, y: oldY, w: oldW, h: oldH } = resizeStart.value;
        let newX = oldX, newY = oldY, newW = oldW, newH = oldH;
        const MIN = 20;

        if (handle.includes("e")) newW = Math.max(MIN, Math.round(oldW + dx));
        if (handle.includes("s")) newH = Math.max(MIN, Math.round(oldH + dy));
        if (handle.includes("w")) {
            const nw = Math.max(MIN, Math.round(oldW - dx));
            newX = Math.round(oldX + oldW - nw);
            newW = nw;
        }
        if (handle.includes("n")) {
            const nh = Math.max(MIN, Math.round(oldH - dy));
            newY = Math.round(oldY + oldH - nh);
            newH = nh;
        }

        blockStore.updateBlock(props.block.id, { x: newX, y: newY, width: newW, height: newH });

        // Scale children proportionally from initial snapshot
        const initChildren = resizeStart.value.children ?? [];
        if (initChildren.length > 0) {
            const sx = newW / oldW;
            const sy = newH / oldH;
            initChildren.forEach((ch) => {
                if (!ch) return;
                blockStore.updateBlock(ch.id, {
                    x: Math.round(newX + (ch.x - oldX) * sx),
                    y: Math.round(newY + (ch.y - oldY) * sy),
                    width: Math.max(MIN, Math.round((ch.w ?? 100) * sx)),
                    height: Math.max(MIN, Math.round((ch.h ?? 50) * sy)),
                });
            });
        }
    };

    const onUp = () => {
        resizing.value = false;
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
}

// ─── Rotate ───────────────────────────────────────────────────
function onRotateStart(e) {
    if (isEditing.value) return;
    e.stopPropagation();
    e.preventDefault();
    rotating.value = true;

    // Pivot = center of block in page coords
    const z = canvasStore.zoom;
    const cx = props.block.x * z + (props.block.width * z) / 2;
    const cy = props.block.y * z + (props.block.height * z) / 2;

    // Get paper position
    const paper = document.getElementById("canvas-paper");
    const rect = paper.getBoundingClientRect();
    rotatePivot.value = { cx: rect.left + cx, cy: rect.top + cy };

    const startAngle = Math.atan2(
        e.clientY - rotatePivot.value.cy,
        e.clientX - rotatePivot.value.cx,
    );
    const startRotation = props.block.rotation ?? 0;

    const onMove = (me) => {
        if (!rotating.value) return;
        const angle = Math.atan2(
            me.clientY - rotatePivot.value.cy,
            me.clientX - rotatePivot.value.cx,
        );
        const delta = (angle - startAngle) * (180 / Math.PI);
        let newRotation = Math.round(startRotation + delta);
        // Snap to 15° if Shift held
        if (me.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
        blockStore.updateBlock(props.block.id, { rotation: newRotation });
    };

    const onUp = () => {
        rotating.value = false;
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
}

// Resize handle positions
const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const handleStyle = (handle) => {
    const pos = {
        nw: { top: "-4px", left: "-4px", cursor: "nw-resize" },
        n: {
            top: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            cursor: "n-resize",
        },
        ne: { top: "-4px", right: "-4px", cursor: "ne-resize" },
        e: {
            top: "50%",
            right: "-4px",
            transform: "translateY(-50%)",
            cursor: "e-resize",
        },
        se: { bottom: "-4px", right: "-4px", cursor: "se-resize" },
        s: {
            bottom: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            cursor: "s-resize",
        },
        sw: { bottom: "-4px", left: "-4px", cursor: "sw-resize" },
        w: {
            top: "50%",
            left: "-4px",
            transform: "translateY(-50%)",
            cursor: "w-resize",
        },
    };
    return { ...pos[handle] };
};
</script>

<template>
    <div
        :style="blockStyle"
        :class="[
            'canvas-block',
            {
                selected: isSelected,
                locked: block.locked,
                'out-of-bounds': block._outOfBounds,
                'print-hidden': block.hideOnPrint,
            },
        ]"
        @mousedown="onMouseDown"
        @dblclick="onDblClick"
    >
        <!-- Block content renderer -->
        <component
            :is="renderer"
            :block="block"
            :fill-mode="isEditing"
            :style="{
                width: '100%',
                height: '100%',
                pointerEvents: hasPointerEvents ? 'auto' : 'none',
            }"
        />

        <!-- Selection handles -->
        <template v-if="isSelected && !block.locked">
            <!-- Rotation handle -->
            <div class="rotate-handle" @mousedown.stop="onRotateStart" />

            <!-- 8 resize handles -->
            <div
                v-for="handle in handles"
                :key="handle"
                class="resize-handle"
                :style="handleStyle(handle)"
                @mousedown.stop="onResizeStart($event, handle)"
            />
        </template>

        <!-- Lock indicator -->
        <div
            v-if="block.locked && isSelected"
            style="
                position: absolute;
                top: 2px;
                right: 2px;
                width: 16px;
                height: 16px;
                background: var(--color-warning);
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
            "
        >
            🔒
        </div>
    </div>
</template>

<style scoped>
.tb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 6px;
    height: 22px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}
.tb-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #ffffff;
}
.tb-sep {
    width: 1px;
    height: 14px;
    background: var(--color-panel-border);
    margin: 0 2px;
}
</style>
