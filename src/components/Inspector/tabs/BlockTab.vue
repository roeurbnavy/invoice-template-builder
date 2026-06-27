<script setup>
import { computed, ref } from "vue";
import { useBlockStore } from "../../../stores/blocks.js";
import { useHistoryStore } from "../../../stores/history.js";
import { useSettingsStore } from "../../../stores/settings.js";
import { Trash2 } from "@lucide/vue";

const props = defineProps({
    block: { type: Object, required: true },
});

const blockStore = useBlockStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();

const editingRowId = ref(null);
const showRowTypeMenu = ref(false);

function updateProp(prop, val) {
    blockStore.updateBlock(props.block.id, { [prop]: val });
}

function commitHistory() {
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function handleInput(prop, e, isNum = true) {
    const val = isNum ? parseFloat(e.target.value) : e.target.value;
    if (!isNaN(val) || !isNum) {
        updateProp(prop, val);
    }
}

function handleCheckbox(prop, e) {
    updateProp(prop, e.target.checked);
    commitHistory();
}

// Get latest columns directly from store (bypasses prop reactivity lag)
function getStoredColumns() {
    const block = blockStore.blocks.find(b => b.id === props.block.id);
    return JSON.parse(JSON.stringify(block?.columns || []));
}

// Helper to update columns in item table (uses colId to avoid index mismatch)
function updateColumnProp(colId, prop, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    col[prop] = val;
    updateProp("columns", columns);
    commitHistory();
}

// Helper to update header grid columns
function updateHeaderColumn(index, prop, val) {
    const columns = getStoredColumns();
    if (columns[index]) {
        columns[index][prop] = val;
        updateProp("columns", columns);
    }
}

function addColumn() {
    const columns = getStoredColumns();
    const newId = `col_${Date.now()}`;
    columns.push({
        id: newId,
        label: "New Column",
        width: 10,
        visible: true,
        dataKey: "",
        format: { type: "text" },
        bold: false,
    });
    updateProp("columns", columns);
    commitHistory();
}

function deleteColumn(colId) {
    const columns = getStoredColumns();
    const idx = columns.findIndex(c => c.id === colId);
    if (idx === -1) return;
    columns.splice(idx, 1);
    updateProp("columns", columns);
    commitHistory();
}

function getColumnFormat(col) {
    if (!col.format) return { type: "text" };
    return { type: "text", ...col.format };
}

function updateColumnFormatType(colId, type) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const fmt = { ...(col.format || {}) };
    fmt.type = type;
    if (type === "currency" && !fmt.currency) fmt.currency = "USD";
    if (type === "text") {
        delete fmt.currency;
        delete fmt.decimals;
    }
    col.format = fmt;
    updateProp("columns", columns);
    commitHistory();
}

function updateColumnFormatOption(colId, key, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const fmt = { ...(col.format || {}) };
    fmt[key] = val;
    col.format = fmt;
    updateProp("columns", columns);
    commitHistory();
}

function addCustomField() {
    const fields = JSON.parse(JSON.stringify(props.block.customFields || []));
    fields.push({
        id: `field_${Date.now()}`,
        label: "Label",
        value: "Value",
    });
    updateProp("customFields", fields);
    commitHistory();
}

function deleteCustomField(index) {
    const fields = JSON.parse(JSON.stringify(props.block.customFields || []));
    fields.splice(index, 1);
    updateProp("customFields", fields);
    commitHistory();
}

function updateCustomField(index, prop, val) {
    const fields = JSON.parse(JSON.stringify(props.block.customFields || []));
    if (fields[index]) {
        fields[index][prop] = val;
        updateProp("customFields", fields);
    }
}

// ── Checkboxes row option helpers ──
function addCheckboxOption() {
    const options = JSON.parse(JSON.stringify(props.block.options || []));
    options.push({ label: 'Option', checked: false });
    updateProp('options', options);
    commitHistory();
}

// Row types management helpers
function addSpecialRow(type) {
    const specialRows = JSON.parse(JSON.stringify(props.block.specialRows || []));
    const newId = `row_${Date.now()}`;
    let newRow = { id: newId, type };
    if (type === 'summary') {
        newRow.text = 'Summary Text';
        newRow.bgColor = '';
        newRow.textColor = '';
        newRow.fontWeight = 'bold';
    } else if (type === 'section_header') {
        newRow.text = 'Section Header';
        newRow.bgColor = '';
        newRow.textColor = '';
        newRow.alignment = 'left';
    } else if (type === 'split') {
        newRow.leftText = 'Bank Details:\nABA Bank: 000 000 000\nName: COMPANY CO., LTD.';
        newRow.rightText = 'Subtotal:\nVAT (10%):\nGrand Total:';
        newRow.leftWidth = 60;
    } else if (type === 'divider') {
        newRow.color = '#e0e0e0';
        newRow.thickness = 1;
    }
    specialRows.push(newRow);
    updateProp('specialRows', specialRows);
    commitHistory();
    editingRowId.value = newId;
    showRowTypeMenu.value = false;
}

function deleteSpecialRow(index) {
    const specialRows = JSON.parse(JSON.stringify(props.block.specialRows || []));
    const deleted = specialRows.splice(index, 1);
    if (deleted[0] && editingRowId.value === deleted[0].id) {
        editingRowId.value = null;
    }
    updateProp('specialRows', specialRows);
    commitHistory();
}

function toggleEditSpecialRow(rowId) {
    if (editingRowId.value === rowId) {
        editingRowId.value = null;
    } else {
        editingRowId.value = rowId;
    }
}

function updateSpecialRowProp(rowId, prop, val) {
    const specialRows = JSON.parse(JSON.stringify(props.block.specialRows || []));
    const row = specialRows.find(r => r.id === rowId);
    if (row) {
        row[prop] = val;
        updateProp('specialRows', specialRows);
    }
}

// Cell merge & borders helpers
const selectedCellsCount = computed(() => (props.block.selectedCells || []).length);
const showBordersMenu = ref(false);

const hasSelectedMerge = computed(() => {
    const selected = props.block.selectedCells || [];
    if (selected.length === 0) return false;
    
    const mergedCells = props.block.mergedCells || [];
    const allCols = props.block.columns || [];
    const visibleCols = allCols.filter(c => c.visible !== false);
    
    return selected.some(cellId => {
        const [rStr, colId] = cellId.split(':');
        const r = parseInt(rStr, 10);
        const colIdx = visibleCols.findIndex(c => c.id === colId);
        if (colIdx === -1) return false;
        
        return mergedCells.some(m => {
            const mStartIdx = allCols.findIndex(c => c.id === m.startCol);
            const mEndIdx = allCols.findIndex(c => c.id === m.endCol);
            if (mStartIdx === -1 || mEndIdx === -1) return false;
            
            const minC = Math.min(mStartIdx, mEndIdx);
            const maxC = Math.max(mStartIdx, mEndIdx);
            const minR = Math.min(m.startRow, m.endRow);
            const maxR = Math.max(m.startRow, m.endRow);
            
            const fullColIdx = allCols.findIndex(c => c.id === colId);
            return r >= minR && r <= maxR && fullColIdx >= minC && fullColIdx <= maxC;
        });
    });
});

function mergeSelectedCells(alignCenter = false) {
    const selected = props.block.selectedCells || [];
    if (selected.length < 2) return;
    
    const allCols = props.block.columns || [];
    const visibleCols = allCols.filter(c => c.visible !== false);
    
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minColIdx = Infinity;
    let maxColIdx = -Infinity;
    
    selected.forEach(cellId => {
        const [rStr, colId] = cellId.split(':');
        const r = parseInt(rStr, 10);
        const colIdx = visibleCols.findIndex(c => c.id === colId);
        
        if (colIdx > -1) {
            if (r < minRow) minRow = r;
            if (r > maxRow) maxRow = r;
            if (colIdx < minColIdx) minColIdx = colIdx;
            if (colIdx > maxColIdx) maxColIdx = colIdx;
        }
    });
    
    if (minRow === Infinity || minColIdx === Infinity) return;
    
    const startCol = visibleCols[minColIdx].id;
    const endCol = visibleCols[maxColIdx].id;
    
    const newMerge = {
        id: `merge_${Date.now()}`,
        startRow: minRow,
        endRow: maxRow,
        startCol,
        endCol,
        align: alignCenter ? 'center' : undefined
    };
    
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells || []));
    
    const allStartIdx = allCols.findIndex(c => c.id === startCol);
    const allEndIdx = allCols.findIndex(c => c.id === endCol);
    const newMinColIdx = Math.min(allStartIdx, allEndIdx);
    const newMaxColIdx = Math.max(allStartIdx, allEndIdx);
    
    const filteredMerges = mergedCells.filter(m => {
        const mStartIdx = allCols.findIndex(c => c.id === m.startCol);
        const mEndIdx = allCols.findIndex(c => c.id === m.endCol);
        if (mStartIdx === -1 || mEndIdx === -1) return false;
        
        const mMinCol = Math.min(mStartIdx, mEndIdx);
        const mMaxCol = Math.max(mStartIdx, mEndIdx);
        const mMinRow = Math.min(m.startRow, m.endRow);
        const mMaxRow = Math.max(m.startRow, m.endRow);
        
        const rowOverlap = Math.max(minRow, mMinRow) <= Math.min(maxRow, mMaxRow);
        const colOverlap = Math.max(newMinColIdx, mMinCol) <= Math.min(newMaxColIdx, mMaxCol);
        
        return !(rowOverlap && colOverlap);
    });
    
    filteredMerges.push(newMerge);
    
    blockStore.updateBlock(props.block.id, {
        mergedCells: filteredMerges,
        selectedCells: []
    });
    commitHistory();
}

function mergeAcross() {
    const selected = props.block.selectedCells || [];
    if (selected.length < 2) return;
    
    const allCols = props.block.columns || [];
    const visibleCols = allCols.filter(c => c.visible !== false);
    
    let minColIdx = Infinity;
    let maxColIdx = -Infinity;
    const rows = new Set();
    
    selected.forEach(cellId => {
        const [rStr, colId] = cellId.split(':');
        const r = parseInt(rStr, 10);
        const colIdx = visibleCols.findIndex(c => c.id === colId);
        
        if (colIdx > -1) {
            rows.add(r);
            if (colIdx < minColIdx) minColIdx = colIdx;
            if (colIdx > maxColIdx) maxColIdx = colIdx;
        }
    });
    
    if (minColIdx === Infinity || rows.size === 0) return;
    
    const startCol = visibleCols[minColIdx].id;
    const endCol = visibleCols[maxColIdx].id;
    
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells || []));
    const allStartIdx = allCols.findIndex(c => c.id === startCol);
    const allEndIdx = allCols.findIndex(c => c.id === endCol);
    const newMinColIdx = Math.min(allStartIdx, allEndIdx);
    const newMaxColIdx = Math.max(allStartIdx, allEndIdx);
    
    rows.forEach(r => {
        const newMerge = {
            id: `merge_${Date.now()}_${r}`,
            startRow: r,
            endRow: r,
            startCol,
            endCol
        };
        
        for (let i = mergedCells.length - 1; i >= 0; i--) {
            const m = mergedCells[i];
            const mStartIdx = allCols.findIndex(c => c.id === m.startCol);
            const mEndIdx = allCols.findIndex(c => c.id === m.endCol);
            if (mStartIdx === -1 || mEndIdx === -1) continue;
            
            const mMinCol = Math.min(mStartIdx, mEndIdx);
            const mMaxCol = Math.max(mStartIdx, mEndIdx);
            const mMinRow = Math.min(m.startRow, m.endRow);
            const mMaxRow = Math.max(m.startRow, m.endRow);
            
            const rowOverlap = (r >= mMinRow && r <= mMaxRow);
            const colOverlap = Math.max(newMinColIdx, mMinCol) <= Math.min(newMaxColIdx, mMaxCol);
            
            if (rowOverlap && colOverlap) {
                mergedCells.splice(i, 1);
            }
        }
        
        mergedCells.push(newMerge);
    });
    
    blockStore.updateBlock(props.block.id, {
        mergedCells,
        selectedCells: []
    });
    commitHistory();
}

function unmergeSelectedCells() {
    const selected = props.block.selectedCells || [];
    if (selected.length === 0) return;
    
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells || []));
    const allCols = props.block.columns || [];
    
    const filtered = mergedCells.filter(m => {
        const mStartIdx = allCols.findIndex(c => c.id === m.startCol);
        const mEndIdx = allCols.findIndex(c => c.id === m.endCol);
        if (mStartIdx === -1 || mEndIdx === -1) return true;
        
        const minC = Math.min(mStartIdx, mEndIdx);
        const maxC = Math.max(mStartIdx, mEndIdx);
        const minR = Math.min(m.startRow, m.endRow);
        const maxR = Math.max(m.startRow, m.endRow);
        
        const intersects = selected.some(cellId => {
            const [rStr, colId] = cellId.split(':');
            const r = parseInt(rStr, 10);
            const fullColIdx = allCols.findIndex(c => c.id === colId);
            return r >= minR && r <= maxR && fullColIdx >= minC && fullColIdx <= maxC;
        });
        
        return !intersects;
    });
    
    blockStore.updateBlock(props.block.id, {
        mergedCells: filtered,
        selectedCells: []
    });
    commitHistory();
}

function unmergeCell(mergeId) {
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells || []));
    const filtered = mergedCells.filter(m => m.id !== mergeId);
    blockStore.updateBlock(props.block.id, { mergedCells: filtered });
    commitHistory();
}

function handleMergeSelect(action) {
    if (action === 'merge_center') {
        mergeSelectedCells(true);
    } else if (action === 'merge_across') {
        mergeAcross();
    } else if (action === 'merge_cells') {
        mergeSelectedCells(false);
    } else if (action === 'unmerge') {
        unmergeSelectedCells();
    }
}

function applyCellBorder(borderType) {
    const selected = props.block.selectedCells || [];
    if (selected.length === 0) return;
    
    const allCols = props.block.columns || [];
    const visibleCols = allCols.filter(c => c.visible !== false);
    
    // Find boundary of selected cells
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minColIdx = Infinity;
    let maxColIdx = -Infinity;
    
    selected.forEach(cellId => {
        const [rStr, colId] = cellId.split(':');
        const r = parseInt(rStr, 10);
        const colIdx = visibleCols.findIndex(c => c.id === colId);
        
        if (colIdx > -1) {
            if (r < minRow) minRow = r;
            if (r > maxRow) maxRow = r;
            if (colIdx < minColIdx) minColIdx = colIdx;
            if (colIdx > maxColIdx) maxColIdx = colIdx;
        }
    });
    
    if (minRow === Infinity || minColIdx === Infinity) return;
    
    const cellBorders = JSON.parse(JSON.stringify(props.block.cellBorders || {}));
    
    selected.forEach(cellId => {
        const [rStr, colId] = cellId.split(':');
        const r = parseInt(rStr, 10);
        const colIdx = visibleCols.findIndex(c => c.id === colId);
        
        if (colIdx === -1) return;
        
        if (borderType === 'clear_custom') {
            delete cellBorders[cellId];
            return;
        }
        
        if (!cellBorders[cellId]) {
            cellBorders[cellId] = { top: 'default', bottom: 'default', left: 'default', right: 'default' };
        }
        
        const cell = cellBorders[cellId];
        
        const isTopEdge = r === minRow;
        const isBottomEdge = r === maxRow;
        const isLeftEdge = colIdx === minColIdx;
        const isRightEdge = colIdx === maxColIdx;
        
        switch (borderType) {
            case 'bottom':
                if (isBottomEdge) cell.bottom = 'thin';
                break;
            case 'top':
                if (isTopEdge) cell.top = 'thin';
                break;
            case 'left':
                if (isLeftEdge) cell.left = 'thin';
                break;
            case 'right':
                if (isRightEdge) cell.right = 'thin';
                break;
            case 'no_border':
                cell.top = 'none';
                cell.bottom = 'none';
                cell.left = 'none';
                cell.right = 'none';
                break;
            case 'all_borders':
                cell.top = 'thin';
                cell.bottom = 'thin';
                cell.left = 'thin';
                cell.right = 'thin';
                break;
            case 'outside':
                if (isTopEdge) cell.top = 'thin';
                if (isBottomEdge) cell.bottom = 'thin';
                if (isLeftEdge) cell.left = 'thin';
                if (isRightEdge) cell.right = 'thin';
                break;
            case 'thick_outside':
                if (isTopEdge) cell.top = 'thick';
                if (isBottomEdge) cell.bottom = 'thick';
                if (isLeftEdge) cell.left = 'thick';
                if (isRightEdge) cell.right = 'thick';
                break;
            case 'bottom_double':
                if (isBottomEdge) cell.bottom = 'double';
                break;
            case 'thick_bottom':
                if (isBottomEdge) cell.bottom = 'thick';
                break;
            case 'top_bottom':
                if (isTopEdge) cell.top = 'thin';
                if (isBottomEdge) cell.bottom = 'thin';
                break;
            case 'top_thick_bottom':
                if (isTopEdge) cell.top = 'thin';
                if (isBottomEdge) cell.bottom = 'thick';
                break;
            case 'top_double_bottom':
                if (isTopEdge) cell.top = 'thin';
                if (isBottomEdge) cell.bottom = 'double';
                break;
        }
    });
    
    blockStore.updateBlock(props.block.id, { cellBorders });
    commitHistory();
}

function deleteCheckboxOption(index) {
    const options = JSON.parse(JSON.stringify(props.block.options || []));
    options.splice(index, 1);
    updateProp('options', options);
    commitHistory();
}

function updateCheckboxOption(index, prop, val) {
    const options = JSON.parse(JSON.stringify(props.block.options || []));
    if (options[index] !== undefined) {
        options[index][prop] = val;
        updateProp('options', options);
    }
}

// Field reordering for Company and Client Info
const clientFieldLabels = {
    name: 'Client Name',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    taxId: 'Tax ID',
    customFields: 'Custom Details'
};

const clientFieldsSorted = computed(() => {
    const order = props.block.fieldOrder || ['name', 'address', 'phone', 'email', 'taxId', 'customFields'];
    return order.map(key => ({ id: key, name: clientFieldLabels[key] || key }));
});

const companyFieldLabels = {
    name: 'Company Name',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    customFields: 'Custom Details'
};

const companyFieldsSorted = computed(() => {
    const order = props.block.fieldOrder || ['name', 'address', 'phone', 'email', 'website', 'customFields'];
    return order.map(key => ({ id: key, name: companyFieldLabels[key] || key }));
});

function moveField(fromIndex, toIndex) {
    const defaultFields = props.block.type === 'client_info' 
        ? ['name', 'address', 'phone', 'email', 'taxId', 'customFields']
        : ['name', 'address', 'phone', 'email', 'website', 'customFields'];
    const order = [...(props.block.fieldOrder || defaultFields)];
    
    // Swap items
    const temp = order[fromIndex];
    order[fromIndex] = order[toIndex];
    order[toIndex] = temp;
    
    updateProp('fieldOrder', order);
    commitHistory();
}
</script>


<template>
    <div class="tab-panel">
        <!-- ─── DIVIDER BLOCK ─── -->
        <div v-if="block.type === 'divider'" class="field-group">
            <div class="field-label">Divider Settings</div>
            <div class="field-row">
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Line Thickness</label
                    >
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.lineWidth ?? 1"
                            class="inp"
                            min="1"
                            max="20"
                            @input="handleInput('lineWidth', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Line Style</label
                    >
                    <select
                        :value="block.lineStyle ?? 'solid'"
                        class="inp"
                        @change="handleInput('lineStyle', $event, false)"
                        @blur="commitHistory"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                </div>
            </div>
            <div class="field-single" style="margin-top: 8px">
                <label
                    style="
                        font-size: 10px;
                        color: var(--color-panel-muted);
                        display: block;
                        margin-bottom: 4px;
                    "
                    >Line Color</label
                >
                <div style="display: flex; gap: 8px; align-items: center">
                    <input
                        type="color"
                        :value="
                            block.lineColor && block.lineColor.startsWith('#')
                                ? block.lineColor
                                : '#cccccc'
                        "
                        class="color-picker-input"
                        @input="updateProp('lineColor', $event.target.value)"
                        @change="commitHistory"
                    />
                    <input
                        type="text"
                        :value="block.lineColor ?? '#cccccc'"
                        class="inp"
                        @input="updateProp('lineColor', $event.target.value)"
                        @blur="commitHistory"
                    />
                </div>
            </div>
        </div>

        <!-- ─── SHAPE BLOCK ─── -->
        <div v-else-if="block.type === 'shape'" class="field-group">
            <div class="field-label">Shape Options</div>
            <div class="field-single">
                <label
                    style="
                        font-size: 10px;
                        color: var(--color-panel-muted);
                        display: block;
                        margin-bottom: 4px;
                    "
                    >Shape Type</label
                >
                <select
                    :value="block.shapeType ?? 'rectangle'"
                    class="inp"
                    @change="handleInput('shapeType', $event, false)"
                    @blur="commitHistory"
                >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                </select>
            </div>
        </div>

        <!-- ─── SIGNATURE LINE BLOCK ─── -->
        <div
            v-else-if="block.type === 'signature_line'"
            class="field-group"
        >
            <div class="field-label">Signature Settings</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin-bottom:10px">Edit signature line label, signer name, and date directly on the canvas.</p>

            <div
                style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                "
            >
                <span>Show Date Placeholder</span>
                <label class="toggle">
                    <input
                        type="checkbox"
                        :checked="block.showDate !== false"
                        @change="handleCheckbox('showDate', $event)"
                    />
                    <span class="toggle-track" />
                </label>
            </div>
        </div>

        <!-- ─── WATERMARK BLOCK ─── -->
        <div v-else-if="block.type === 'watermark'" class="field-group">
            <div class="field-label">Watermark Settings</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">Edit watermark text directly on the canvas.</p>
        </div>

        <!-- ─── COMPANY INFO ─── -->
        <div v-else-if="block.type === 'company_info'" class="field-group">
            <div class="field-label">Company Info</div>

            <p style="font-size:11px;color:var(--color-panel-muted);margin:0 0 10px">Edit company details directly on the canvas.</p>

            <!-- Custom Details for Company Info -->
            <div class="field-label" style="margin-top: 8px">Custom Details</div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px">
                <div
                    v-for="(field, index) in block.customFields ?? []"
                    :key="field.id"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0, 0, 0, 0.15);
                        padding: 6px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <span style="font-size: 11px; font-weight: 500;">{{ field.label || 'Custom Field' }}</span>
                    <button
                        class="btn btn-ghost btn-icon text-danger"
                        style="width: 22px; height: 22px; padding: 0"
                        title="Delete Field"
                        @click="deleteCustomField(index)"
                    >
                        <Trash2 :size="12" />
                    </button>
                </div>
                <button
                    class="btn btn-ghost"
                    style="width: 100%; font-size: 11px; padding: 5px 0"
                    @click="addCustomField"
                >
                    + Add Custom Field
                </button>
            </div>

            <div class="divider" />

            <div class="field-label" style="margin-top: 8px">
                Show / Hide Fields
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                    v-for="field in [
                        'Name',
                        'Address',
                        'Phone',
                        'Email',
                        'Website',
                    ]"
                    :key="field"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span>Show Company {{ field }}</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block[`show${field}`] !== false"
                            @change="handleCheckbox(`show${field}`, $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>

            <!-- Field Position (Order) -->
            <div class="divider" style="margin-top: 12px" />
            <div class="field-label" style="margin-top: 8px">Field Position (Order)</div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px">
                <div
                    v-for="(fld, idx) in companyFieldsSorted"
                    :key="fld.id"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0, 0, 0, 0.15);
                        padding: 4px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <span style="font-size: 11px; font-weight: 500;">{{ fld.name }}</span>
                    <div style="display: flex; gap: 2px;">
                        <button
                            class="btn btn-ghost btn-icon"
                            style="width: 22px; height: 22px; padding: 0"
                            :disabled="idx === 0"
                            @click="moveField(idx, idx - 1)"
                        >
                            ▲
                        </button>
                        <button
                            class="btn btn-ghost btn-icon"
                            style="width: 22px; height: 22px; padding: 0"
                            :disabled="idx === companyFieldsSorted.length - 1"
                            @click="moveField(idx, idx + 1)"
                        >
                            ▼
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── CLIENT INFO ─── -->
        <div v-else-if="block.type === 'client_info'" class="field-group">
            <div class="field-label">Client Info Settings</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0 0 10px">Edit client details directly on the canvas.</p>

            <!-- Custom Details for Client Info -->
            <div class="field-label" style="margin-top: 8px">Custom Details</div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px">
                <div
                    v-for="(field, index) in block.customFields ?? []"
                    :key="field.id"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0, 0, 0, 0.15);
                        padding: 6px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <span style="font-size: 11px; font-weight: 500;">{{ field.label || 'Custom Field' }}</span>
                    <button
                        class="btn btn-ghost btn-icon text-danger"
                        style="width: 22px; height: 22px; padding: 0"
                        title="Delete Field"
                        @click="deleteCustomField(index)"
                    >
                        <Trash2 :size="12" />
                    </button>
                </div>
                <button
                    class="btn btn-ghost"
                    style="width: 100%; font-size: 11px; padding: 5px 0"
                    @click="addCustomField"
                >
                    + Add Custom Field
                </button>
            </div>

            <div class="divider" />

            <div class="field-label" style="margin-top: 8px">
                Show / Hide Fields
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                    v-for="field in [
                        'Name',
                        'Address',
                        'Phone',
                        'Email',
                        'TaxId',
                    ]"
                    :key="field"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span
                        >Show Client
                        {{ field === "TaxId" ? "Tax ID" : field }}</span
                    >
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block[`show${field}`] !== false"
                            @change="handleCheckbox(`show${field}`, $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>

            <!-- Field Position (Order) -->
            <div class="divider" style="margin-top: 12px" />
            <div class="field-label" style="margin-top: 8px">Field Position (Order)</div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px">
                <div
                    v-for="(fld, idx) in clientFieldsSorted"
                    :key="fld.id"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0, 0, 0, 0.15);
                        padding: 4px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <span style="font-size: 11px; font-weight: 500;">{{ fld.name }}</span>
                    <div style="display: flex; gap: 2px;">
                        <button
                            class="btn btn-ghost btn-icon"
                            style="width: 22px; height: 22px; padding: 0"
                            :disabled="idx === 0"
                            @click="moveField(idx, idx - 1)"
                        >
                            ▲
                        </button>
                        <button
                            class="btn btn-ghost btn-icon"
                            style="width: 22px; height: 22px; padding: 0"
                            :disabled="idx === clientFieldsSorted.length - 1"
                            @click="moveField(idx, idx + 1)"
                        >
                            ▼
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── BANK DETAILS ─── -->
        <div v-else-if="block.type === 'bank_details'" class="field-group">
            <div class="field-label">Bank Info Settings</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin-bottom:10px">Edit bank details directly on the canvas.</p>
            <div class="divider" />

            <div class="field-label" style="margin-top: 8px">
                Show / Hide Fields
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                    v-for="field in ['BankName', 'AccountNo', 'AccountName']"
                    :key="field"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span
                        >Show
                        {{ field.replace(/([A-Z])/g, " $1").trim() }}</span
                    >
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block[`show${field}`] !== false"
                            @change="handleCheckbox(`show${field}`, $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>
        </div>

        <!-- ─── HEADER GRID ─── -->
        <div v-else-if="block.type === 'header_grid'" class="field-group">
            <div class="field-label">Grid Columns</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0 0 12px">
                Edit column content directly on the canvas using Fill Mode.
            </p>
            <div style="display: flex; flex-direction: column; gap: 16px">
                <div
                    v-for="(col, i) in block.columns ?? []"
                    :key="i"
                    style="display: flex; flex-direction: column; gap: 6px"
                >
                    <div
                        style="
                            font-size: 11px;
                            font-weight: 600;
                            color: var(--color-panel-muted);
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                        "
                    >
                        Column {{ i + 1 }}
                    </div>
                    <div class="field-single" style="margin-bottom: 4px">
                        <label
                            style="
                                font-size: 10px;
                                color: var(--color-panel-muted);
                                display: block;
                                margin-bottom: 2px;
                            "
                            >Column Label</label
                        >
                        <input
                            type="text"
                            :value="col.label ?? ''"
                            class="inp"
                            placeholder="e.g. From"
                            :disabled="block.locked"
                            @input="updateHeaderColumn(i, 'label', $event.target.value)"
                            @blur="commitHistory"
                        />
                    </div>
                    <div class="field-single">
                        <label
                            style="
                                font-size: 10px;
                                color: var(--color-panel-muted);
                                display: block;
                                margin-bottom: 2px;
                            "
                            >Content</label
                        >
                        <textarea
                            :value="col.content ?? ''"
                            class="inp"
                            style="height: 64px; resize: vertical; font-size: 11px"
                            placeholder="Type content here..."
                            :disabled="block.locked"
                            @input="updateHeaderColumn(i, 'content', $event.target.value)"
                            @blur="commitHistory"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── TOTALS BLOCK ─── -->

        <div v-else-if="block.type === 'totals_block'" class="field-group">
            <div class="field-label">Totals Block Settings</div>

            <!-- Select Currency -->
            <div class="field-single" style="margin-bottom: 12px">
                <label
                    style="
                        font-size: 10px;
                        color: var(--color-panel-muted);
                        display: block;
                        margin-bottom: 4px;
                    "
                    >Currency</label
                >
                <select
                    :value="block.currency ?? settingsStore.currency"
                    class="inp"
                    @change="handleInput('currency', $event, false)"
                    @blur="commitHistory"
                >
                    <option
                        v-for="c in settingsStore.currencies"
                        :key="c.code"
                        :value="c.code"
                    >
                        {{ c.code }} ({{ c.symbol }})
                    </option>
                </select>
            </div>

            <!-- Financial Toggles -->
            <div
                style="
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 12px;
                "
            >
                <div
                    v-for="field in [
                        'Subtotal',
                        'Discount',
                        'Tax',
                        'Total',
                        'Balance',
                    ]"
                    :key="field"
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span
                        >Show
                        {{ field === "Balance" ? "Balance Due" : field }}</span
                    >
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block[`show${field}`] !== false"
                            @change="handleCheckbox(`show${field}`, $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>

            <!-- Tax & Discount Configuration -->
            <div class="divider" />
            <div class="field-row" style="margin-top: 8px">
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Tax Rate</label
                    >
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.taxRate ?? 10"
                            class="inp"
                            min="0"
                            max="100"
                            @input="handleInput('taxRate', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">%</span>
                    </div>
                </div>
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Discount Type</label
                    >
                    <select
                        :value="block.discountType ?? 'fixed'"
                        class="inp"
                        @change="handleInput('discountType', $event, false)"
                        @blur="commitHistory"
                    >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percent">Percentage</option>
                    </select>
                </div>
            </div>

            <div class="field-single" style="margin-top: 8px">
                <label
                    style="
                        font-size: 10px;
                        color: var(--color-panel-muted);
                        display: block;
                        margin-bottom: 2px;
                    "
                    >Discount Value</label
                >
                <div class="field-unit">
                    <input
                        type="number"
                        :value="block.discountValue ?? 0"
                        class="inp"
                        min="0"
                        @input="handleInput('discountValue', $event)"
                        @blur="commitHistory"
                    />
                    <span class="field-unit-label">{{
                        block.discountType === "percent"
                            ? "%"
                            : (block.currency ?? settingsStore.currency)
                    }}</span>
                </div>
            </div>
        </div>

        <!-- ─── ITEM TABLE BLOCK ─── -->
        <div v-else-if="block.type === 'item_table'" class="field-group">
            <div class="field-label">Table Settings</div>

            <div class="field-row">
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Empty Rows</label
                    >
                    <input
                        type="number"
                        :value="block.emptyRows ?? 3"
                        class="inp"
                        min="0"
                        max="20"
                        @input="handleInput('emptyRows', $event)"
                        @blur="commitHistory"
                    />
                </div>
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 2px;
                        "
                        >Body Font Size</label
                    >
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.bodyFontSize ?? 12"
                            class="inp"
                            min="8"
                            max="24"
                            @input="handleInput('bodyFontSize', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>

            <div
                style="
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 12px;
                    margin-bottom: 12px;
                "
            >
                <div
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span>Show Header Row</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.showHeader !== false"
                            @change="handleCheckbox('showHeader', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
                <div
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span>Show Row Numbers</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.showRowNumbers"
                            @change="handleCheckbox('showRowNumbers', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
                <div
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span>Show Table Borders</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.showBorders !== false"
                            @change="handleCheckbox('showBorders', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
                <div
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    "
                >
                    <span>Borders on Empty Rows</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.showEmptyRowBorders !== false"
                            @change="handleCheckbox('showEmptyRowBorders', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>

            <!-- Headers design -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Header Styles</div>
            <div class="field-row">
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 4px;
                        "
                        >Header Bg</label
                    >
                    <div style="display: flex; gap: 6px; align-items: center">
                        <input
                            type="color"
                            :value="
                                block.headerBg && block.headerBg.startsWith('#')
                                    ? block.headerBg
                                    : '#f5f5f5'
                            "
                            class="color-picker-input"
                            @input="updateProp('headerBg', $event.target.value)"
                            @change="commitHistory"
                        />
                        <input
                            type="text"
                            :value="block.headerBg ?? '#f5f5f5'"
                            class="inp"
                            @input="updateProp('headerBg', $event.target.value)"
                            @blur="commitHistory"
                        />
                    </div>
                </div>
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 4px;
                        "
                        >Header Color</label
                    >
                    <div style="display: flex; gap: 6px; align-items: center">
                        <input
                            type="color"
                            :value="
                                block.headerColor &&
                                block.headerColor.startsWith('#')
                                    ? block.headerColor
                                    : '#333333'
                            "
                            class="color-picker-input"
                            @input="
                                updateProp('headerColor', $event.target.value)
                            "
                            @change="commitHistory"
                        />
                        <input
                            type="text"
                            :value="block.headerColor ?? '#333333'"
                            class="inp"
                            @input="
                                updateProp('headerColor', $event.target.value)
                            "
                            @blur="commitHistory"
                        />
                    </div>
                </div>
            </div>

            <!-- Header Alignment -->
            <div class="field-row" style="margin-top: 10px; align-items: flex-start;">
                <div>
                    <div style="font-size: 9px; color: var(--color-panel-muted); margin-bottom: 4px;">Header H-Align</div>
                    <div class="align-btn-group">
                        <button
                            v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]"
                            :key="opt.v"
                            class="align-btn"
                            :class="{ active: (block.headerHAlign ?? 'left') === opt.v }"
                            :title="opt.v"
                            @click="updateProp('headerHAlign', opt.v); commitHistory();"
                        >{{ opt.label }}</button>
                    </div>
                </div>
                <div>
                    <div style="font-size: 9px; color: var(--color-panel-muted); margin-bottom: 4px;">Header V-Align</div>
                    <div class="align-btn-group">
                        <button
                            v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]"
                            :key="opt.v"
                            class="align-btn"
                            :class="{ active: (block.headerVAlign ?? 'middle') === opt.v }"
                            :title="opt.v"
                            @click="updateProp('headerVAlign', opt.v); commitHistory();"
                        >{{ opt.label }}</button>
                    </div>
                </div>
            </div>

            <!-- Header Font & Size -->
            <div class="field-row" style="margin-top: 10px">
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 4px;
                        "
                        >Header Font</label
                    >
                    <select
                        :value="block.headerFontFamily ?? 'inherit'"
                        class="inp"
                        @change="updateProp('headerFontFamily', $event.target.value); commitHistory();"
                    >
                        <option value="inherit">
                            Use Global Font
                        </option>
                        <option
                            v-for="font in settingsStore.fonts"
                            :key="font.value"
                            :value="font.value"
                        >
                            {{ font.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <label
                        style="
                            font-size: 10px;
                            color: var(--color-panel-muted);
                            display: block;
                            margin-bottom: 4px;
                        "
                        >Header Size</label
                    >
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.headerFontSize ?? block.bodyFontSize ?? 12"
                            class="inp"
                            min="6"
                            max="144"
                            @input="handleInput('headerFontSize', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>

            <!-- Column Configurator -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">
                Columns Visibility & Width
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px">
                <div
                    v-for="col in block.columns"
                    :key="col.id"
                    style="
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        background: rgba(0, 0, 0, 0.15);
                        padding: 6px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <!-- Top row: checkbox, label, width, delete -->
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <!-- Visible check -->
                        <input
                            type="checkbox"
                            :checked="col.visible !== false"
                            @change="updateColumnProp(col.id, 'visible', $event.target.checked)"
                        />

                        <!-- Column label -->
                        <input
                            type="text"
                            :value="col.label"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; flex: 1"
                            placeholder="Label"
                            @input="updateColumnProp(col.id, 'label', $event.target.value)"
                        />

                        <!-- Width -->
                        <div class="field-unit" style="width: 70px; height: 22px">
                            <input
                                type="number"
                                :value="col.width"
                                class="inp"
                                style="padding: 2px 4px; font-size: 11px; text-align: center;"
                                @input="updateColumnProp(col.id, 'width', parseFloat($event.target.value))"
                            />
                            <span class="field-unit-label" style="padding: 0 4px; font-size: 9px">%</span>
                        </div>

                        <!-- Delete button -->
                        <button
                            class="btn btn-ghost btn-icon text-danger"
                            style="width: 22px; height: 22px; padding: 0"
                            title="Delete Column"
                            @click="deleteColumn(col.id)"
                        >
                            <Trash2 :size="12" />
                        </button>
                    </div>

                    <!-- Bottom row: H-align, V-align, Bold toggles -->
                    <div style="display: flex; align-items: center; gap: 8px; padding-left: 2px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: var(--color-panel-muted); white-space: nowrap;">H:</span>
                            <div class="align-btn-group">
                                <button
                                    v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]"
                                    :key="opt.v"
                                    class="align-btn"
                                    :class="{ active: (col.hAlign ?? 'left') === opt.v }"
                                    :title="'Horizontal: ' + opt.v"
                                    @click="updateColumnProp(col.id, 'hAlign', opt.v)"
                                >{{ opt.label }}</button>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: var(--color-panel-muted); white-space: nowrap;">V:</span>
                            <div class="align-btn-group">
                                <button
                                    v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]"
                                    :key="opt.v"
                                    class="align-btn"
                                    :class="{ active: (col.vAlign ?? 'top') === opt.v }"
                                    :title="'Vertical: ' + opt.v"
                                    @click="updateColumnProp(col.id, 'vAlign', opt.v)"
                                >{{ opt.label }}</button>
                            </div>
                        </div>
                        <button
                            class="align-btn"
                            :class="{ active: col.bold }"
                            style="font-weight: 700; font-size: 11px; width: 20px; height: 18px;"
                            title="Bold"
                            @click="updateColumnProp(col.id, 'bold', !col.bold)"
                        >B</button>
                    </div>

                    <!-- Data key & format -->
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px; row-gap: 4px; padding-left: 2px;">
                        <input
                            type="text"
                            :value="col.dataKey ?? col.id"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; width: 80px; min-width: 60px; flex: 1 1 auto;"
                            placeholder="Data key"
                            @input="updateColumnProp(col.id, 'dataKey', $event.target.value)"
                        />
                        <select
                            :value="getColumnFormat(col).type"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; width: 68px; flex: 0 0 auto;"
                            @change="updateColumnFormatType(col.id, $event.target.value)"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                        </select>
                        <template v-if="getColumnFormat(col).type === 'currency'">
                            <input
                                type="text"
                                :value="col.format?.currency ?? 'USD'"
                                class="inp"
                                style="padding: 2px 4px; font-size: 11px; width: 50px; flex: 0 0 auto; text-align: center;"
                                placeholder="USD $"
                                @change="updateColumnFormatOption(col.id, 'currency', $event.target.value)"
                            />
                        </template>
                        <template v-if="getColumnFormat(col).type === 'number' || getColumnFormat(col).type === 'currency'">
                            <div class="field-unit" style="width: 48px; height: 22px; flex: 0 0 auto;">
                                <input
                                    type="text"
                                    inputmode="numeric"
                                    :value="col.format?.decimals ?? 2"
                                    class="inp"
                                    style="padding: 2px 4px; font-size: 11px; text-align: center;"
                                    @change="updateColumnFormatOption(col.id, 'decimals', parseInt($event.target.value, 10) || 0)"
                                />
                                <span class="field-unit-label" style="padding: 0 3px; font-size: 9px;">dec</span>
                            </div>
                        </template>
                    </div>
                </div>

                <button
                    class="btn btn-ghost"
                    style="width: 100%; font-size: 11px; padding: 5px 0; margin-top: 4px"
                    @click="addColumn"
                >
                    + Add Column
                </button>
            </div>

            <!-- ROW TYPES SECTION -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Row Types</div>
            <div style="margin-bottom: 10px;">
                <select
                    class="inp"
                    style="width: 100%; font-size: 11px; padding: 5px; height: 28px;"
                    @change="if ($event.target.value) { addSpecialRow($event.target.value); $event.target.value = ''; }"
                >
                    <option value="">+ Add Row Type...</option>
                    <option value="summary">Summary Row (bold text, custom bg)</option>
                    <option value="section_header">Section Header Row (full width label)</option>
                    <option value="split">Split Row (left details + right totals)</option>
                    <option value="divider">Divider Row (thin horizontal line)</option>
                </select>
            </div>

            <!-- List of added special rows -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                <div
                    v-for="(row, rIdx) in (block.specialRows || [])"
                    :key="row.id"
                    style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--color-panel-border); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 8px;"
                >
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 11px; font-weight: bold; color: var(--color-panel-primary); text-transform: capitalize;">
                            {{ row.type.replace('_', ' ') }} Row
                        </span>
                        <div style="display: flex; gap: 6px;">
                            <button
                                class="btn btn-ghost"
                                style="font-size: 10px; padding: 2px 6px;"
                                @click="toggleEditSpecialRow(row.id)"
                            >
                                ✏ {{ editingRowId === row.id ? 'Close' : 'Edit' }}
                            </button>
                            <button
                                class="btn btn-ghost text-danger"
                                style="font-size: 10px; padding: 2px 6px;"
                                @click="deleteSpecialRow(rIdx)"
                            >
                                🗑 Delete
                            </button>
                        </div>
                    </div>
                    
                    <!-- Inline edit fields -->
                    <div
                        v-if="editingRowId === row.id"
                        style="display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);"
                    >
                        <!-- Summary Row fields -->
                        <template v-if="row.type === 'summary'">
                            <div>
                                <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Text</label>
                                <input
                                    type="text"
                                    :value="row.text"
                                    class="inp"
                                    @input="updateSpecialRowProp(row.id, 'text', $event.target.value)"
                                />
                            </div>
                            <div class="field-row">
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Bg Color</label>
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <input
                                            type="color"
                                            :value="row.bgColor || '#ffffff'"
                                            class="color-picker-input"
                                            @input="updateSpecialRowProp(row.id, 'bgColor', $event.target.value)"
                                        />
                                        <input
                                            type="text"
                                            :value="row.bgColor"
                                            class="inp"
                                            placeholder="Default"
                                            @input="updateSpecialRowProp(row.id, 'bgColor', $event.target.value)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Text Color</label>
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <input
                                            type="color"
                                            :value="row.textColor || '#333333'"
                                            class="color-picker-input"
                                            @input="updateSpecialRowProp(row.id, 'textColor', $event.target.value)"
                                        />
                                        <input
                                            type="text"
                                            :value="row.textColor"
                                            class="inp"
                                            placeholder="Default"
                                            @input="updateSpecialRowProp(row.id, 'textColor', $event.target.value)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Font Weight</label>
                                <select
                                    :value="row.fontWeight || 'bold'"
                                    class="inp"
                                    @change="updateSpecialRowProp(row.id, 'fontWeight', $event.target.value)"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                </select>
                            </div>
                            <!-- Alignment -->
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">H:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]" :key="opt.v" class="align-btn" :class="{ active: (row.hAlign ?? 'left') === opt.v }" @click="updateSpecialRowProp(row.id, 'hAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">V:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]" :key="opt.v" class="align-btn" :class="{ active: (row.vAlign ?? 'middle') === opt.v }" @click="updateSpecialRowProp(row.id, 'vAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                            </div>
                        </template>
                        
                        <!-- Section Header fields -->
                        <template v-if="row.type === 'section_header'">
                            <div>
                                <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Label Text</label>
                                <input
                                    type="text"
                                    :value="row.text"
                                    class="inp"
                                    @input="updateSpecialRowProp(row.id, 'text', $event.target.value)"
                                />
                            </div>
                            <div class="field-row">
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Bg Color</label>
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <input
                                            type="color"
                                            :value="row.bgColor || '#ffffff'"
                                            class="color-picker-input"
                                            @input="updateSpecialRowProp(row.id, 'bgColor', $event.target.value)"
                                        />
                                        <input
                                            type="text"
                                            :value="row.bgColor"
                                            class="inp"
                                            placeholder="Default"
                                            @input="updateSpecialRowProp(row.id, 'bgColor', $event.target.value)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Text Color</label>
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <input
                                            type="color"
                                            :value="row.textColor || '#333333'"
                                            class="color-picker-input"
                                            @input="updateSpecialRowProp(row.id, 'textColor', $event.target.value)"
                                        />
                                        <input
                                            type="text"
                                            :value="row.textColor"
                                            class="inp"
                                            placeholder="Default"
                                            @input="updateSpecialRowProp(row.id, 'textColor', $event.target.value)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <!-- Alignment -->
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">H:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]" :key="opt.v" class="align-btn" :class="{ active: (row.hAlign ?? 'left') === opt.v }" @click="updateSpecialRowProp(row.id, 'hAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">V:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]" :key="opt.v" class="align-btn" :class="{ active: (row.vAlign ?? 'middle') === opt.v }" @click="updateSpecialRowProp(row.id, 'vAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                            </div>
                        </template>
                        
                        <!-- Split Row fields -->
                        <template v-if="row.type === 'split'">
                            <div>
                                <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Left Cell (Bank Details, Notes)</label>
                                <textarea
                                    :value="row.leftText"
                                    class="inp"
                                    style="height: 60px; font-family: monospace; font-size: 10px; resize: vertical;"
                                    @input="updateSpecialRowProp(row.id, 'leftText', $event.target.value)"
                                />
                            </div>
                            <!-- Left cell alignment -->
                            <div style="display: flex; gap: 12px; align-items: center; padding-left: 2px;">
                                <span style="font-size: 9px; color: var(--color-panel-muted); white-space: nowrap;">Left:</span>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">H:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]" :key="opt.v" class="align-btn" :class="{ active: (row.leftHAlign ?? 'left') === opt.v }" @click="updateSpecialRowProp(row.id, 'leftHAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">V:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]" :key="opt.v" class="align-btn" :class="{ active: (row.leftVAlign ?? 'top') === opt.v }" @click="updateSpecialRowProp(row.id, 'leftVAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Right Cell (Totals Summary)</label>
                                <textarea
                                    :value="row.rightText"
                                    class="inp"
                                    style="height: 60px; font-family: monospace; font-size: 10px; resize: vertical;"
                                    @input="updateSpecialRowProp(row.id, 'rightText', $event.target.value)"
                                />
                            </div>
                            <!-- Right cell alignment -->
                            <div style="display: flex; gap: 12px; align-items: center; padding-left: 2px;">
                                <span style="font-size: 9px; color: var(--color-panel-muted); white-space: nowrap;">Right:</span>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">H:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'left',label:'←'},{v:'center',label:'↔'},{v:'right',label:'→'}]" :key="opt.v" class="align-btn" :class="{ active: (row.rightHAlign ?? 'right') === opt.v }" @click="updateSpecialRowProp(row.id, 'rightHAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: var(--color-panel-muted);">V:</span>
                                    <div class="align-btn-group">
                                        <button v-for="opt in [{v:'top',label:'↑'},{v:'middle',label:'↕'},{v:'bottom',label:'↓'}]" :key="opt.v" class="align-btn" :class="{ active: (row.rightVAlign ?? 'top') === opt.v }" @click="updateSpecialRowProp(row.id, 'rightVAlign', opt.v)">{{ opt.label }}</button>
                                    </div>
                                </div>
                            </div>
                            <div class="field-row">
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Left Width %</label>
                                    <input
                                        type="number"
                                        :value="row.leftWidth ?? 60"
                                        min="10"
                                        max="90"
                                        class="inp"
                                        @input="updateSpecialRowProp(row.id, 'leftWidth', parseFloat($event.target.value) || 60)"
                                    />
                                </div>
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Right Width %</label>
                                    <input
                                        type="text"
                                        :value="100 - (row.leftWidth ?? 60) + '% (Auto)'"
                                        class="inp"
                                        disabled
                                    />
                                </div>
                            </div>
                        </template>
                        
                        <!-- Divider Row fields -->
                        <template v-if="row.type === 'divider'">
                            <div class="field-row">
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Line Color</label>
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <input
                                            type="color"
                                            :value="row.color || '#e0e0e0'"
                                            class="color-picker-input"
                                            @input="updateSpecialRowProp(row.id, 'color', $event.target.value)"
                                        />
                                        <input
                                            type="text"
                                            :value="row.color"
                                            class="inp"
                                            placeholder="Default"
                                            @input="updateSpecialRowProp(row.id, 'color', $event.target.value)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Thickness (px)</label>
                                    <input
                                        type="number"
                                        :value="row.thickness ?? 1"
                                        min="1"
                                        max="10"
                                        class="inp"
                                        @input="updateSpecialRowProp(row.id, 'thickness', parseFloat($event.target.value) || 1)"
                                    />
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- CELL MERGE SECTION -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Cell Merge</div>
            <div style="margin-bottom: 10px;">
                <select
                    class="inp"
                    style="width: 100%; font-size: 11px; padding: 5px; height: 28px;"
                    :disabled="selectedCellsCount < 2 && !hasSelectedMerge"
                    @change="handleMergeSelect($event.target.value); $event.target.value = '';"
                >
                    <option value="">Merge Options...</option>
                    <option value="merge_center" :disabled="selectedCellsCount < 2">
                        ↔ Merge & Center
                    </option>
                    <option value="merge_across" :disabled="selectedCellsCount < 2">
                        ➔ Merge Across
                    </option>
                    <option value="merge_cells" :disabled="selectedCellsCount < 2">
                        田 Merge Cells
                    </option>
                    <option value="unmerge" :disabled="!hasSelectedMerge">
                        ⚏ Unmerge Cells
                    </option>
                </select>
            </div>
            
            <!-- List of active merges -->
            <div
                v-if="(block.mergedCells || []).length > 0"
                style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;"
            >
                <div style="font-size: 10px; color: var(--color-panel-muted); margin-bottom: 2px;">Merged Ranges:</div>
                <div
                    v-for="m in block.mergedCells"
                    :key="m.id"
                    style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-panel-border); border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;"
                >
                    <span>
                        Row {{ m.startRow + 1 }}{{ m.startRow !== m.endRow ? '-' + (m.endRow + 1) : '' }} ({{ m.startCol }} to {{ m.endCol }})
                    </span>
                    <button
                        class="btn btn-ghost text-danger"
                        style="font-size: 9px; padding: 1px 4px; height: auto;"
                        @click="unmergeCell(m.id)"
                    >
                        Unmerge
                    </button>
                </div>
            </div>

            <!-- CELL BORDERS SECTION -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Cell Borders</div>
            <div style="margin-bottom: 10px;">
                <select
                    class="inp"
                    style="width: 100%; font-size: 11px; padding: 5px; height: 28px;"
                    :disabled="selectedCellsCount === 0"
                    @change="applyCellBorder($event.target.value); $event.target.value = '';"
                >
                    <option value="">Borders Options...</option>
                    <option value="bottom">➖ Bottom Border</option>
                    <option value="top">▔ Top Border</option>
                    <option value="left">▏ Left Border</option>
                    <option value="right">▕ Right Border</option>
                    <option value="no_border">❌ No Border (Borderless)</option>
                    <option value="all_borders">田 All Borders</option>
                    <option value="outside">⬜ Outside Borders</option>
                    <option value="thick_outside">⬛ Thick Outside Borders</option>
                    <option value="bottom_double">‗ Bottom Double Border</option>
                    <option value="thick_bottom">▰ Thick Bottom Border</option>
                    <option value="top_bottom">＝ Top and Bottom Border</option>
                    <option value="top_thick_bottom">⎧ Top and Thick Bottom Border</option>
                    <option value="top_double_bottom">⎨ Top and Double Bottom Border</option>
                    <option value="clear_custom">🔄 Reset to Table Default</option>
                </select>
                <div v-if="selectedCellsCount === 0" style="font-size: 9px; color: var(--color-panel-muted); margin-top: 4px; font-style: italic;">
                    Select table cells to enable custom borders.
                </div>
            </div>

            <!-- ROW STYLING SECTION -->
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Row Styling</div>

            <!-- Alternating row colors -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Alternating Colors</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.alternatingRows"
                            @change="handleCheckbox('alternatingRows', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
                
                <div v-if="block.alternatingRows" class="field-row">
                    <div>
                        <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Row 1 Color</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input
                                type="color"
                                :value="block.row1Color || '#ffffff'"
                                class="color-picker-input"
                                @input="updateProp('row1Color', $event.target.value)"
                                @change="commitHistory"
                            />
                            <input
                                type="text"
                                :value="block.row1Color ?? '#ffffff'"
                                class="inp"
                                @input="updateProp('row1Color', $event.target.value)"
                                @blur="commitHistory"
                            />
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Row 2 Color</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input
                                type="color"
                                :value="block.row2Color || '#fafafa'"
                                class="color-picker-input"
                                @input="updateProp('row2Color', $event.target.value)"
                                @change="commitHistory"
                            />
                            <input
                                type="text"
                                :value="block.row2Color ?? '#fafafa'"
                                class="inp"
                                @input="updateProp('row2Color', $event.target.value)"
                                @blur="commitHistory"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary global overrides -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                <div style="font-size: 10px; font-weight: bold; color: var(--color-panel-primary); margin-top: 4px;">Summary/Total Rows Default</div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Font Weight Bold</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block.summaryBold !== false"
                            @change="handleCheckbox('summaryBold', $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
                <div class="field-row">
                    <div>
                        <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Bg Color</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input
                                type="color"
                                :value="block.summaryBg || '#f5f5f5'"
                                class="color-picker-input"
                                @input="updateProp('summaryBg', $event.target.value)"
                                @change="commitHistory"
                            />
                            <input
                                type="text"
                                :value="block.summaryBg ?? '#f5f5f5'"
                                class="inp"
                                @input="updateProp('summaryBg', $event.target.value)"
                                @blur="commitHistory"
                            />
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 9px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Text Color</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input
                                type="color"
                                :value="block.summaryColor || '#333333'"
                                class="color-picker-input"
                                @input="updateProp('summaryColor', $event.target.value)"
                                @change="commitHistory"
                            />
                            <input
                                type="text"
                                :value="block.summaryColor ?? '#333333'"
                                class="inp"
                                @input="updateProp('summaryColor', $event.target.value)"
                                @blur="commitHistory"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Borders & Padding -->
            <div class="field-row" style="margin-bottom: 10px;">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Border Style</label>
                    <select
                        :value="block.borderStyle || 'solid'"
                        class="inp"
                        @change="updateProp('borderStyle', $event.target.value); commitHistory();"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Cell Padding</label>
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.cellPadding"
                            class="inp"
                            min="0"
                            max="30"
                            placeholder="Auto"
                            @input="handleInput('cellPadding', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 10px;">
                <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Border Color</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <input
                        type="color"
                        :value="block.borderColor && block.borderColor.startsWith('#') ? block.borderColor : '#e0e0e0'"
                        class="color-picker-input"
                        @input="updateProp('borderColor', $event.target.value)"
                        @change="commitHistory"
                    />
                    <input
                        type="text"
                        :value="block.borderColor ?? '#e0e0e0'"
                        class="inp"
                        @input="updateProp('borderColor', $event.target.value)"
                        @blur="commitHistory"
                    />
                </div>
            </div>
        </div>

        <!-- ─── DOCUMENT HEADER BLOCK ─── -->
        <div v-else-if="block.type === 'document_header'" class="field-group">
            <div class="field-label">Document Header</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin-bottom:10px">Edit document title, number, dates, and reference directly on the canvas.</p>
            <div class="divider" />
            <div class="field-label" style="margin-top: 8px">Show / Hide Fields</div>
            <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                    v-for="row in [
                        { key: 'showNumber', label: 'Document Number' },
                        { key: 'showDate', label: 'Issue Date' },
                        { key: 'showDueDate', label: 'Due Date' },
                        { key: 'showRef', label: 'Reference' },
                    ]"
                    :key="row.key"
                    style="display:flex;align-items:center;justify-content:space-between"
                >
                    <span>{{ row.label }}</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            :checked="block[row.key] !== false"
                            @change="handleCheckbox(row.key, $event)"
                        />
                        <span class="toggle-track" />
                    </label>
                </div>
            </div>
        </div>

        <!-- ─── RECEIPT HEADER ─── -->
        <div v-else-if="block.type === 'receipt_header'" class="field-group">
            <div class="field-label">Receipt Header</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">Edit store name, address, and phone directly on the canvas.</p>
        </div>

        <!-- ─── RECEIPT FOOTER ─── -->
        <div v-else-if="block.type === 'receipt_footer'" class="field-group">
            <div class="field-label">Receipt Footer</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">Edit thank you message and policy note directly on the canvas.</p>
        </div>

        <!-- ─── CHECKBOXES ROW ─── -->
        <div v-else-if="block.type === 'checkboxes_row'" class="field-group">
            <div class="field-label">Checkbox Options</div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px">
                <div
                    v-for="(opt, index) in block.options ?? []"
                    :key="index"
                    style="
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        background: rgba(0,0,0,0.15);
                        padding: 6px 8px;
                        border-radius: 6px;
                        border: 1px solid var(--color-panel-border);
                    "
                >
                    <span style="font-size: 11px; font-weight: 500; flex: 1;">{{ opt.label || 'Option' }}</span>
                    <!-- Default checked -->
                    <label
                        style="font-size:10px;color:var(--color-panel-muted);display:flex;align-items:center;gap:3px;white-space:nowrap"
                    >
                        <input
                            type="checkbox"
                            :checked="opt.checked"
                            @change="updateCheckboxOption(index, 'checked', $event.target.checked); commitHistory()"
                        />
                        Pre-check
                    </label>
                    <!-- Delete -->
                    <button
                        class="btn btn-ghost btn-icon text-danger"
                        style="width:22px;height:22px;padding:0"
                        title="Delete Option"
                        @click="deleteCheckboxOption(index)"
                    >
                        <Trash2 :size="12" />
                    </button>
                </div>
                <button
                    class="btn btn-ghost"
                    style="width:100%;font-size:11px;padding:5px 0"
                    @click="addCheckboxOption"
                >
                    + Add Option
                </button>
            </div>
        </div>

        <!-- ─── STAMP BOX ─── -->
        <div v-else-if="block.type === 'stamp_box'" class="field-group">
            <div class="field-label">Stamp Box</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">Edit stamp box label directly on the canvas.</p>
        </div>

        <!-- ─── CARBON COPY LABEL ─── -->
        <div v-else-if="block.type === 'carbon_copy_label'" class="field-group">
            <div class="field-label">Copy Label</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">Edit copy label text directly on the canvas.</p>
        </div>

        <!-- ─── CONTAINER BLOCK ─── -->
        <div v-else-if="block.type === 'container'" class="field-group">
            <div class="field-label">Container Settings</div>
            <div
                style="display:flex;align-items:center;justify-content:space-between"
            >
                <span>Lock Children</span>
                <label class="toggle">
                    <input
                        type="checkbox"
                        :checked="block.lockChildren"
                        @change="handleCheckbox('lockChildren', $event)"
                    />
                    <span class="toggle-track" />
                </label>
            </div>
        </div>

        <!-- ─── SPACER ─── -->
        <div v-else-if="block.type === 'spacer'" class="field-group">
            <div class="field-label">Spacer</div>
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0">
                Resize the spacer block by dragging its handles on the canvas.
                Use the Layout tab to set exact height.
            </p>
        </div>

    </div>
</template>

<style scoped>
.tab-panel {
    display: flex;
    flex-direction: column;
}
.color-picker-input {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--color-panel-border);
    background: none;
    cursor: pointer;
    padding: 0;
}
.color-picker-input::-webkit-color-swatch-wrapper {
    padding: 0;
}
.color-picker-input::-webkit-color-swatch {
    border: none;
    border-radius: 5px;
}

/* Alignment toggle buttons */
.align-btn-group {
    display: flex;
    gap: 2px;
}
.align-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: 11px;
    line-height: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    color: var(--color-panel-muted);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    padding: 0;
}
.align-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-panel-fg);
}
.align-btn.active {
    background: var(--color-panel-primary);
    border-color: var(--color-panel-primary);
    color: #fff;
}
</style>
