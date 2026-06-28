import { getNestedValue, SAMPLE_DATA } from "./variableResolver.js";

/**
 * Calculates page layout pagination for multi-page document templates.
 *
 * @param {Array}  blocks         - Original template blocks
 * @param {Object} posData        - Real live transaction data
 * @param {Object} format         - Selected format details (height, width, isThermal)
 * @param {Object} settingsStore  - Settings store instance for sampleData access
 * @returns {Array} List of pages, where each page contains its format dimensions and array of adjusted blocks.
 */
export function paginateTemplate(blocks, posData, format, settingsStore) {
  const pageH = format?.height ?? 1123;
  const isThermal = format?.isThermal === true;

  // 1. Find the item table block
  const table = blocks.find(b => b.type === "item_table");

  // If no table block exists, it's a static single page
  if (!table) {
    return [{
      blocks: JSON.parse(JSON.stringify(blocks)),
      height: pageH
    }];
  }

  // 2. Resolve the items data list
  const bindingField = table.dataBinding?.field || "items";
  let sourceData = posData || settingsStore?.sampleData;
  if (!sourceData || Object.keys(sourceData).length === 0) {
    sourceData = SAMPLE_DATA;
  }
  const allItems = getNestedValue(sourceData, bindingField) || table.items || [];
  const items = Array.isArray(allItems) ? allItems : [];

  // 3. Compute row heights
  const headerFontSize = table.headerFontSize ?? table.bodyFontSize ?? 12;
  const bodyFontSize = table.bodyFontSize ?? 12;
  const hTop = table.headerPaddingTop ?? table.cellPaddingTop ?? table.cellPadding ?? 6;
  const hBottom = table.headerPaddingBottom ?? table.cellPaddingBottom ?? table.cellPadding ?? 6;
  const headerHeight = table.showHeader !== false ? (headerFontSize + hTop + hBottom + 10) : 0;

  const pTop = table.cellPaddingTop ?? table.cellPadding ?? 5;
  const pBottom = table.cellPaddingBottom ?? table.cellPadding ?? 5;
  const rowMinHeight = bodyFontSize + pTop + pBottom + 8;
  const defaultRowHeight = table.defaultRowHeight ?? 30;

  const getEstimatedLines = (col) => {
    if (Array.isArray(col.subFields) && col.subFields.length > 0) {
      let lines = 1;
      col.subFields.forEach(sub => {
        if (sub.display !== 'inline') {
          lines++;
        }
      });
      return lines;
    }
    return 1;
  };

  const getRowHeight = (item, idx) => {
    const custom = table.rowStyles?.[idx]?.height;
    if (custom !== undefined && custom !== null) return Math.max(custom, rowMinHeight);

    let maxLines = 1;
    const cols = table.columns || [];
    cols.forEach(col => {
      if (col.visible !== false) {
        const lines = getEstimatedLines(col);
        if (lines > maxLines) {
          maxLines = lines;
        }
      }
    });

    const lineHeight = bodyFontSize * 1.35;
    const contentHeight = maxLines * lineHeight;
    return Math.max(defaultRowHeight, contentHeight + pTop + pBottom + 8);
  };

  const tableY = parseFloat(table.y) || 0;
  const tableHeight = parseFloat(table.height) || 200;

  // Build the list of rows with their index and type ('data' | 'empty' | 'special')
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    rows.push({ type: "data", index: i, item: items[i], height: getRowHeight(items[i], i) });
  }

  // Calculate how many empty rows are needed to fill the designed table height (tableHeight)
  const minRowsHeight = tableHeight - headerHeight - 10;
  let emptyCount = Math.max(0, (table.emptyRows ?? 0) - items.length);
  const singleEmptyRowH = Math.max(defaultRowHeight, rowMinHeight);
  
  const currentTotalRowsHeight = rows.reduce((sum, r) => sum + r.height, 0) + (emptyCount * singleEmptyRowH);
  if (currentTotalRowsHeight < minRowsHeight) {
    const extraEmptyNeeded = Math.floor((minRowsHeight - currentTotalRowsHeight) / singleEmptyRowH);
    if (extraEmptyNeeded > 0) {
      emptyCount += extraEmptyNeeded;
    }
  }

  for (let i = 0; i < emptyCount; i++) {
    rows.push({ type: "empty", index: items.length + i, height: singleEmptyRowH });
  }

  // Add special rows if any
  if (Array.isArray(table.specialRows)) {
    table.specialRows.forEach((sr, idx) => {
      const srH = sr.type === "divider"
        ? (sr.thickness ?? 1) + 8
        : Math.max(defaultRowHeight, rowMinHeight);
      rows.push({ type: "special", specialRow: sr, index: idx, height: srH });
    });
  }

  // Identify Header vs Footer blocks
  const headerBlocks = blocks.filter(b => b.id !== table.id && parseFloat(b.y) < tableY);
  const footerBlocks = blocks.filter(b => b.id !== table.id && parseFloat(b.y) >= tableY + tableHeight);

  // Compute footer elements bounding box height
  let footerHeight = 0;
  if (footerBlocks.length > 0) {
    const footerMaxY = Math.max(...footerBlocks.map(b => (parseFloat(b.y) || 0) + (parseFloat(b.height) || 0)));
    footerHeight = footerMaxY - (tableY + tableHeight);
  }

  // --- Case A: Thermal Print / Roll Print (Continuous infinite scroll) ---
  if (isThermal) {
    const totalTableHeight = headerHeight + rows.reduce((sum, r) => sum + r.height, 0) + 10;
    const deltaHeight = totalTableHeight - tableHeight;
    const finalPageHeight = Math.max(pageH, pageH + deltaHeight);

    // Adjust positions
    const adjustedBlocks = blocks.map(b => {
      const copy = JSON.parse(JSON.stringify(b));
      if (copy.id === table.id) {
        copy.height = Math.max(tableHeight, totalTableHeight);
      } else if (parseFloat(copy.y) >= tableY + tableHeight) {
        copy.y = (parseFloat(copy.y) || 0) + Math.max(0, deltaHeight);
      }
      return copy;
    });

    return [{
      blocks: adjustedBlocks,
      height: finalPageHeight
    }];
  }

  // --- Case B: Fixed Page Breaks (A4 / A5) ---
  const pages = [];
  let rowCursor = 0;

  const firstPageMaxSpace = pageH - tableY - headerHeight - 40; // 40px safe margin
  const middlePageMaxSpace = pageH - 40 - headerHeight - 40; // Starts at y = 40px
  const lastPageMaxSpace = pageH - 40 - headerHeight - footerHeight - 40;

  // Let's pre-calculate total height of remaining rows to see if everything fits
  const getRemainingRowsHeight = (startIdx) => {
    let sum = 0;
    for (let i = startIdx; i < rows.length; i++) {
      sum += rows[i].height;
    }
    return sum;
  };

  // 1. First Page
  const firstPageBlocks = JSON.parse(JSON.stringify(headerBlocks));
  const firstPageTable = JSON.parse(JSON.stringify(table));
  const firstPageRows = [];
  let currentSpace = firstPageMaxSpace;

  // Check if all rows + footer fits on page 1
  const allFitOnPage1 = (headerHeight + getRemainingRowsHeight(0) + footerHeight + 10) <= firstPageMaxSpace;

  if (allFitOnPage1) {
    // Everything fits on one page!
    const pageRowsHeight = getRemainingRowsHeight(0);
    const totalTableHeight = headerHeight + pageRowsHeight + 10;
    const delta = Math.max(0, totalTableHeight - tableHeight);

    firstPageTable.height = Math.max(tableHeight, totalTableHeight);
    firstPageTable.itemsData = items; // Inject full items
    firstPageTable.renderRows = rows; // Inject all rows
    firstPageBlocks.push(firstPageTable);

    // Add footer blocks shifted down
    footerBlocks.forEach(fb => {
      const copy = JSON.parse(JSON.stringify(fb));
      copy.y = (parseFloat(copy.y) || 0) + delta;
      firstPageBlocks.push(copy);
    });

    pages.push({
      blocks: firstPageBlocks,
      height: pageH
    });
    return pages;
  }

  // If it doesn't all fit on Page 1, fill Page 1 with rows
  while (rowCursor < rows.length) {
    const nextH = rows[rowCursor].height;
    if (nextH <= currentSpace) {
      firstPageRows.push(rows[rowCursor]);
      currentSpace -= nextH;
      rowCursor++;
    } else {
      break;
    }
  }

  // Adjust Page 1 table height to fit its rows
  const page1TableHeight = headerHeight + firstPageRows.reduce((sum, r) => sum + r.height, 0) + 10;
  firstPageTable.height = Math.max(tableHeight, page1TableHeight);
  firstPageTable.renderRows = firstPageRows;
  firstPageBlocks.push(firstPageTable);
  pages.push({
    blocks: firstPageBlocks,
    height: pageH
  });

  // 2. Middle & Last Pages
  while (rowCursor < rows.length) {
    // Check if remaining rows + footer fit on this page (making it the last page)
    const fitOnThisPage = (headerHeight + getRemainingRowsHeight(rowCursor) + footerHeight + 10) <= middlePageMaxSpace;

    if (fitOnThisPage) {
      // Last page with table rows and footer
      const lastPageBlocks = [];
      const lastPageTable = JSON.parse(JSON.stringify(table));
      const lastPageRows = rows.slice(rowCursor);

      const tableRowsHeight = lastPageRows.reduce((sum, r) => sum + r.height, 0);
      const totalTableHeight = headerHeight + tableRowsHeight + 10;

      // Table starts at top margin (40px)
      lastPageTable.y = 40;
      lastPageTable.height = Math.max(tableHeight, totalTableHeight);
      lastPageTable.renderRows = lastPageRows;
      lastPageBlocks.push(lastPageTable);

      const designFooterStart = tableY + tableHeight;
      const actualFooterStart = 40 + totalTableHeight;
      const shift = Math.max(0, actualFooterStart - designFooterStart);

      footerBlocks.forEach(fb => {
        const copy = JSON.parse(JSON.stringify(fb));
        copy.y = (parseFloat(copy.y) || 0) + shift;
        lastPageBlocks.push(copy);
      });

      pages.push({
        blocks: lastPageBlocks,
        height: pageH
      });
      rowCursor = rows.length; // Complete
      break;
    } else {
      // Another middle page
      const midPageBlocks = [];
      const midPageTable = JSON.parse(JSON.stringify(table));
      const midPageRows = [];
      let spaceLeft = middlePageMaxSpace;

      while (rowCursor < rows.length) {
        const nextH = rows[rowCursor].height;
        if (nextH <= spaceLeft) {
          midPageRows.push(rows[rowCursor]);
          spaceLeft -= nextH;
          rowCursor++;
        } else {
          break;
        }
      }

      // If no items fit (e.g. single row height > spaceLeft), force push at least one item
      if (midPageRows.length === 0 && rowCursor < rows.length) {
        midPageRows.push(rows[rowCursor]);
        rowCursor++;
      }

      const tableRowsHeight = midPageRows.reduce((sum, r) => sum + r.height, 0);
      const totalTableHeight = headerHeight + tableRowsHeight + 10;

      midPageTable.y = 40;
      midPageTable.height = Math.max(tableHeight, totalTableHeight);
      midPageTable.renderRows = midPageRows;
      midPageBlocks.push(midPageTable);

      pages.push({
        blocks: midPageBlocks,
        height: pageH
      });
    }
  }

  // 3. Final page with ONLY footer if table rows ended but footer couldn't fit on the last page
  if (rowCursor >= rows.length && pages.length > 0 && !pages[pages.length - 1].blocks.some(b => footerBlocks.some(fb => fb.id === b.id))) {
    const finalPageBlocks = [];
    const actualFooterStart = 40; // Starts at top
    const designFooterStart = tableY + tableHeight;
    const shift = actualFooterStart - designFooterStart;

    footerBlocks.forEach(fb => {
      const copy = JSON.parse(JSON.stringify(fb));
      copy.y = (parseFloat(copy.y) || 0) + shift;
      finalPageBlocks.push(copy);
    });

    pages.push({
      blocks: finalPageBlocks,
      height: pageH
    });
  }

  return pages;
}
