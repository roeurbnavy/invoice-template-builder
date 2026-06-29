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
  const table = blocks.find((b) => b.type === "item_table");

  // If no table block exists, it's a static single page
  if (!table) {
    return [
      {
        blocks: JSON.parse(JSON.stringify(blocks)),
        height: pageH,
      },
    ];
  }

  // 2. Resolve the items data list
  const bindingField = table.dataBinding?.field || "items";
  let sourceData = posData || settingsStore?.sampleData;
  if (!sourceData || Object.keys(sourceData).length === 0) {
    sourceData = SAMPLE_DATA;
  }
  const allItems =
    getNestedValue(sourceData, bindingField) || table.items || [];
  const items = Array.isArray(allItems) ? allItems : [];

  // 3. Compute row heights
  const headerFontSize = table.headerFontSize ?? table.bodyFontSize ?? 12;
  const bodyFontSize = table.bodyFontSize ?? 12;
  const hTop =
    table.headerPaddingTop ?? table.cellPaddingTop ?? table.cellPadding ?? 6;
  const hBottom =
    table.headerPaddingBottom ??
    table.cellPaddingBottom ??
    table.cellPadding ??
    6;

  const hasHeaderGroups = (table.columns || []).some(
    (col) => col.visible !== false && col.group && col.group.trim() !== "",
  );
  const headerRowCount = hasHeaderGroups ? 2 : 1;

  const headerHeight =
    table.showHeader !== false
      ? (headerFontSize + hTop + hBottom + 10) * headerRowCount
      : 0;

  const pTop = table.cellPaddingTop ?? table.cellPadding ?? 5;
  const pBottom = table.cellPaddingBottom ?? table.cellPadding ?? 5;
  const rowMinHeight = bodyFontSize + pTop + pBottom + 8;
  const defaultRowHeight = table.defaultRowHeight ?? 30;

  const getEstimatedLines = (col, item) => {
    let lines = 1;

    // Estimate lines from text content wrapping
    if (item && col.id) {
      const textVal = String(item[col.id] || "");
      if (textVal) {
        const tableWidth = parseFloat(table.width) || 600;
        const colPercent = parseFloat(col.width) || 15;
        // Subtract cell horizontal padding
        const colWidthPx = tableWidth * (colPercent / 100) - 16;
        const avgCharWidth = bodyFontSize * 0.52;
        const charsPerLine = Math.max(
          10,
          Math.floor(colWidthPx / avgCharWidth),
        );
        lines = Math.max(1, Math.ceil(textVal.length / charsPerLine));
      }
    }

    if (Array.isArray(col.subFields) && col.subFields.length > 0) {
      col.subFields.forEach((sub) => {
        if (sub.display !== "inline") {
          lines++;
        }
      });
    }
    return lines;
  };

  const getRowHeight = (item, idx) => {
    const custom = table.rowStyles?.[idx]?.height;
    if (custom !== undefined && custom !== null)
      return Math.max(custom, rowMinHeight);

    let maxLines = 1;
    const cols = table.columns || [];
    cols.forEach((col) => {
      if (col.visible !== false) {
        const lines = getEstimatedLines(col, item);
        if (lines > maxLines) {
          maxLines = lines;
        }
      }
    });

    const lineHeight = bodyFontSize * 1.35;
    const contentHeight = maxLines * lineHeight;

    return Math.max(defaultRowHeight, contentHeight + pTop + pBottom);
  };

  const tableY = parseFloat(table.y) || 0;
  const tableHeight = parseFloat(table.height) || 200;
  // Build the list of rows with their index and type ('data' | 'empty')
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    rows.push({
      type: "data",
      index: i,
      item: items[i],
      height: getRowHeight(items[i], i),
    });
  }

  const maxRowsPerPage = parseInt(table.maxRowsPerPage, 10);
  const hasMaxRows = !isNaN(maxRowsPerPage) && maxRowsPerPage > 0;
  const singleEmptyRowH = Math.max(defaultRowHeight, rowMinHeight);

  if (!hasMaxRows) {
    // Calculate how many empty rows are needed to fill the designed table height (tableHeight)
    const minRowsHeight = tableHeight - headerHeight - 10;
    let emptyCount = Math.max(0, (table.emptyRows ?? 0) - items.length);
    const currentTotalRowsHeight =
      rows.reduce((sum, r) => sum + r.height, 0) + emptyCount * singleEmptyRowH;
    if (currentTotalRowsHeight < minRowsHeight) {
      const extraEmptyNeeded = Math.floor(
        (minRowsHeight - currentTotalRowsHeight) / singleEmptyRowH,
      );
      if (extraEmptyNeeded > 0) {
        emptyCount += extraEmptyNeeded;
      }
    }

    for (let i = 0; i < emptyCount; i++) {
      rows.push({
        type: "empty",
        index: items.length + i,
        height: singleEmptyRowH,
      });
    }
  }

  const getParentContainer = (blockId) => {
    return blocks.find(
      (b) => b.type === "container" && (b.childIds ?? []).includes(blockId),
    );
  };

  // Identify Header vs Footer blocks
  const headerBlocks = blocks.filter((b) => {
    if (b.id === table.id) return false;
    const parent = getParentContainer(b.id);
    const referenceY = parent ? parseFloat(parent.y) : parseFloat(b.y);
    return referenceY < tableY;
  });
  const footerBlocks = blocks.filter((b) => {
    if (b.id === table.id) return false;
    const parent = getParentContainer(b.id);
    const referenceY = parent ? parseFloat(parent.y) : parseFloat(b.y);
    return referenceY >= tableY;
  });

  // Compute footer elements bounding box height
  let footerHeight = 0;
  if (footerBlocks.length > 0) {
    const footerMaxY = Math.max(
      ...footerBlocks.map(
        (b) => (parseFloat(b.y) || 0) + (parseFloat(b.height) || 0),
      ),
    );

    footerHeight = Math.max(0, footerMaxY - (tableY + tableHeight));
  }

  // --- Case A: Thermal Print / Roll Print (Continuous infinite scroll) ---
  if (isThermal) {
    const totalTableHeight =
      headerHeight + rows.reduce((sum, r) => sum + r.height, 0) + 10;
    const deltaHeight = totalTableHeight - tableHeight;
    const finalPageHeight = Math.max(pageH, pageH + deltaHeight);

    // Adjust positions
    const adjustedBlocks = blocks.map((b) => {
      const copy = JSON.parse(JSON.stringify(b));
      if (copy.id === table.id) {
        copy.height = totalTableHeight;
      } else {
        const parent = getParentContainer(copy.id);
        const referenceY = parent ? parseFloat(parent.y) : parseFloat(copy.y);
        if (referenceY >= tableY) {
          copy.y = (parseFloat(copy.y) || 0) + deltaHeight;
        }
      }
      return copy;
    });

    return [
      {
        blocks: adjustedBlocks,
        height: finalPageHeight,
      },
    ];
  }

  // --- Case B: Fixed Page Breaks (A4 / A5) ---
  const pages = [];
  let rowCursor = 0;

  const firstPageMaxSpace = pageH - tableY - headerHeight - 20; // 20px safe margin
  const middlePageMaxSpace = pageH - 20 - headerHeight - 20; // Starts at y = 20px

  if (hasMaxRows) {
    let pageIdx = 0;
    while (rowCursor < rows.length || (rowCursor === 0 && rows.length === 0)) {
      const isFirstPage = pageIdx === 0;
      const maxSpace = isFirstPage ? firstPageMaxSpace : middlePageMaxSpace;
      const pageBlocks = isFirstPage
        ? JSON.parse(JSON.stringify(headerBlocks))
        : [];
      const pageTable = JSON.parse(JSON.stringify(table));
      const pageRows = [];
      let currentSpace = maxSpace;

      // 1. Push data rows that fit in height AND don't exceed maxRowsPerPage
      while (rowCursor < rows.length && pageRows.length < maxRowsPerPage) {
        const nextH = rows[rowCursor].height;
        if (nextH <= currentSpace) {
          pageRows.push(rows[rowCursor]);
          currentSpace -= nextH;
          rowCursor++;
        } else {
          if (pageRows.length === 0) {
            pageRows.push(rows[rowCursor]);
            rowCursor++;
          }
          break;
        }
      }

      // 2. Pad with empty rows to reach exactly maxRowsPerPage
      const emptyNeeded = maxRowsPerPage - pageRows.length;
      for (let i = 0; i < emptyNeeded; i++) {
        pageRows.push({
          type: "empty",
          index: items.length + pageRows.length,
          height: singleEmptyRowH,
        });
      }

      // 3. Determine height & whether footer fits on this page
      const tableRowsHeight = pageRows.reduce((sum, r) => sum + r.height, 0);

      const totalTableHeight = headerHeight + tableRowsHeight + 10;

      const pageTableY = isFirstPage ? tableY : 20;

      const footerFits =
        rowCursor >= rows.length && currentSpace >= footerHeight + 10;

      if (rowCursor >= rows.length && footerFits) {
        // Last page with table rows and footer
        pageTable.y = pageTableY;
        pageTable.height = totalTableHeight;
        pageTable.renderRows = pageRows;
        pageBlocks.push(pageTable);

        const shift = pageTableY - tableY + (totalTableHeight - tableHeight);
        footerBlocks.forEach((fb) => {
          const copy = JSON.parse(JSON.stringify(fb));
          copy.y = (parseFloat(copy.y) || 0) + shift;
          pageBlocks.push(copy);
        });

        pages.push({
          blocks: pageBlocks,
          height: pageH,
        });
        break;
      } else {
        // Middle page or last page where footer does not fit
        pageTable.y = pageTableY;
        pageTable.height = totalTableHeight;
        pageTable.renderRows = pageRows;
        pageBlocks.push(pageTable);

        pages.push({
          blocks: pageBlocks,
          height: pageH,
        });

        if (rowCursor >= rows.length) {
          // Footer didn't fit, place on a new final page
          const finalPageBlocks = [];
          const actualFooterStart = 20;
          const designFooterStart = tableY + tableHeight;
          const shift = actualFooterStart - designFooterStart;
          footerBlocks.forEach((fb) => {
            const copy = JSON.parse(JSON.stringify(fb));
            copy.y = (parseFloat(copy.y) || 0) + shift;
            finalPageBlocks.push(copy);
          });

          pages.push({
            blocks: finalPageBlocks,
            height: pageH,
          });
          break;
        }
      }

      pageIdx++;
    }
  } else {
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
    const allFitOnPage1 =
      getRemainingRowsHeight(0) + footerHeight + 10 <= firstPageMaxSpace;

    if (allFitOnPage1) {
      // Everything fits on one page!
      const pageRowsHeight = getRemainingRowsHeight(0);
      const totalTableHeight = headerHeight + pageRowsHeight + 10;

      const delta = totalTableHeight - tableHeight;

      firstPageTable.height = totalTableHeight;
      firstPageTable.itemsData = items; // Inject full items
      firstPageTable.renderRows = rows; // Inject all rows
      firstPageBlocks.push(firstPageTable);

      // Add footer blocks shifted down (or up if delta is negative)
      footerBlocks.forEach((fb) => {
        const copy = JSON.parse(JSON.stringify(fb));
        copy.y = (parseFloat(copy.y) || 0) + delta;
        firstPageBlocks.push(copy);
      });

      pages.push({
        blocks: firstPageBlocks,
        height: pageH,
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
    const page1TableHeight =
      headerHeight + firstPageRows.reduce((sum, r) => sum + r.height, 0) + 10;
    firstPageTable.height = page1TableHeight;
    firstPageTable.renderRows = firstPageRows;
    firstPageBlocks.push(firstPageTable);
    pages.push({
      blocks: firstPageBlocks,
      height: pageH,
    });

    // 2. Middle & Last Pages
    while (rowCursor < rows.length) {
      // Check if remaining rows + footer fit on this page (making it the last page)
      const fitOnThisPage =
        getRemainingRowsHeight(rowCursor) + footerHeight + 10 <=
        middlePageMaxSpace;

      if (fitOnThisPage) {
        // Last page with table rows and footer
        const lastPageBlocks = [];
        const lastPageTable = JSON.parse(JSON.stringify(table));
        const lastPageRows = rows.slice(rowCursor);

        const tableRowsHeight = lastPageRows.reduce(
          (sum, r) => sum + r.height,
          0,
        );
        const totalTableHeight = headerHeight + tableRowsHeight + 10;

        // Table starts at top margin (20px)
        lastPageTable.y = 20;
        lastPageTable.height = totalTableHeight;
        lastPageTable.renderRows = lastPageRows;
        lastPageBlocks.push(lastPageTable);

        const shift = 20 - tableY + (totalTableHeight - tableHeight);

        footerBlocks.forEach((fb) => {
          const copy = JSON.parse(JSON.stringify(fb));
          copy.y = (parseFloat(copy.y) || 0) + shift;
          lastPageBlocks.push(copy);
        });

        pages.push({
          blocks: lastPageBlocks,
          height: pageH,
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

        const tableRowsHeight = midPageRows.reduce(
          (sum, r) => sum + r.height,
          0,
        );
        const totalTableHeight = headerHeight + tableRowsHeight + 10;

        midPageTable.y = 20;
        midPageTable.height = totalTableHeight;
        midPageTable.renderRows = midPageRows;
        midPageBlocks.push(midPageTable);

        pages.push({
          blocks: midPageBlocks,
          height: pageH,
        });
      }
    }

    // 3. Final page with ONLY footer if table rows ended but footer couldn't fit on the last page
    if (
      rowCursor >= rows.length &&
      pages.length > 0 &&
      !pages[pages.length - 1].blocks.some((b) =>
        footerBlocks.some((fb) => fb.id === b.id),
      )
    ) {
      const finalPageBlocks = [];
      const actualFooterStart = 20; // Starts at top
      const designFooterStart = tableY + tableHeight;
      const shift = actualFooterStart - designFooterStart;

      footerBlocks.forEach((fb) => {
        const copy = JSON.parse(JSON.stringify(fb));
        copy.y = (parseFloat(copy.y) || 0) + shift;
        finalPageBlocks.push(copy);
      });

      pages.push({
        blocks: finalPageBlocks,
        height: pageH,
      });
    }
  }

  return pages;
}
