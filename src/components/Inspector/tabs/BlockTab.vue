<script setup>
import { computed, ref } from "vue";
import { useBlockStore } from "../../../stores/blocks.js";
import { useHistoryStore } from "../../../stores/history.js";
import { useSettingsStore } from "../../../stores/settings.js";
import { Trash2 } from "@lucide/vue";
import { SAMPLE_DATA } from "../../../constants/variableFields.js";

const props = defineProps({
    block: { type: Object, required: true },
});

const blockStore = useBlockStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();

const editingRowId = ref(null);
const showRowTypeMenu = ref(false);
const sigImageInput = ref(null);

function triggerSignatureUpload() {
    if (sigImageInput.value) sigImageInput.value.click();
}

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

function handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            updateProp('signatureImage', event.target.result);
            commitHistory();
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
}

// When changing signature type on an existing block that may not have all
// the new properties yet, we patch all defaults in one shot so the
// relevant sub-panel immediately renders with proper values.
function handleSignatureTypeChange(newType) {
    const patch = { signatureType: newType };
    const b = props.block;
    if (b.signatureText === undefined)       patch.signatureText = '';
    if (b.signatureFont === undefined)       patch.signatureFont = 'Dancing Script';
    if (b.signatureFontSize === undefined)   patch.signatureFontSize = 24;
    if (b.signatureColor === undefined)      patch.signatureColor = '#0f2c59';
    if (b.signatureImage === undefined)      patch.signatureImage = null;
    if (b.signatureScale === undefined)      patch.signatureScale = 1.0;
    if (b.signatureRotation === undefined)   patch.signatureRotation = -2;
    if (b.lineWidth === undefined)           patch.lineWidth = 1;
    if (b.signerName === undefined)          patch.signerName = '';
    if (b.dateText === undefined)            patch.dateText = '';
    blockStore.updateBlock(b.id, patch);
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
        widthUnit: '%',
        visible: true,
        dataKey: "",
        format: { type: "text" },
        bold: false,
        subFields: undefined,
        subFieldsOpen: false,
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

const dragColId = ref(null);
const dragEnabledColId = ref(null);

function onDragStart(colId) {
    dragColId.value = colId;
}

function onDragOver(e) {
    e.preventDefault();
}

function onDragEnter(targetColId) {
    const fromId = dragColId.value;
    if (!fromId || fromId === targetColId) return;
    const columns = getStoredColumns();
    const fromIdx = columns.findIndex(c => c.id === fromId);
    const toIdx = columns.findIndex(c => c.id === targetColId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = columns.splice(fromIdx, 1);
    columns.splice(toIdx, 0, moved);
    updateProp("columns", columns);
}

function onDragEnd() {
    dragColId.value = null;
    dragEnabledColId.value = null;
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

function toggleColumnWidthUnit(colId) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    col.widthUnit = (col.widthUnit ?? '%') === '%' ? 'px' : '%';
    updateProp("columns", columns);
    commitHistory();
}

function toggleSubFields(colId) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    col.subFieldsOpen = !col.subFieldsOpen;
    updateProp("columns", columns);
}

function addSubField(colId) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    if (!col.subFields) col.subFields = [];
    col.subFields.push({ dataKey: "", bold: false, fontSize: 10, color: undefined, display: 'block', format: { type: 'text' } });
    col.subFieldsOpen = true;
    updateProp("columns", columns);
    commitHistory();
}

function removeSubField(colId, index) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col || !col.subFields) return;
    col.subFields.splice(index, 1);
    updateProp("columns", columns);
    commitHistory();
}

function clearSubFields(colId) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    col.subFields = [];
    updateProp("columns", columns);
    commitHistory();
}

function updateSubField(colId, index, prop, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col || !col.subFields || !col.subFields[index]) return;
    col.subFields[index][prop] = val;
    updateProp("columns", columns);
    commitHistory();
}

function updateSubFieldFmt(colId, index, key, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col || !col.subFields || !col.subFields[index]) return;
    const sub = col.subFields[index];
    if (!sub.format) sub.format = {};
    if (key === 'type') {
        sub.format.type = val;
        if (val === 'currency' && !sub.format.currency) sub.format.currency = 'USD';
        if (val === 'text') { delete sub.format.currency; delete sub.format.decimals; }
    } else {
        sub.format[key] = val;
    }
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

// ── item_table helpers ──
function autoBalanceWidths() {
    const columns = getStoredColumns();
    const visible = columns.filter(c => c.visible !== false && (c.widthUnit ?? '%') === '%');
    if (visible.length === 0) return;
    const share = Math.round((100 / visible.length) * 10) / 10;
    visible.forEach(c => { c.width = share; });
    updateProp('columns', columns);
    commitHistory();
}

function addTableRow() {
    const items = JSON.parse(JSON.stringify(props.block.items ?? []));
    items.push({ no: items.length + 1, description: '', qty: '', unit_price: '', discount: '', tax: '', total: '' });
    updateProp('items', items);
    commitHistory();
}

const availableDataKeys = computed(() => {
    const firstItem = SAMPLE_DATA.items?.[0] || {};
    return Object.keys(firstItem);
});

const showCustomKeyMap = ref({});

function isCustomKey(key) {
    if (!key) return false;
    return !availableDataKeys.value.includes(key);
}

function handleDataKeyChange(colId, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    if (val === '__custom__') {
        showCustomKeyMap.value[colId] = true;
    } else {
        showCustomKeyMap.value[colId] = false;
        col.dataKey = val;
        updateProp('columns', columns);
        commitHistory();
    }
}

const showCustomSubKeyMap = ref({});

function isCustomSubKey(key) {
    if (!key) return false;
    return !availableDataKeys.value.includes(key);
}

function handleSubDataKeyChange(colId, subIdx, val) {
    const columns = getStoredColumns();
    const col = columns.find(c => c.id === colId);
    if (!col || !col.subFields?.[subIdx]) return;
    
    const key = `${colId}_${subIdx}`;
    if (val === '__custom__') {
        showCustomSubKeyMap.value[key] = true;
    } else {
        showCustomSubKeyMap.value[key] = false;
        col.subFields[subIdx].dataKey = val;
        updateProp('columns', columns);
        commitHistory();
    }
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
            <p style="font-size:11px;color:var(--color-panel-muted);margin-bottom:12px">Edit signature line label, signer name, and date directly on the canvas.</p>

            <!-- Signature Type Select -->
            <div style="margin-bottom: 12px;">
                <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Signature Type</label>
                <select
                    :value="block.signatureType || 'none'"
                    class="inp"
                    style="width: 100%;"
                    @change="handleSignatureTypeChange($event.target.value)"
                >
                    <option value="none">Physical (Blank space to sign)</option>
                    <option value="text">Typed Script (Handwritten font)</option>
                    <option value="image">Upload Image (Digital Signature)</option>
                </select>
            </div>

            <!-- Typed Script Signature Section -->
            <div v-if="(block.signatureType || 'none') === 'text'" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; padding: 8px; border: 1px solid var(--color-panel-border); border-radius: 6px; background: rgba(255,255,255,0.02);">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Signature Text</label>
                    <input
                        type="text"
                        :value="block.signatureText ?? ''"
                        class="inp"
                        placeholder="e.g. John Doe"
                        @input="updateProp('signatureText', $event.target.value)"
                        @blur="commitHistory"
                    />
                </div>
                <div class="field-row">
                    <div>
                        <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Signature Font</label>
                        <select
                            :value="block.signatureFont || 'Dancing Script'"
                            class="inp"
                            @change="updateProp('signatureFont', $event.target.value); commitHistory();"
                        >
                            <option value="Dancing Script">Dancing Script</option>
                            <option value="Caveat">Caveat</option>
                            <option value="Pacifico">Pacifico</option>
                            <option value="Yellowtail">Yellowtail</option>
                            <option value="Mrs Saint Delafield">Mrs Saint Delafield</option>
                            <option value="Reenie Beanie">Reenie Beanie</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Font Size</label>
                        <div class="field-unit">
                            <input
                                type="number"
                                :value="block.signatureFontSize ?? 24"
                                class="inp"
                                min="12"
                                max="60"
                                @input="handleInput('signatureFontSize', $event)"
                                @blur="commitHistory"
                            />
                            <span class="field-unit-label">px</span>
                        </div>
                    </div>
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Ink Color</label>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <input
                            type="color"
                            :value="block.signatureColor || '#0f2c59'"
                            class="color-picker-input"
                            @input="updateProp('signatureColor', $event.target.value)"
                            @change="commitHistory"
                        />
                        <input
                            type="text"
                            :value="block.signatureColor ?? '#0f2c59'"
                            class="inp"
                            @input="updateProp('signatureColor', $event.target.value)"
                            @blur="commitHistory"
                        />
                    </div>
                </div>
            </div>

            <!-- Upload Signature Image Section -->
            <div v-if="(block.signatureType || 'none') === 'image'" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; padding: 8px; border: 1px solid var(--color-panel-border); border-radius: 6px; background: rgba(255,255,255,0.02);">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Signature Image</label>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button
                            class="btn btn-ghost"
                            style="flex: 1; font-size: 11px; padding: 5px 0;"
                            @click="triggerSignatureUpload"
                        >
                            {{ block.signatureImage ? 'Replace Image' : 'Upload Image' }}
                        </button>
                        <button
                            v-if="block.signatureImage"
                            class="btn btn-ghost text-danger"
                            style="font-size: 11px; padding: 5px 10px;"
                            @click="updateProp('signatureImage', null); commitHistory();"
                        >
                            Clear
                        </button>
                        <input
                            ref="sigImageInput"
                            type="file"
                            accept="image/*"
                            style="display: none;"
                            @change="handleSignatureUpload"
                        />
                    </div>
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Scale</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input
                            type="range"
                            min="0.2"
                            max="2.5"
                            step="0.05"
                            :value="block.signatureScale ?? 1.0"
                            style="flex: 1; height: 4px; background: var(--color-panel-border); border-radius: 2px; outline: none; -webkit-appearance: none;"
                            @input="updateProp('signatureScale', parseFloat($event.target.value)); commitHistory();"
                        />
                        <span style="font-size: 11px; min-width: 32px; text-align: right;">{{ Math.round((block.signatureScale ?? 1.0) * 100) }}%</span>
                    </div>
                </div>
            </div>

            <!-- Common Layout controls -->
            <div class="field-row" style="margin-bottom: 10px;">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Line Thickness</label>
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.lineWidth ?? 1"
                            class="inp"
                            min="1"
                            max="5"
                            @input="handleInput('lineWidth', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Rotation Angle</label>
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.signatureRotation ?? -2"
                            class="inp"
                            min="-15"
                            max="15"
                            step="1"
                            @input="handleInput('signatureRotation', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">deg</span>
                    </div>
                </div>
            </div>

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
            <p style="font-size:11px;color:var(--color-panel-muted);margin:0 0 8px">Edit watermark text directly on the canvas.</p>
            <div class="field-label">Rotation (degrees)</div>
            <input
                type="range"
                min="-90"
                max="90"
                step="1"
                :value="block.rotation ?? -45"
                class="range-input"
                @input="blockStore.updateBlock(block.id, { rotation: parseFloat($event.target.value) || 0 })"
                @change="commitHistory"
            />
            <div class="range-value">{{ block.rotation ?? -45 }}°</div>
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


        <!-- ─── ITEM TABLE BLOCK ─── -->
        <div v-else-if="block.type === 'item_table'" class="field-group">
            <div class="field-label">Table Settings</div>

            <!-- Row / Data settings -->
            <div class="field-row">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Empty Rows</label>
                    <input type="number" :value="block.emptyRows ?? 3" class="inp" min="0" max="20" @input="handleInput('emptyRows', $event)" @blur="commitHistory" />
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Default Row Height</label>
                    <div class="field-unit">
                        <input type="number" :value="block.defaultRowHeight ?? 30" class="inp" min="16" max="120" @input="handleInput('defaultRowHeight', $event)" @blur="commitHistory" />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>

            <!-- Body font -->
            <div class="field-row" style="margin-top: 8px;">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Body Font</label>
                    <select :value="block.fontFamily ?? 'inherit'" class="inp" @change="updateProp('fontFamily', $event.target.value); commitHistory();">
                        <option value="inherit">Use Global Font</option>
                        <option v-for="font in settingsStore.fonts" :key="font.value" :value="font.value">{{ font.name }}</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 2px;">Body Font Size</label>
                    <div class="field-unit">
                        <input type="number" :value="block.bodyFontSize ?? 12" class="inp" min="8" max="24" @input="handleInput('bodyFontSize', $event)" @blur="commitHistory" />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>

            <!-- Borders & Padding -->
            <div class="field-row" style="margin-top: 8px; margin-bottom: 8px;">
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
            <div style="margin-bottom: 12px;">
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
                        gap: 8px;
                    "
                >
                    <span>Data Row Borders</span>
                    <select
                        :value="block.dataRowBordersMode ?? 'grid'"
                        class="inp"
                        style="width: 110px; padding: 2px 4px; font-size: 11px;"
                        @change="updateProp('dataRowBordersMode', $event.target.value)"
                    >
                        <option value="grid">Grid (All)</option>
                        <option value="vertical">Vertical Only</option>
                        <option value="horizontal">Horizontal Only</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                    "
                >
                    <span>Empty Row Borders</span>
                    <select
                        :value="block.emptyRowBordersMode ?? (block.showEmptyRowBorders === false ? 'none' : 'grid')"
                        class="inp"
                        style="width: 110px; padding: 2px 4px; font-size: 11px;"
                        @change="updateProp('emptyRowBordersMode', $event.target.value)"
                    >
                        <option value="grid">Grid (All)</option>
                        <option value="vertical">Vertical Only</option>
                        <option value="horizontal">Horizontal Only</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>

            <!-- Alternating Row Colors -->
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Alternating Row Colors</span>
                    <label class="toggle">
                        <input type="checkbox" :checked="block.alternatingRows" @change="handleCheckbox('alternatingRows', $event)" />
                        <span class="toggle-track" />
                    </label>
                </div>
                <div v-if="block.alternatingRows" class="field-row" style="margin-top: 2px;">
                    <div>
                        <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Row 1 (Even)</label>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="color" :value="block.row1Color ?? '#ffffff'" class="color-picker-input" @input="updateProp('row1Color', $event.target.value)" @change="commitHistory" />
                            <input type="text" :value="block.row1Color ?? '#ffffff'" class="inp" @input="updateProp('row1Color', $event.target.value)" @blur="commitHistory" />
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Row 2 (Odd)</label>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="color" :value="block.row2Color ?? '#fafafa'" class="color-picker-input" @input="updateProp('row2Color', $event.target.value)" @change="commitHistory" />
                            <input type="text" :value="block.row2Color ?? '#fafafa'" class="inp" @input="updateProp('row2Color', $event.target.value)" @blur="commitHistory" />
                        </div>
                    </div>
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

            <!-- Header Font Weight -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
                <span>Header Bold</span>
                <label class="toggle">
                    <input type="checkbox" :checked="(block.headerFontWeight ?? 'bold') === 'bold'" @change="updateProp('headerFontWeight', $event.target.checked ? 'bold' : 'normal'); commitHistory();" />
                    <span class="toggle-track" />
                </label>
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
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; margin-bottom: 4px;">
                <div class="field-label" style="margin: 0;">Columns &amp; Width</div>
                <button class="btn btn-ghost" style="font-size: 10px; padding: 3px 8px;" title="Distribute column widths equally" @click="autoBalanceWidths">⚖ Balance</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px">
                <div
                    v-for="col in block.columns"
                    :key="col.id"
                    :draggable="dragEnabledColId === col.id"
                    :style="{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: dragColId === col.id ? 'var(--color-accent-dim)' : 'var(--color-card-bg)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid ' + (dragColId === col.id ? 'var(--color-accent)' : 'var(--color-panel-border)'),
                        cursor: dragEnabledColId === col.id ? 'grabbing' : 'grab',
                        transition: 'background 0.15s, border-color 0.15s',
                    }"
                    @dragstart="onDragStart(col.id)"
                    @dragover="onDragOver"
                    @dragenter="onDragEnter(col.id)"
                    @dragend="onDragEnd"
                >
                    <!-- Top row: drag handle, checkbox, label, width, delete -->
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <!-- Drag handle -->
                        <span
                            style="font-size:12px;color:var(--color-panel-muted,#666);cursor:grab;user-select:none;flex-shrink:0"
                            @mousedown="dragEnabledColId = col.id"
                            @mouseup="dragEnabledColId = null"
                            @mouseleave="dragEnabledColId = null"
                        >⠿</span>
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
                        <div class="field-unit" style="width: 60px; height: 22px">
                            <input
                                type="number"
                                :value="col.width"
                                class="inp"
                                style="padding: 2px 4px; font-size: 11px; text-align: center;"
                                @change="updateColumnProp(col.id, 'width', $event.target.valueAsNumber || 0)"
                            />
                        </div>
                        <button
                            style="font-size:9px;padding:1px 4px;border:1px solid var(--color-panel-border);border-radius:3px;background:transparent;color:var(--color-panel-muted);cursor:pointer;height:22px;flex-shrink:0"
                            @click="toggleColumnWidthUnit(col.id)"
                        >{{ col.widthUnit ?? '%' }}</button>

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
                        <input
                            type="color"
                            :value="col.color ?? '#000000'"
                            style="width: 18px; height: 18px; padding: 0; border: none; border-radius: 2px; cursor: pointer; flex-shrink: 0;"
                            title="Color"
                            @input="updateColumnProp(col.id, 'color', $event.target.value)"
                        />
                    </div>

                    <!-- Data key & format -->
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px; row-gap: 4px; padding-left: 2px;">
                        <select
                            :value="isCustomKey(col.dataKey) ? '__custom__' : (col.dataKey ?? col.id)"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; width: 70px; min-width: 50px; flex: 1 1 auto;"
                            @change="handleDataKeyChange(col.id, $event.target.value)"
                        >
                            <option v-for="key in availableDataKeys" :key="key" :value="key">{{ key }}</option>
                            <option value="__custom__">Manual...</option>
                        </select>
                        <input
                            v-if="isCustomKey(col.dataKey) || showCustomKeyMap[col.id]"
                            type="text"
                            :value="col.dataKey ?? ''"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; width: 70px; min-width: 50px; flex: 1 1 auto;"
                            placeholder="Data key"
                            @input="updateColumnProp(col.id, 'dataKey', $event.target.value)"
                        />
                        <input
                            type="text"
                            :value="col.group ?? ''"
                            class="inp"
                            style="padding: 2px 4px; font-size: 11px; width: 60px; min-width: 40px; flex: 1 1 auto;"
                            placeholder="Group"
                            title="Header Group (e.g. Price, Amount)"
                            @input="updateColumnProp(col.id, 'group', $event.target.value)"
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

                        <!-- Sub-Fields (multi-value) -->
                        <div style="margin-top:4px;padding-left:2px">
                            <div style="display:flex;align-items:center;gap:4px;cursor:pointer;user-select:none" @click="toggleSubFields(col.id)">
                                <span style="font-size:9px;color:var(--color-panel-muted)">{{ col.subFieldsOpen ? '▼' : '▶' }}</span>
                                <span style="font-size:10px;font-weight:600;color:var(--color-panel-muted)">Sub-Fields ({{ (col.subFields || []).length }})</span>
                                <span v-if="col.subFields?.length" style="font-size:8px;color:var(--color-accent);margin-left:auto;cursor:pointer" @click.stop="clearSubFields(col.id)">Clear</span>
                            </div>
                            <div v-if="col.subFieldsOpen" style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
                                <div v-for="(sub, si) in (col.subFields || [])" :key="si" style="display:flex;flex-direction:column;gap:3px;background:var(--color-workspace);padding:4px 5px;border-radius:4px">
                                    <div style="display:flex;align-items:center;gap:4px">
                                        <button
                                            style="font-size:9px;padding:1px 3px;border:1px solid var(--color-panel-border);border-radius:3px;background:transparent;color:var(--color-panel-muted);cursor:pointer;width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0"
                                            :title="(sub.display ?? 'block') === 'block' ? 'New line' : 'Inline'"
                                            @click="updateSubField(col.id, si, 'display', (sub.display ?? 'block') === 'block' ? 'inline' : 'block')"
                                        >{{ (sub.display ?? 'block') === 'block' ? '↵' : '→' }}</button>
                                        <select
                                            :value="isCustomSubKey(sub.dataKey) ? '__custom__' : (sub.dataKey ?? sub.id ?? '')"
                                            class="inp"
                                            style="padding:2px 4px;font-size:10px;width:50px;flex:1"
                                            @change="handleSubDataKeyChange(col.id, si, $event.target.value)"
                                        >
                                            <option v-for="key in availableDataKeys" :key="key" :value="key">{{ key }}</option>
                                            <option value="__custom__">Manual...</option>
                                        </select>
                                        <input
                                            v-if="isCustomSubKey(sub.dataKey) || showCustomSubKeyMap[`${col.id}_${si}`]"
                                            type="text"
                                            :value="sub.dataKey ?? ''"
                                            class="inp"
                                            style="padding:2px 4px;font-size:10px;width:50px;flex:1"
                                            placeholder="Data key"
                                            @input="updateSubField(col.id, si, 'dataKey', $event.target.value)"
                                        />
                                        <button
                                            class="align-btn"
                                            :class="{ active: sub.bold }"
                                            style="font-weight: 700; font-size: 10px; width: 18px; height: 18px; line-height: 18px; padding: 0;"
                                            title="Bold"
                                            @click="updateSubField(col.id, si, 'bold', !sub.bold)"
                                        >B</button>
                                        <div class="field-unit" style="height: 18px; flex: 0 0 auto;">
                                            <input
                                                type="number"
                                                min="6"
                                                max="24"
                                                step="1"
                                                :value="sub.fontSize ?? 10"
                                                class="inp"
                                                style="padding: 1px 2px; font-size: 9px; width: 28px; text-align: center; height: 100%; border: none;"
                                                placeholder="Sz"
                                                @change="updateSubField(col.id, si, 'fontSize', parseInt($event.target.value) || undefined)"
                                            />
                                            <span class="field-unit-label" style="padding: 0 4px; font-size: 8px; border-left: 1px solid var(--color-panel-border);">px</span>
                                        </div>
                                        <input
                                            type="color"
                                            :value="sub.color ?? '#000000'"
                                            style="width:18px;height:18px;padding:0;border:none;border-radius:2px;cursor:pointer;flex-shrink:0"
                                            @input="updateSubField(col.id, si, 'color', $event.target.value)"
                                        />
                                        <button class="btn btn-ghost btn-icon text-danger" style="width:18px;height:18px;padding:0;font-size:10px;flex-shrink:0" title="Remove sub-field" @click="removeSubField(col.id, si)">×</button>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:4px;padding-left:22px">
                                        <select
                                            :value="(sub.format?.type ?? 'text')"
                                            class="inp"
                                            style="padding:1px 2px;font-size:9px;width:60px;flex:0 0 auto"
                                            @change="updateSubFieldFmt(col.id, si, 'type', $event.target.value)"
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="currency">Currency</option>
                                        </select>
                                        <template v-if="(sub.format?.type ?? 'text') === 'currency'">
                                            <input
                                                type="text"
                                                :value="sub.format?.currency ?? 'USD'"
                                                class="inp"
                                                style="padding:1px 2px;font-size:9px;width:44px;text-align:center"
                                                placeholder="USD"
                                                @change="updateSubFieldFmt(col.id, si, 'currency', $event.target.value)"
                                            />
                                        </template>
                                        <template v-if="(sub.format?.type ?? 'text') === 'number' || sub.format?.type === 'currency'">
                                            <div class="field-unit" style="height:18px;flex:0 0 auto">
                                                <input
                                                    type="text"
                                                    inputmode="numeric"
                                                    :value="sub.format?.decimals ?? 2"
                                                    class="inp"
                                                    style="padding:1px 2px;font-size:9px;width:26px;text-align:center;height:100%;border:none;"
                                                    @change="updateSubFieldFmt(col.id, si, 'decimals', parseInt($event.target.value, 10) || 0)"
                                                />
                                                <span class="field-unit-label" style="padding:0 4px;font-size:8px;border-left:1px solid var(--color-panel-border);">dec</span>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                                <button class="btn btn-ghost" style="font-size:9px;padding:2px 0;width:100%" @click="addSubField(col.id)">+ Add Sub-Field</button>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn btn-ghost" style="width: 100%; font-size: 11px; padding: 5px 0; margin-top: 4px" @click="addColumn">
                    + Add Column
                </button>
            </div>

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
                        background: var(--color-card-bg);
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

        <!-- ─── BARCODE ─── -->
        <div v-else-if="block.type === 'barcode'" class="field-group">
            <div class="field-label">Barcode Settings</div>

            <div class="field-label" style="margin-top:8px">Format</div>
            <select
                :value="block.barcodeFormat || 'CODE128'"
                class="field-select"
                @change="blockStore.updateBlock(block.id, { barcodeFormat: $event.target.value }); commitHistory()"
            >
                <option value="CODE128">Code 128</option>
                <option value="EAN13">EAN-13</option>
                <option value="UPCA">UPC-A</option>
                <option value="CODE39">Code 39</option>
                <option value="ITF">Interleaved 2 of 5</option>
                <option value="CODABAR">Codabar</option>
            </select>

            <div class="field-label" style="margin-top:8px">Content</div>
            <input
                type="text"
                :value="block.content ?? ''"
                class="field-input"
                placeholder="Data to encode"
                @input="blockStore.updateBlock(block.id, { content: $event.target.value })"
                @change="commitHistory"
            />

            <div class="field-label" style="margin-top:8px">Bar Width (px)</div>
            <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                :value="block.barcodeWidth ?? 2"
                class="field-input"
                @change="blockStore.updateBlock(block.id, { barcodeWidth: parseFloat($event.target.value) || 2 }); commitHistory()"
            />

            <div class="field-label" style="margin-top:8px">Bar Height (px)</div>
            <input
                type="number"
                min="10"
                max="300"
                step="5"
                :value="block.barcodeHeight ?? 50"
                class="field-input"
                @change="blockStore.updateBlock(block.id, { barcodeHeight: parseFloat($event.target.value) || 50 }); commitHistory()"
            />

            <div class="field-label" style="margin-top:8px">Show Text</div>
            <label class="toggle">
                <input
                    type="checkbox"
                    :checked="block.showBarcodeText !== false"
                    @change="blockStore.updateBlock(block.id, { showBarcodeText: $event.target.checked }); commitHistory()"
                />
                <span class="toggle-track" />
            </label>

            <div v-if="block.showBarcodeText !== false" class="field-label" style="margin-top:8px">Text Font Size</div>
            <input
                v-if="block.showBarcodeText !== false"
                type="number"
                min="6"
                max="24"
                step="1"
                :value="block.barcodeFontSize ?? 12"
                class="field-input"
                @change="blockStore.updateBlock(block.id, { barcodeFontSize: parseFloat($event.target.value) || 12 }); commitHistory()"
            />
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
            <div class="field-label">Spacer Settings</div>
            <div class="field-row">
                <div>
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Height</label>
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="block.height ?? 20"
                            class="inp"
                            min="5"
                            max="600"
                            @input="handleInput('height', $event)"
                            @blur="commitHistory"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <input
                    type="range"
                    :value="block.height ?? 20"
                    min="5"
                    max="300"
                    step="5"
                    style="width: 100%; accent-color: var(--color-accent, #00b4d8); cursor: pointer;"
                    @input="handleInput('height', $event)"
                    @change="commitHistory"
                />
            </div>
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
    background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    color: var(--color-panel-muted);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    padding: 0;
}
.align-btn:hover {
    background: var(--color-panel-hover);
    color: var(--color-panel-text);
}
.align-btn.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-workspace-secondary, #ffffff);
}
</style>
