<script setup>
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from "vue";
import { useBlockStore } from "../../stores/blocks.js";
import { useHistoryStore } from "../../stores/history.js";
import { useCanvasStore } from "../../stores/canvas.js";
import { resolveBlockBinding, formatValue } from "../../utils/variableResolver.js";
// Column resize
const resizingCol = ref(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

function onColResizeStart(colId, event) {
  event.preventDefault()
  event.stopPropagation()
  resizingCol.value = colId
  resizeStartX.value = event.clientX
  const col = (props.block.columns || []).find(c => c.id === colId)
  resizeStartWidth.value = col?.width ?? 10

  window.addEventListener('mousemove', onColResizeMove)
  window.addEventListener('mouseup', onColResizeEnd)
}

function onColResizeMove(event) {
  if (!resizingCol.value) return
  const dx = event.clientX - resizeStartX.value
  // Get table element width for % calculation
  const tableEl = document.querySelector('.invoice-table')
  const tableWidth = tableEl?.offsetWidth ?? 500
  const deltaPercent = (dx / tableWidth) * 100
  const newWidth = Math.max(3, resizeStartWidth.value + deltaPercent)
  const columns = JSON.parse(JSON.stringify(props.block.columns || []))
  const col = columns.find(c => c.id === resizingCol.value)
  if (col) {
    col.width = Math.round(newWidth * 10) / 10
    blockStore.updateBlock(props.block.id, { columns })
  }
}

function onColResizeEnd() {
  resizingCol.value = null
  commitHistory()
  window.removeEventListener('mousemove', onColResizeMove)
  window.removeEventListener('mouseup', onColResizeEnd)
}

// Row resize
const resizingRow = ref(null)
const resizeStartY = ref(0)
const resizeStartHeight = ref(0)

function onRowResizeStart(rowIndex, event) {
  event.preventDefault()
  event.stopPropagation()
  resizingRow.value = rowIndex
  resizeStartY.value = event.clientY
  resizeStartHeight.value = props.block.rowStyles?.[rowIndex]?.height ?? 32

  window.addEventListener('mousemove', onRowResizeMove)
  window.addEventListener('mouseup', onRowResizeEnd)
}

function onRowResizeMove(event) {
  if (resizingRow.value === null) return
  const dy = event.clientY - resizeStartY.value
  const newHeight = Math.max(20, resizeStartHeight.value + dy)
  const rowStyles = JSON.parse(JSON.stringify(props.block.rowStyles ?? {}))
  if (!rowStyles[resizingRow.value]) rowStyles[resizingRow.value] = {}
  rowStyles[resizingRow.value].height = Math.round(newHeight)
  blockStore.updateBlock(props.block.id, { rowStyles })
}

function onRowResizeEnd() {
  resizingRow.value = null
  commitHistory()
  window.removeEventListener('mousemove', onRowResizeMove)
  window.removeEventListener('mouseup', onRowResizeEnd)
}
const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const blockStore = useBlockStore();
const historyStore = useHistoryStore();
const canvasStore = useCanvasStore();

const visibleColumns = computed(() =>
    (props.block.columns ?? []).filter((c) => c.visible !== false),
);

const resolvedItems = computed(() => {
    const binding = resolveBlockBinding(props.block, null, canvasStore.previewMode);
    if (binding !== null && Array.isArray(binding)) {
        return binding;
    }
    return null;
});

const items = computed(() => {
    const resolved = resolvedItems.value;
    if (resolved) return resolved;
    return props.block.items ?? [];
});

const tableStyle = computed(() => ({
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.bodyFontSize ?? 12}px`,
    boxSizing: "border-box",
    layout: "fixed",
}));

const borderColor = computed(() => props.block.borderColor ?? "#e0e0e0");
const showBorders = computed(() => props.block.showBorders !== false);
const borderStyle = computed(() => props.block.borderStyle ?? "solid");

function cellBorder() {
    return showBorders.value ? `1px ${borderStyle.value} ${borderColor.value}` : "none";
}

function emptyCellBorder() {
    return props.block.showEmptyRowBorders !== false ? cellBorder() : "none";
}

function align(col) {
    if (col.hAlign) return col.hAlign;
    const numericCols = ["qty", "unit_price", "discount", "tax", "total"];
    return numericCols.includes(col.id) ? "right" : "left";
}

function vAlign(col) {
    return col.vAlign ?? "top";
}

function formatVal(col, item) {
    const key = col.dataKey ?? col.id;
    const val = item[key];
    if (val === undefined || val === null) return "";
    const fmt = col.format;
    if (fmt?.type && fmt.type !== 'text') {
        return formatValue(val, fmt.type, fmt);
    }
    return String(val);
}

function getCellBorderStyles(r, colId, isDataRow) {
    const defaultBorder = isDataRow ? cellBorder() : emptyCellBorder();
    const cellBorders = props.block.cellBorders ?? {};
    const merge = getMergeForCell(r, colId);
    
    if (merge) {
        const allCols = props.block.columns ?? [];
        const fullStartIdx = allCols.findIndex(c => c.id === merge.startCol);
        const fullEndIdx = allCols.findIndex(c => c.id === merge.endCol);
        const minC = Math.min(fullStartIdx, fullEndIdx);
        const maxC = Math.max(fullStartIdx, fullEndIdx);
        const minR = Math.min(merge.startRow, merge.endRow);
        const maxR = Math.max(merge.startRow, merge.endRow);
        
        let topVal = 'default', bottomVal = 'default', leftVal = 'default', rightVal = 'default';
        for (let cIdx = minC; cIdx <= maxC; cIdx++) {
            const cellKey = `${minR}:${allCols[cIdx].id}`;
            if (cellBorders[cellKey]?.top && cellBorders[cellKey].top !== 'default') topVal = cellBorders[cellKey].top;
        }
        for (let cIdx = minC; cIdx <= maxC; cIdx++) {
            const cellKey = `${maxR}:${allCols[cIdx].id}`;
            if (cellBorders[cellKey]?.bottom && cellBorders[cellKey].bottom !== 'default') bottomVal = cellBorders[cellKey].bottom;
        }
        for (let rIdx = minR; rIdx <= maxR; rIdx++) {
            const cellKey = `${rIdx}:${allCols[minC].id}`;
            if (cellBorders[cellKey]?.left && cellBorders[cellKey].left !== 'default') leftVal = cellBorders[cellKey].left;
        }
        for (let rIdx = minR; rIdx <= maxR; rIdx++) {
            const cellKey = `${rIdx}:${allCols[maxC].id}`;
            if (cellBorders[cellKey]?.right && cellBorders[cellKey].right !== 'default') rightVal = cellBorders[cellKey].right;
        }
        
        const resolve = (val) => val === 'none' ? 'none' : (val === 'thin' ? `1px solid ${borderColor.value}` : (val === 'thick' ? `2px solid ${borderColor.value}` : (val === 'double' ? `3px double ${borderColor.value}` : defaultBorder)));
        
        return { borderTop: resolve(topVal), borderBottom: resolve(bottomVal), borderLeft: resolve(leftVal), borderRight: resolve(rightVal) };
    }
    
    const override = cellBorders[`${r}:${colId}`];
    if (!override) return { borderTop: defaultBorder, borderBottom: defaultBorder, borderLeft: defaultBorder, borderRight: defaultBorder };
    
    const resolve = (val) => val === 'none' ? 'none' : (val === 'thin' ? `1px solid ${borderColor.value}` : (val === 'thick' ? `2px solid ${borderColor.value}` : (val === 'double' ? `3px double ${borderColor.value}` : defaultBorder)));
    return { borderTop: resolve(override.top), borderBottom: resolve(override.bottom), borderLeft: resolve(override.left), borderRight: resolve(override.right) };
}

const emptyRows = computed(() => Array(Math.max(0, (props.block.emptyRows ?? 0) - items.value.length)).fill(null));

const allRows = computed(() => {
    const list = [];
    items.value.forEach((item, i) => list.push({ index: i, isDataRow: true, item, localIndex: i }));
    emptyRows.value.forEach((_, i) => list.push({ index: items.value.length + i, isDataRow: false, item: null, localIndex: i }));
    return list;
});

const isBlockSelected = computed(() => blockStore.selectedIds.includes(props.block.id));

const lastSelectedCell = ref(null);
const isSelecting = ref(false);
const selectionStart = ref(null);
const selectionEnd = ref(null);
const editingCell = ref(null);
const editingHeaderColId = ref(null);
const editingSpecialRowId = ref(null);

const contextMenu = ref({ visible: false, x: 0, y: 0, type: 'cell', r: null, colId: null });

function closeContextMenu() {
    contextMenu.value.visible = false;
    window.removeEventListener('click', closeContextMenu);
}

function onCellContextMenu(r, colId, event) {
    if (!isBlockSelected.value) return;
    event.preventDefault(); event.stopPropagation();
    contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, type: 'cell', r, colId };
    setTimeout(() => window.addEventListener('click', closeContextMenu), 10);
}

function onRowNumberContextMenu(r, event) {
    if (!isBlockSelected.value) return;
    event.preventDefault(); event.stopPropagation();
    contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, type: 'row_number', r, colId: 'no' };
    setTimeout(() => window.addEventListener('click', closeContextMenu), 10);
}

function onColumnHeaderContextMenu(col, event) {
    if (!isBlockSelected.value) return;
    event.preventDefault(); event.stopPropagation();
    contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, type: 'column_header', r: null, colId: col.id };
    setTimeout(() => window.addEventListener('click', closeContextMenu), 10);
}

function insertRowAction(r, below) {
    const newItems = JSON.parse(JSON.stringify(props.block.items ?? []));
    newItems.splice(below ? parseInt(r) + 1 : parseInt(r), 0, { no: 1, description: "New Item", qty: 1, unit_price: 0, discount: 0, tax: 0, total: 0 });
    newItems.forEach((item, i) => item.no = i + 1);
    blockStore.updateBlock(props.block.id, { items: newItems });
    commitHistory(); closeContextMenu();
}

function deleteRowAction(r) {
    const idx = parseInt(r);
    const newItems = JSON.parse(JSON.stringify(props.block.items ?? []));
    if (idx < newItems.length) {
        newItems.splice(idx, 1);
        newItems.forEach((item, i) => item.no = i + 1);
        blockStore.updateBlock(props.block.id, { items: newItems });
    } else {
        const currentEmpty = props.block.emptyRows ?? 0;
        blockStore.updateBlock(props.block.id, { emptyRows: Math.max(0, currentEmpty - 1) });
    }
    commitHistory(); closeContextMenu();
}

function deleteSelectedRowsAction() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) {
        if (contextMenu.value.r !== null) deleteRowAction(contextMenu.value.r);
        return;
    }
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
    newItems.forEach((item, i) => item.no = i + 1);
    const updates = { items: newItems, selectedCells: [] };
    if (emptyRowsToDelete > 0) {
        const currentEmpty = props.block.emptyRows ?? 0;
        updates.emptyRows = Math.max(0, currentEmpty - emptyRowsToDelete);
    }
    blockStore.updateBlock(props.block.id, updates);
    commitHistory(); closeContextMenu();
}

function deleteSelectedColsAction() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) {
        if (contextMenu.value.colId) deleteColAction(contextMenu.value.colId);
        return;
    }
    const colIds = [...new Set(selected.map(cell => cell.split(':')[1]))];
    const filteredColIds = colIds.filter(id => id !== 'no' && id !== 'total');
    if (filteredColIds.length === 0) { closeContextMenu(); return; }
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const newCols = columns.filter(c => !filteredColIds.includes(c.id));
    blockStore.updateBlock(props.block.id, { columns: newCols, selectedCells: [] });
    commitHistory(); closeContextMenu();
}

function clearSelectedCellsAction() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length === 0) { closeContextMenu(); return; }
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
    }
    commitHistory(); closeContextMenu();
}

function handleGlobalKeyDown(event) {
    if (!isBlockSelected.value || (props.block.selectedCells ?? []).length === 0) return;
    if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        clearSelectedCellsAction();
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
});

function insertColAction(colId, right) {
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const idx = columns.findIndex(c => c.id === colId);
    columns.splice(right ? idx + 1 : idx, 0, { id: `col_${Date.now()}`, label: "New Column", width: 10, visible: true });
    blockStore.updateBlock(props.block.id, { columns });
    commitHistory(); closeContextMenu();
}

function deleteColAction(colId) {
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const idx = columns.findIndex(c => c.id === colId);
    if (idx !== -1) {
        columns.splice(idx, 1);
        blockStore.updateBlock(props.block.id, { columns });
        commitHistory();
    }
    closeContextMenu();
}

function mergeSelectedCells() {
    const selected = props.block.selectedCells ?? [];
    if (selected.length < 2) return;
    const allCols = props.block.columns ?? [];
    let minR = Infinity, maxR = -Infinity, minCIdx = Infinity, maxCIdx = -Infinity;
    selected.forEach(cellKey => {
        const [rStr, colId] = cellKey.split(':');
        const r = parseInt(rStr);
        const cIdx = allCols.findIndex(c => c.id === colId);
        if (cIdx !== -1) {
            minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            minCIdx = Math.min(minCIdx, cIdx); maxCIdx = Math.max(maxCIdx, cIdx);
        }
    });
    const mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells ?? []));
    mergedCells.push({ startRow: minR, endRow: maxR, startCol: allCols[minCIdx].id, endCol: allCols[maxCIdx].id });
    blockStore.updateBlock(props.block.id, { mergedCells });
    commitHistory(); closeContextMenu();
}

function unmergeSelectedCells() {
    const selected = props.block.selectedCells ?? [];
    const allCols = props.block.columns ?? [];
    let mergedCells = JSON.parse(JSON.stringify(props.block.mergedCells ?? []));
    mergedCells = mergedCells.filter(m => {
        const minC = Math.min(allCols.findIndex(c => c.id === m.startCol), allCols.findIndex(c => c.id === m.endCol));
        const maxC = Math.max(allCols.findIndex(c => c.id === m.startCol), allCols.findIndex(c => c.id === m.endCol));
        return !selected.some(cellKey => {
            const [rStr, colId] = cellKey.split(':');
            const cIdx = allCols.findIndex(c => c.id === colId);
            return parseInt(rStr) >= Math.min(m.startRow, m.endRow) && parseInt(rStr) <= Math.max(m.startRow, m.endRow) && cIdx >= minC && cIdx <= maxC;
        });
    });
    blockStore.updateBlock(props.block.id, { mergedCells });
    commitHistory(); closeContextMenu();
}

function updateRowStyleAction(r, prop, val) {
    const rowStyles = JSON.parse(JSON.stringify(props.block.rowStyles ?? {}));
    if (!rowStyles[r]) rowStyles[r] = {};
    rowStyles[r][prop] = val;
    blockStore.updateBlock(props.block.id, { rowStyles });
    commitHistory();
}

function setRowHeightPrompt(r) {
    const height = prompt("Enter Row Height (px):", props.block.rowStyles?.[r]?.height ?? 30);
    if (height !== null && !isNaN(parseInt(height))) updateRowStyleAction(r, 'height', parseInt(height));
    closeContextMenu();
}

function updateSelectedCellsAlign(dir, isVertical = false) {
    const cellStyles = JSON.parse(JSON.stringify(props.block.cellStyles ?? {}));
    (props.block.selectedCells ?? []).forEach(k => {
        if (!cellStyles[k]) cellStyles[k] = {};
        cellStyles[k][isVertical ? 'vAlign' : 'hAlign'] = dir;
    });
    blockStore.updateBlock(props.block.id, { cellStyles });
    commitHistory();
}

function updateColumnAlignmentAction(colId, prop, val) {
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const col = columns.find(c => c.id === colId);
    if (col) { col[prop] = val; blockStore.updateBlock(props.block.id, { columns }); commitHistory(); }
}

function setColumnWidth(colId) {
    const col = (props.block.columns || []).find(c => c.id === colId);
    const w = prompt("Enter Column Width (in %):", col?.width ?? 10);
    if (w !== null && !isNaN(parseFloat(w))) {
        const columns = JSON.parse(JSON.stringify(props.block.columns || []));
        columns.find(c => c.id === colId).width = parseFloat(w);
        blockStore.updateBlock(props.block.id, { columns }); commitHistory();
    }
    closeContextMenu();
}

function startHeaderColRename(colId) { editingHeaderColId.value = colId; closeContextMenu(); }

function updateColumnProp(colId, prop, val) {
    const columns = JSON.parse(JSON.stringify(props.block.columns || []));
    const col = columns.find(c => c.id === colId);
    if (col) { col[prop] = val; blockStore.updateBlock(props.block.id, { columns }); }
}

function selectRange(startCell, endCell) {
    const visibleCols = visibleColumns.value;
    const minR = Math.min(startCell.r, endCell.r), maxR = Math.max(startCell.r, endCell.r);
    const startC = visibleCols.findIndex(c => c.id === startCell.colId), endC = visibleCols.findIndex(c => c.id === endCell.colId);
    const minC = Math.min(startC, endC), maxC = Math.max(startC, endC);
    const cells = [];
    for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) cells.push(`${r}:${visibleCols[c].id}`);
    blockStore.updateBlock(props.block.id, { selectedCells: cells });
}

function onCellMouseDown(r, colId, event) {
    if (!isBlockSelected.value) { blockStore.selectBlock(props.block.id); }
    if (canvasStore.editingBlockId !== props.block.id) {
        canvasStore.editingBlockId = props.block.id;
    }
    event.stopPropagation();
    const cellId = `${r}:${colId}`;
    if (event.shiftKey && lastSelectedCell.value) { selectionStart.value = lastSelectedCell.value; selectionEnd.value = { r, colId }; selectRange(selectionStart.value, selectionEnd.value); }
    else {
        isSelecting.value = true; selectionStart.value = { r, colId }; selectionEnd.value = { r, colId }; lastSelectedCell.value = { r, colId };
        blockStore.updateBlock(props.block.id, { selectedCells: (event.ctrlKey || event.metaKey) ? [...(props.block.selectedCells ?? []), cellId] : [cellId] });
        window.addEventListener('mouseup', onMouseUpGlobal);
    }
    editingCell.value = { r, colId };
    nextTick(() => { const input = document.querySelector(`.cell-${r}-${colId} input`); if (input) { input.focus(); input.select(); } });
}

function startEditingCellAction(r, colId) {
    if (!isBlockSelected.value) { blockStore.selectBlock(props.block.id); }
    if (canvasStore.editingBlockId !== props.block.id) {
        canvasStore.editingBlockId = props.block.id;
    }
    editingCell.value = { r, colId };
    blockStore.updateBlock(props.block.id, { selectedCells: [`${r}:${colId}`] });
    nextTick(() => {
        const input = document.querySelector(`.cell-${r}-${colId} input`);
        if (input) {
            input.focus();
            input.select();
        }
    });
    closeContextMenu();
}

function onCellMouseEnter(r, colId) { if (isSelecting.value && selectionStart.value) { selectionEnd.value = { r, colId }; selectRange(selectionStart.value, selectionEnd.value); } }

function onMouseUpGlobal() { isSelecting.value = false; selectionStart.value = null; selectionEnd.value = null; window.removeEventListener('mouseup', onMouseUpGlobal); commitHistory(); }

function handleKeyDown(event) {
    if (!editingCell.value) return;
    const { r, colId } = editingCell.value;
    const allCols = visibleColumns.value;
    const colIdx = allCols.findIndex(c => c.id === colId);
    if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey && colIdx > 0) selectAndEditCell(r, allCols[colIdx - 1].id);
        else if (!event.shiftKey && colIdx < allCols.length - 1) selectAndEditCell(r, allCols[colIdx + 1].id);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey && r > 0) selectAndEditCell(r - 1, colId);
        else if (!event.shiftKey && r < allRows.value.length - 1) selectAndEditCell(r + 1, colId);
    } else if (event.key === 'Escape') { editingCell.value = null; blockStore.updateBlock(props.block.id, { selectedCells: [] }); }
}

function selectAndEditCell(r, colId) {
    blockStore.updateBlock(props.block.id, { selectedCells: [`${r}:${colId}`] }); editingCell.value = { r, colId };
    nextTick(() => { const input = document.querySelector(`.cell-${r}-${colId} input`); if (input) { input.focus(); input.select(); } });
}

function isCellSelected(r, colId) { return isBlockSelected.value && ((editingCell.value?.r === r && editingCell.value?.colId === colId) || (props.block.selectedCells ?? []).includes(`${r}:${colId}`)); }

function getMergeForCell(r, colId) {
    if (!props.block.mergedCells) return null;
    const allCols = props.block.columns ?? [];
    return props.block.mergedCells.find(m => {
        const fullStartIdx = allCols.findIndex(c => c.id === m.startCol), fullEndIdx = allCols.findIndex(c => c.id === m.endCol), fullColIdx = allCols.findIndex(c => c.id === colId);
        return fullStartIdx !== -1 && fullEndIdx !== -1 && fullColIdx !== -1 && r >= Math.min(m.startRow, m.endRow) && r <= Math.max(m.startRow, m.endRow) && fullColIdx >= Math.min(fullStartIdx, fullEndIdx) && fullColIdx <= Math.max(fullStartIdx, fullEndIdx);
    });
}

function getVisibleColsInMerge(merge) {
    const allCols = props.block.columns ?? [];
    const minC = Math.min(allCols.findIndex(c => c.id === merge.startCol), allCols.findIndex(c => c.id === merge.endCol));
    const maxC = Math.max(allCols.findIndex(c => c.id === merge.startCol), allCols.findIndex(c => c.id === merge.endCol));
    return visibleColumns.value.filter(c => { const idx = allCols.findIndex(oc => oc.id === c.id); return idx >= minC && idx <= maxC; });
}

function shouldRenderCell(r, colId) { const m = getMergeForCell(r, colId); if (!m) return true; const v = getVisibleColsInMerge(m); return v.length > 0 && r === Math.min(m.startRow, m.endRow) && colId === v[0].id; }

function getCellSpan(r, colId) { const m = getMergeForCell(r, colId); if (!m) return { rowspan: 1, colspan: 1 }; return { rowspan: Math.abs(m.endRow - m.startRow) + 1, colspan: getVisibleColsInMerge(m).length }; }

function getCellAlign(r, col) { return props.block.cellStyles?.[`${r}:${col.id}`]?.hAlign ?? (getMergeForCell(r, col.id)?.align ?? align(col)); }

function getCellVAlign(r, col) { return props.block.cellStyles?.[`${r}:${col.id}`]?.vAlign ?? vAlign(col); }

function getCellCustomStyles(r, col) {
    const rowStyle = props.block.rowStyles?.[r] ?? {}, cellStyle = props.block.cellStyles?.[`${r}:${col.id}`] ?? {};
    return {
        backgroundColor: isCellSelected(r, col.id) ? 'rgba(0, 180, 216, 0.15)' : (cellStyle.bgColor ?? rowStyle.bgColor ?? getRowBgColor(r)),
        color: cellStyle.textColor ?? rowStyle.textColor ?? '#333',
        fontWeight: (cellStyle.bold ?? rowStyle.bold ?? col.bold ?? (col.id === 'total' || rowStyle.isSummary || rowStyle.isHeader)) ? 'bold' : 'normal',
        fontStyle: (cellStyle.italic ?? rowStyle.italic) ? 'italic' : 'normal',
        height: rowStyle.height ? `${rowStyle.height}px` : undefined,
        borderBottom: rowStyle.isSummary ? `3px double ${borderColor.value}` : undefined
    };
}

const cellPaddingStyle = computed(() => props.block.cellPadding !== undefined ? `${props.block.cellPadding}px` : null);

function getRowBgColor(r) { return props.block.alternatingRows ? (r % 2 === 0 ? (props.block.row1Color ?? '#ffffff') : (props.block.row2Color ?? '#fafafa')) : 'transparent'; }

function getSplitRowColspans(leftWidth) {
    const N = visibleColumns.value.length, left = Math.max(1, Math.min(N - 1, Math.floor(N * ((leftWidth ?? 60) / 100))));
    return { leftColspan: left, rightColspan: Math.max(1, N - left) };
}

function updateSpecialRowProp(id, p, v) {
    const rows = JSON.parse(JSON.stringify(props.block.specialRows || []));
    const r = rows.find(x => x.id === id); if (r) { r[p] = v; blockStore.updateBlock(props.block.id, { specialRows: rows }); }
}

function updateItemValue(idx, field, val) {
    const items = JSON.parse(JSON.stringify(props.block.items ?? []));
    items[idx][field] = val;
    blockStore.updateBlock(props.block.id, { items });
}

function addRowInline() {
    const items = JSON.parse(JSON.stringify(props.block.items ?? []));
    items.push({ no: "", description: "", qty: "", unit_price: "", discount: "", tax: "", total: "" });
    blockStore.updateBlock(props.block.id, { items }); commitHistory();
}

function commitHistory() { historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks))); }

watch(editingHeaderColId, (newId) => { if (newId) nextTick(() => document.querySelector(`.header-cell-${newId} input`)?.focus()); });
watch(editingSpecialRowId, (newId) => { if (newId) nextTick(() => document.querySelector(`.special-row-${newId} input, .special-row-${newId} textarea`)?.focus()); });
</script>

<template>
    <div style="width: 100%; overflow: visible">
        <table :style="tableStyle">
            <thead v-if="block.showHeader !== false">
                <tr>
                    <th v-for="col in visibleColumns" :key="col.id" :class="'header-cell-' + col.id" :style="{
                        background: block.headerBg ?? '#f5f5f5', color: block.headerColor ?? '#333', fontWeight: block.headerFontWeight ?? 'bold',
                        fontFamily: block.headerFontFamily ?? 'inherit',
                        padding: cellPaddingStyle ?? '6px 8px', textAlign: block.headerHAlign ?? align(col), verticalAlign: block.headerVAlign ?? 'middle',
                        border: cellBorder(), fontSize: `${block.headerFontSize ?? block.bodyFontSize ?? 12}px`, width: col.width ? `${col.width}%` : undefined, whiteSpace: 'nowrap'
                    }" @contextmenu="onColumnHeaderContextMenu(col, $event)" @dblclick="editingHeaderColId = col.id">
                        <input v-if="editingHeaderColId === col.id" :value="col.label" class="inline-cell-input header-edit-input" :style="{ color: block.headerColor ?? '#333', background: 'white', fontWeight: block.headerFontWeight ?? 'bold' }" @input="updateColumnProp(col.id, 'label', $event.target.value)" @blur="editingHeaderColId = null; commitHistory()" @keydown.enter="editingHeaderColId = null; commitHistory()" @keydown.esc="editingHeaderColId = null" />
                        <span v-else>{{ col.label }}</span>
                        <div class="col-resizer" @mousedown.stop="onColResizeStart(col.id, $event)"></div>
                        
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in allRows" :key="row.index">
                    <template v-for="col in visibleColumns" :key="col.id">
                        <td v-if="shouldRenderCell(row.index, col.id)" :rowspan="getCellSpan(row.index, col.id).rowspan" :colspan="getCellSpan(row.index, col.id).colspan" :class="`cell-${row.index}-${col.id}`" :style="{
                            padding: cellPaddingStyle ?? (row.isDataRow ? (col.id === 'no' || col.id === 'total' ? '5px 8px' : '2px 4px') : '5px 8px'), ...getCellBorderStyles(row.index, col.id, row.isDataRow),
                            textAlign: getCellAlign(row.index, col), verticalAlign: getCellVAlign(row.index, col), color: getCellCustomStyles(row.index, col).color,
                            backgroundColor: isCellSelected(row.index, col.id) ? 'rgba(0, 180, 216, 0.15)' : getCellCustomStyles(row.index, col).backgroundColor,
                            fontWeight: getCellCustomStyles(row.index, col).fontWeight, fontStyle: getCellCustomStyles(row.index, col).fontStyle, height: getCellCustomStyles(row.index, col).height,
                            outline: isCellSelected(row.index, col.id) ? '2px solid #00b4d8' : undefined, outlineOffset: isCellSelected(row.index, col.id) ? '-2px' : undefined, cursor: fillMode ? 'default' : 'pointer',
                            ...(getCellCustomStyles(row.index, col).borderBottom ? { borderBottom: getCellCustomStyles(row.index, col).borderBottom } : {})
                        }" @mousedown="onCellMouseDown(row.index, col.id, $event)" @mouseenter="onCellMouseEnter(row.index, col.id)" @contextmenu="onCellContextMenu(row.index, col.id, $event)">
                            <template v-if="row.isDataRow">
                                <template v-if="col.id === 'no'">
                                    <div class="serial-cell" @contextmenu="onRowNumberContextMenu(row.index, $event)">
                                        <input v-if="fillMode && editingCell?.r === row.index && editingCell?.colId === col.id" :value="row.item[col.id]" class="inline-cell-input" @input="updateItemValue(row.localIndex, col.id, $event.target.value)" @blur="editingCell = null; commitHistory()" @keydown="handleKeyDown" />
                                        <span v-else class="serial-num">{{ row.item[col.id] }}</span>
                                        <button v-if="fillMode" class="inline-delete-row-btn" @click="deleteRowAction(row.localIndex)">&times;</button>
                                    </div>
                                </template>
                                <template v-else>
                                    <input v-if="fillMode && editingCell?.r === row.index && editingCell?.colId === col.id" :value="row.item[col.id]" class="inline-cell-input" @input="updateItemValue(row.localIndex, col.id, $event.target.value)" @blur="editingCell = null; commitHistory()" @keydown="handleKeyDown" />
                                    <span v-else>{{ formatVal(col, row.item) }}</span>
                                </template>
                            </template>
                            <template v-else>
                                &nbsp;
                            </template>
                        <div class="row-resizer" @mousedown.stop="onRowResizeStart(row.index, $event)"></div></td>
                    </template>
                </tr>
                <template v-for="sRow in (block.specialRows || [])" :key="sRow.id">
                    <tr v-if="sRow.type === 'summary'" :class="'special-row-' + sRow.id" @click="editingSpecialRowId = sRow.id; canvasStore.editingBlockId = props.block.id">
                        <td :colspan="visibleColumns.length" :style="{ padding: cellPaddingStyle ?? '6px 8px', border: cellBorder(), background: sRow.bgColor || block.summaryBg || '#f5f5f5', color: sRow.textColor || block.summaryColor || '#333333', fontWeight: sRow.fontWeight || (block.summaryBold !== false ? 'bold' : 'normal'), textAlign: sRow.hAlign || 'left', verticalAlign: sRow.vAlign || 'middle' }">
                            <input v-if="fillMode && editingSpecialRowId === sRow.id" :value="sRow.text" class="inline-cell-input" @input="updateSpecialRowProp(sRow.id, 'text', $event.target.value)" @blur="editingSpecialRowId = null; commitHistory()" @keydown.enter="editingSpecialRowId = null; commitHistory()" @keydown.esc="editingSpecialRowId = null" /><span v-else style="white-space: pre-wrap;">{{ sRow.text || 'Click to edit summary' }}</span>
                        </td>
                    </tr>
                    <tr v-else-if="sRow.type === 'section_header'" :class="'special-row-' + sRow.id" @click="editingSpecialRowId = sRow.id; canvasStore.editingBlockId = props.block.id">
                        <td :colspan="visibleColumns.length" :style="{ padding: cellPaddingStyle ?? '6px 8px', border: cellBorder(), background: sRow.bgColor || '#f5f5f5', color: sRow.textColor || '#333333', fontWeight: 'bold', textAlign: sRow.hAlign || sRow.alignment || 'left', verticalAlign: sRow.vAlign || 'middle' }">
                            <input v-if="fillMode && editingSpecialRowId === sRow.id" :value="sRow.text" class="inline-cell-input" @input="updateSpecialRowProp(sRow.id, 'text', $event.target.value)" @blur="editingSpecialRowId = null; commitHistory()" @keydown.enter="editingSpecialRowId = null; commitHistory()" @keydown.esc="editingSpecialRowId = null" /><span v-else style="white-space: pre-wrap;">{{ sRow.text || 'Click to edit section header' }}</span>
                        </td>
                    </tr>
                    <tr v-else-if="sRow.type === 'split'" :class="'special-row-' + sRow.id" @click="editingSpecialRowId = sRow.id; canvasStore.editingBlockId = props.block.id">
                        <td :colspan="getSplitRowColspans(sRow.leftWidth).leftColspan" :style="{ padding: cellPaddingStyle ?? '8px', border: cellBorder(), width: (sRow.leftWidth ?? 60) + '%', textAlign: sRow.leftHAlign || 'left', verticalAlign: sRow.leftVAlign || 'top' }">
                            <textarea v-if="fillMode && editingSpecialRowId === sRow.id" :value="sRow.leftText" class="inline-cell-input" @input="updateSpecialRowProp(sRow.id, 'leftText', $event.target.value)" @blur="editingSpecialRowId = null; commitHistory()" /><span v-else :style="{ whiteSpace: 'pre-wrap', display: 'block', textAlign: sRow.leftHAlign || 'left' }">{{ sRow.leftText || 'Click to edit left section' }}</span>
                        </td>
                        <td :colspan="getSplitRowColspans(sRow.leftWidth).rightColspan" :style="{ padding: cellPaddingStyle ?? '8px', border: cellBorder(), textAlign: sRow.rightHAlign || 'right', verticalAlign: sRow.rightVAlign || 'top' }">
                            <textarea v-if="fillMode && editingSpecialRowId === sRow.id" :value="sRow.rightText" class="inline-cell-input" @input="updateSpecialRowProp(sRow.id, 'rightText', $event.target.value)" @blur="editingSpecialRowId = null; commitHistory()" /><span v-else :style="{ whiteSpace: 'pre-wrap', display: 'block', textAlign: sRow.rightHAlign || 'right' }">{{ sRow.rightText || 'Click to edit right section' }}</span>
                        </td>
                    </tr>
                    <tr v-else-if="sRow.type === 'divider'"><td :colspan="visibleColumns.length" :style="{ padding: '4px 0', borderLeft: showBorders ? cellBorder() : 'none', borderRight: showBorders ? cellBorder() : 'none', borderTop: 'none', borderBottom: 'none' }"><div :style="{ borderTop: `${sRow.thickness ?? 1}px solid ${sRow.color ?? '#e0e0e0'}`, width: '100%' }" /></td></tr>
                </template>
                
            </tbody>
        </table>
    </div>
    <Teleport to="body">
        <div v-if="contextMenu.visible" class="table-context-menu" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" @click.stop>
            <template v-if="contextMenu.type === 'cell'">
                <div v-if="contextMenu.colId !== 'no' && contextMenu.colId !== 'total'" class="menu-item" @click="startEditingCellAction(contextMenu.r, contextMenu.colId)">Edit Cell</div>
                <div v-if="contextMenu.colId !== 'no' && contextMenu.colId !== 'total'" class="menu-divider"></div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Row Actions</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="insertRowAction(contextMenu.r, false)">Insert Row Above</div>
                        <div class="menu-item" @click="insertRowAction(contextMenu.r, true)">Insert Row Below</div>
                        <div class="menu-item dest" @click="deleteRowAction(contextMenu.r)">Delete Row</div>
                        <div v-if="(props.block.selectedCells ?? []).length > 0" class="menu-item dest" @click="deleteSelectedRowsAction">Delete Selected Rows</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Column Actions</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="insertColAction(contextMenu.colId, false)">Insert Column Left</div>
                        <div class="menu-item" @click="insertColAction(contextMenu.colId, true)">Insert Column Right</div>
                        <div class="menu-item dest" @click="deleteColAction(contextMenu.colId)">Delete Column</div>
                        <div v-if="(props.block.selectedCells ?? []).length > 0" class="menu-item dest" @click="deleteSelectedColsAction">Delete Selected Columns</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Merge / Clear</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="mergeSelectedCells">Merge Selected Cells</div>
                        <div class="menu-item" @click="unmergeSelectedCells">Unmerge Selected Cells</div>
                        <div class="menu-divider"></div>
                        <div class="menu-item dest" @click="clearSelectedCellsAction">Clear Selected Cells</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Alignment</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="updateSelectedCellsAlign('left'); closeContextMenu()">Align Left</div>
                        <div class="menu-item" @click="updateSelectedCellsAlign('center'); closeContextMenu()">Align Center</div>
                        <div class="menu-item" @click="updateSelectedCellsAlign('right'); closeContextMenu()">Align Right</div>
                        <div class="menu-divider"></div>
                        <div class="menu-item" @click="updateSelectedCellsAlign('top', true); closeContextMenu()">Align Top</div>
                        <div class="menu-item" @click="updateSelectedCellsAlign('middle', true); closeContextMenu()">Align Middle</div>
                        <div class="menu-item" @click="updateSelectedCellsAlign('bottom', true); closeContextMenu()">Align Bottom</div>
                    </div>
                </div>
            </template>
            <template v-if="contextMenu.type === 'row_number'">
                <div class="menu-submenu-parent">
                    <div class="menu-item">Row Layout</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="insertRowAction(contextMenu.r, false)">Insert Row Above</div>
                        <div class="menu-item" @click="insertRowAction(contextMenu.r, true)">Insert Row Below</div>
                        <div class="menu-item dest" @click="deleteRowAction(contextMenu.r)">Delete Row</div>
                        <div v-if="(props.block.selectedCells ?? []).length > 0" class="menu-item dest" @click="deleteSelectedRowsAction">Delete Selected Rows</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Row Properties</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'isHeader', !block.rowStyles?.[contextMenu.r]?.isHeader)">Toggle Header Style</div>
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'isSummary', !block.rowStyles?.[contextMenu.r]?.isSummary)">Toggle Summary Style</div>
                        <div class="menu-item" @click="setRowHeightPrompt(contextMenu.r)">Row Height...</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Row Styles</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'bold', !block.rowStyles?.[contextMenu.r]?.bold); closeContextMenu()">Toggle Bold</div>
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'textColor', '#ff0000'); closeContextMenu()">Red Text</div>
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'textColor', '#000000'); closeContextMenu()">Black Text</div>
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'bgColor', '#f0f9ff'); closeContextMenu()">Light Blue Bg</div>
                        <div class="menu-item" @click="updateRowStyleAction(contextMenu.r, 'bgColor', 'transparent'); closeContextMenu()">Clear Bg</div>
                    </div>
                </div>
            </template>
            <template v-if="contextMenu.type === 'column_header'">
                <div class="menu-item" @click="startHeaderColRename(contextMenu.colId)">Rename Column</div>
                <div class="menu-item" @click="setColumnWidth(contextMenu.colId)">Column Width %</div>
                <div class="menu-divider"></div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Column Layout</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="insertColAction(contextMenu.colId, false)">Insert Column Left</div>
                        <div class="menu-item" @click="insertColAction(contextMenu.colId, true)">Insert Column Right</div>
                        <div class="menu-item dest" @click="deleteColAction(contextMenu.colId)">Delete Column</div>
                        <div v-if="(props.block.selectedCells ?? []).length > 0" class="menu-item dest" @click="deleteSelectedColsAction">Delete Selected Columns</div>
                    </div>
                </div>
                <div class="menu-submenu-parent">
                    <div class="menu-item">Alignment</div>
                    <div class="menu-submenu">
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'hAlign', 'left'); closeContextMenu()">Align Left</div>
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'hAlign', 'center'); closeContextMenu()">Align Center</div>
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'hAlign', 'right'); closeContextMenu()">Align Right</div>
                        <div class="menu-divider"></div>
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'vAlign', 'top'); closeContextMenu()">Align Top</div>
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'vAlign', 'middle'); closeContextMenu()">Align Middle</div>
                        <div class="menu-item" @click="updateColumnAlignmentAction(contextMenu.colId, 'vAlign', 'bottom'); closeContextMenu()">Align Bottom</div>
                    </div>
                </div>
            </template>
        </div>
    </Teleport>
</template>

<style scoped>
/* Add this at the bottom of your style block */
th, td {
  background-clip: padding-box; 
}

.row-resizer {
  bottom: 1px !important;
}
/* Column Resizer Handle */
.col-resizer {
  position: absolute;
  right: -2px; /* Centers it on the border */
  top: 0;
  height: 100%;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
}
/* Make the drag area slightly visible on hover to help users */
.col-resizer:hover {
  background: rgba(0, 180, 216, 0.3);
}

/* Row Resizer Handle */
.row-resizer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 5px;
  cursor: row-resize;
  z-index: 10;
  background: transparent;
}
.row-resizer:hover {
  background: rgba(0, 180, 216, 0.3);
}
th, td {
  position: relative; /* Add this to your existing th/td styles */
}
.inline-cell-input { width: 100%; border: 1px solid transparent; background: transparent; padding: 2px 4px; font-size: inherit; font-family: inherit; color: inherit; text-align: inherit; border-radius: 3px; box-sizing: border-box; }
.inline-cell-input:hover { border-color: rgba(0, 180, 216, 0.3); background: rgba(0, 180, 216, 0.05); }
.inline-cell-input:focus { outline: none; border-color: #00b4d8; background: white; box-shadow: 0 0 3px rgba(0, 180, 216, 0.2); }
.serial-cell { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.inline-delete-row-btn { display: none; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #ef4444; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 11px; cursor: pointer; }
.serial-cell:hover .inline-delete-row-btn { display: block; }
.inline-add-row-btn { background: transparent; border: 1px dashed rgba(0, 180, 216, 0.4); color: #00b4d8; font-size: 11px; padding: 3px 10px; border-radius: 4px; cursor: pointer; }
.table-context-menu { position: fixed; z-index: 99999; background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 6px 0; min-width: 170px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); font-size: 13px; color: #e0e0e0; animation: fadeIn 0.15s; }
.menu-item { padding: 8px 16px; cursor: pointer; display: flex; justify-content: space-between; }
.menu-item:hover { background: rgba(0, 180, 216, 0.85); color: #fff; }
.menu-item.dest:hover { background: #ef4444; }
.menu-divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 0; }
.menu-submenu-parent { position: relative; }
.menu-submenu-parent::after { content: "▶"; font-size: 8px; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); opacity: 0.7; }
.menu-submenu { display: none; position: absolute; left: 100%; top: 0; background: rgba(30, 30, 30, 0.98); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 6px 0; min-width: 140px; }
.menu-submenu-parent:hover .menu-submenu { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@media print {
  /* 1. Force the printer to perfectly copy the screen's background colors and borders */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* 2. Retain the standard collapse model used by most frameworks for complex layouts */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
  }

  /* 3. Keep cell padding intact so content doesn't mash against the lines */
  th, td {
    background-clip: padding-box !important;
  }
  
  /* 4. Prevent the rows from awkwardly snapping in half across pages */
  tr {
    display: table-row !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
</style>
