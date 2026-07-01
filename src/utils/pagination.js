import {
  getNestedValue,
  SAMPLE_DATA,
  resolveBlockBinding,
  resolveVariables,
} from "./variableResolver.js";

const estimateBlockHeight = (block, data) => {
  const height = parseFloat(block.height) || 32;
  if (
    ![
      "text",
      "field_row",
      "notes",
      "bank_details",
      "carbon_copy_label",
    ].includes(block.type)
  ) {
    return height;
  }

  // Estimate text content
  let text = "";
  let fontSize = parseFloat(block.fontSize) || 13;
  let lineHeight = block.lineHeight || 1.4;
  let width = parseFloat(block.width) || 200;

  if (
    block.type === "text" ||
    block.type === "notes" ||
    block.type === "bank_details" ||
    block.type === "carbon_copy_label"
  ) {
    let content = block.content || "";
    try {
      content = resolveVariables(content, data, true);
    } catch (e) {}
    text = content;
  } else if (block.type === "field_row") {
    // For field row, the value container is narrower
    const labelW = parseFloat(block.labelWidth) || 40;
    width = width * (1 - labelW / 100) - 10;

    // Resolve value
    let val = block.value || "";
    try {
      const binding = resolveBlockBinding(block, data, true);
      if (binding !== null) val = String(binding);
    } catch (e) {}
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
  paragraphs.forEach((p) => {
    totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
  });

  const contentH = totalLines * fontSize * lineHeight;
  const padding = 6; // vertical padding fallback
  return Math.max(height, contentH + padding);
};

/**
 * Calculates page layout pagination for multi-page document templates.
 *
 * @param {Array}  blocks         - Original template blocks
 * @param {Object} data        - Real live transaction data
 * @param {Object} format         - Selected format details (height, width, isThermal)
 * @param {Object} settingsStore  - Settings store instance for sampleData access
 * @returns {Array} List of pages, where each page contains its format dimensions and array of adjusted blocks.
 */
export function paginateTemplate(blocks, data, format, settingsStore) {
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
  let sourceData = data || settingsStore?.sampleData;
  if (!sourceData || Object.keys(sourceData).length === 0) {
    sourceData = SAMPLE_DATA;
  }
  const allItems =
    getNestedValue(sourceData, bindingField) || table.items || [];
  const items = Array.isArray(allItems) ? allItems : [];

  const headerFontSize = parseFloat(
    table.headerFontSize ?? table.bodyFontSize ?? 12,
  );
  const bodyFontSize = parseFloat(table.bodyFontSize ?? 12);
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

  const lineHeightRatio = 1.35;
  const hasBorders = table.showBorders !== false;
  const borderH = hasBorders ? 1 : 0;

  const hasCustomPadding =
    table.cellPaddingTop !== undefined ||
    table.cellPaddingBottom !== undefined ||
    table.cellPadding !== undefined;

  const customTop = table.cellPaddingTop ?? table.cellPadding ?? 6;
  const customBottom = table.cellPaddingBottom ?? table.cellPadding ?? 6;
  const customVPad = parseFloat(customTop) + parseFloat(customBottom);

  const defaultTop = 2;
  const defaultBottom = 2;
  const vPadDefault = defaultTop + defaultBottom;

  const headerHeight =
    table.showHeader !== false
      ? Math.round(
          (headerFontSize * lineHeightRatio + hTop + hBottom + borderH) *
            headerRowCount,
        )
      : 0;

  const rowMinHeight = Math.round(
    bodyFontSize * lineHeightRatio +
      (hasCustomPadding ? customVPad : vPadDefault) +
      borderH,
  );
  const defaultRowHeight = table.defaultRowHeight;

  const getEstimatedLines = (col, item) => {
    let lines = 1;

    // Estimate lines from text content wrapping
    if (item && col.id) {
      const textVal = String(item[col.id] || "");
      if (textVal) {
        const tableWidth = parseFloat(table.width) || 600;
        const colPercent = parseFloat(col.width) || 15;
        const noOrTotal = col.id === "no" || col.id === "total";
        const hPad = (noOrTotal ? 8 : 4) * 2;
        const colWidthPx = tableWidth * (colPercent / 100) - hPad;

        // Detect Khmer characters (\u1780-\u17FF)
        const isKhmer = /[\u1780-\u17FF]/.test(textVal);
        const avgCharWidth = bodyFontSize * (isKhmer ? 0.72 : 0.55);

        const charsPerLine = Math.max(8, Math.floor(colWidthPx / avgCharWidth));
        // Split by newlines first
        const paragraphs = textVal.split(/\r?\n/);
        let estimatedLines = 0;
        paragraphs.forEach((p) => {
          estimatedLines += Math.max(1, Math.ceil(p.length / charsPerLine));
        });
        lines = estimatedLines;
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

    const cols = table.columns || [];
    let maxHeight = 0;
    cols.forEach((col) => {
      if (col.visible !== false) {
        const textVal = String(item[col.id] || "");
        const isKhmer = /[\u1780-\u17FF]/.test(textVal);
        const lines = getEstimatedLines(col, item);
        const effectiveLineHeightRatio = isKhmer ? 1.5 : lineHeightRatio;
        const contentHeight = lines * bodyFontSize * effectiveLineHeightRatio;

        // Compute padding to match ItemTableBlockRenderer.vue exactly
        let vPad;
        if (hasCustomPadding) {
          vPad = customVPad;
        } else {
          const noOrTotal = col.id === "no" || col.id === "total";
          vPad = (noOrTotal ? 5 : 2) * 2;
        }

        const cellH = contentHeight + vPad + borderH;
        if (cellH > maxHeight) maxHeight = cellH;
      }
    });

    // defaultRowHeight should be a FLOOR (minimum), not a fixed override.
    // The old formula `Math.max(defaultRowHeight ?? maxHeight, rowMinHeight)`
    // caused defaultRowHeight=36 to bypass the content estimate (~53px for
    // 3-line rows), making estimated table height too short and positioning
    // the summary block inside the actual rendered table.
    const contentBased =
      maxHeight > 0 ? Math.max(maxHeight, rowMinHeight) : rowMinHeight;
    return defaultRowHeight != null
      ? Math.max(contentBased, defaultRowHeight)
      : contentBased;
  };

  const getParentContainer = (blockId) => {
    return blocks.find(
      (b) => b.type === "container" && (b.childIds ?? []).includes(blockId),
    );
  };

  const layoutMode = settingsStore?.layoutMode || "freeform";
  const repeatHeader = !!settingsStore?.repeatHeader;
  const repeatFooter = !!settingsStore?.repeatFooter;
  const tableY_design = parseFloat(table.y) || 0;

  // Identify Header vs Footer blocks
  let headerBlocks, footerBlocks, bottomBlocks, flowingBlocks;

  if (layoutMode === "sections") {
    headerBlocks = blocks.filter(
      (b) => b.section === "header" && b.id !== table.id,
    );
    // 3 sections mode: header / table / footer
    // footer blocks flow after the table (relative Y from table bottom)
    footerBlocks = blocks.filter(
      (b) => b.section === "footer" && b.id !== table.id,
    );
    bottomBlocks = []; // no fixed-at-bottom blocks in sections mode
    flowingBlocks = footerBlocks; // all footer blocks flow after the table
  } else {
    headerBlocks = blocks.filter((b) => {
      if (b.id === table.id) return false;
      const parent = getParentContainer(b.id);
      const referenceY = parent ? parseFloat(parent.y) : parseFloat(b.y);
      return referenceY < tableY_design;
    });
    footerBlocks = blocks.filter((b) => {
      if (b.id === table.id) return false;
      const parent = getParentContainer(b.id);
      const referenceY = parent ? parseFloat(parent.y) : parseFloat(b.y);
      return referenceY >= tableY_design;
    });
    const bottomThreshold = pageH - 180;
    bottomBlocks = footerBlocks.filter(
      (b) => parseFloat(b.y) >= bottomThreshold,
    );
    flowingBlocks = footerBlocks.filter(
      (b) => parseFloat(b.y) < bottomThreshold,
    );
  }

  const docHeaderHeight =
    headerBlocks.length > 0
      ? Math.max(
          120,
          ...headerBlocks.map(
            (b) => (parseFloat(b.y) || 0) + estimateBlockHeight(b, sourceData),
          ),
        )
      : 120;

  const tableY = layoutMode === "sections" ? docHeaderHeight : tableY_design;
  const tableHeight = parseFloat(table.height) || 200;
  table._designY = tableY;

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
  const singleEmptyRowH =
    defaultRowHeight != null
      ? Math.max(defaultRowHeight, rowMinHeight)
      : rowMinHeight;

  // Total height of ONLY actual data rows (before any empty-row padding).
  // Used to compute the designed gap between the data content and footer blocks
  // so InvoiceRenderer can position footers relative to the real rendered height.
  const designDataRowsHeight = rows.reduce((sum, r) => sum + r.height, 0);
  const designDataContentEnd =
    tableY + headerHeight + designDataRowsHeight + borderH;

  if (!hasMaxRows) {
    let emptyCount = Math.max(0, (table.emptyRows ?? 0) - items.length);
    for (let i = 0; i < emptyCount; i++) {
      rows.push({
        type: "empty",
        index: items.length + i,
        height: singleEmptyRowH,
      });
    }
  }

  const formatFooterBlock = (
    fb,
    lastPageTableY = 0,
    lastPageTableHeight = 0,
  ) => {
    const copy = JSON.parse(JSON.stringify(fb));
    copy._isFooter = true;
    if (layoutMode === "sections") {
      if (fb.section === "footer") {
        // All footer blocks flow after the table in sections mode.
        // Store the relative Y offset so InvoiceRenderer can re-anchor
        // to the actual measured table bottom (avoids positioning inside
        // the table when row heights exceed the estimate).
        const tableBottom = lastPageTableY + lastPageTableHeight;
        copy._sectionRelY = parseFloat(fb.y) || 0;
        copy.y = tableBottom + copy._sectionRelY;
      }
    } else {
      copy._originalY = parseFloat(fb.y) || 0;
      copy._distanceFromBottom = Math.max(
        0,
        pageH - (parseFloat(fb.y) || 0) - (parseFloat(fb.height) || 0),
      );
    }
    return copy;
  };

  // Compute flowing footer elements bounding box height
  let footerHeight = 0;
  if (flowingBlocks.length > 0) {
    if (layoutMode === "sections") {
      const footerMaxY = Math.max(
        ...flowingBlocks.map(
          (b) => (parseFloat(b.y) || 0) + estimateBlockHeight(b, sourceData),
        ),
      );
      footerHeight = footerMaxY + 10;
    } else {
      const footerMinY = Math.min(
        ...flowingBlocks.map((b) => parseFloat(b.y) || 0),
      );
      const footerMaxY = Math.max(
        ...flowingBlocks.map(
          (b) => (parseFloat(b.y) || 0) + estimateBlockHeight(b, sourceData),
        ),
      );
      footerHeight = footerMaxY - footerMinY + 10;
    }
  }

  // ── Repeated header/footer helpers ───────────────────────────────────────

  // Actual visual bottom of the last header block (correct for both modes).
  // In sections mode block.y is relative to section top (starts at 0).
  // In freeform mode block.y is the absolute paper position.
  // We do NOT use docHeaderHeight here because it has a 120px minimum that
  // causes a large gap between repeated header and table on inner pages.
  const actualHeaderBottom =
    headerBlocks.length > 0
      ? Math.max(
          ...headerBlocks.map(
            (b) => (parseFloat(b.y) || 0) + (parseFloat(b.height) || 0),
          ),
        )
      : 0;

  const repeatedHeaderH = repeatHeader ? actualHeaderBottom : 0;

  // Freeform footer: the band height is the distance from the top of the
  // first footer block to the page bottom (NOT the vertical span of blocks).
  // Sections footer: use footerHeight (the footer section's total visual height).
  const repeatedFooterH = (() => {
    if (!repeatFooter) return 0;
    if (layoutMode === "sections") return footerHeight;
    // Freeform: reserve from footer-band start to page bottom
    if (flowingBlocks.length > 0) {
      const footerMinY = Math.min(
        ...flowingBlocks.map((b) => parseFloat(b.y) || 0),
      );
      return Math.max(0, pageH - footerMinY);
    }
    return 0;
  })();

  /**
   * Clone header blocks for injection onto page `pageIdx`.
   * Each clone gets a unique id/_repeatedId so the renderer treats them as
   * independent elements and doesn't collapse them with the originals.
   */
  function cloneRepeatedHeader(pageIdx) {
    if (!repeatHeader) return [];
    return headerBlocks.map((b) => {
      const copy = JSON.parse(JSON.stringify(b));
      copy.id = `${b.id}_rh_p${pageIdx}`;
      copy._repeatedId = copy.id;
      copy._isRepeatedHeader = true;
      // Keep original x/y — they're relative to the section or paper top
      return copy;
    });
  }

  /**
   * Clone footer blocks pinned to the correct position on page `pageIdx`.
   *
   * Sections mode: blocks are section-relative; pin the footer band to the
   *   last `footerHeight` px of the page.
   * Freeform mode: blocks already have absolute page-relative Y — keep them
   *   unchanged (they naturally sit at the same distance from page bottom).
   */
  function cloneRepeatedFooter(pageIdx) {
    if (!repeatFooter) return [];
    return footerBlocks.map((b) => {
      const copy = JSON.parse(JSON.stringify(b));
      copy.id = `${b.id}_rf_p${pageIdx}`;
      copy._repeatedId = copy.id;
      copy._isRepeatedFooter = true;
      copy._isFooter = true;
      if (layoutMode === "sections") {
        copy._sectionRelY = parseFloat(b.y) || 0;
        copy.y = tableY + tableHeight + copy._sectionRelY;
      } else {
        copy.y = parseFloat(b.y) || 0;
      }
      return copy;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (isThermal) {
    const totalTableHeight =
      headerHeight + rows.reduce((sum, r) => sum + r.height, 0) + borderH;
    const finalPageHeight =
      layoutMode === "sections"
        ? tableY + totalTableHeight + footerHeight + 180
        : Math.max(pageH, pageH + (totalTableHeight - tableHeight));

    // Adjust positions
    const adjustedBlocks = blocks.map((b) => {
      const copy = JSON.parse(JSON.stringify(b));
      if (copy.id === table.id) {
        copy.height = totalTableHeight;
        copy._designHeight = tableHeight;
        copy._estimatedHeight = totalTableHeight;
        copy._instanceId = "table_page_0";
      } else {
        const parent = getParentContainer(copy.id);
        const referenceY = parent ? parseFloat(parent.y) : parseFloat(copy.y);
        if (referenceY >= tableY || copy.section === "footer") {
          copy._isFooter = true;
          if (layoutMode === "sections" && copy.section === "footer") {
            // Footer flows right after the table
            copy.y = tableY + totalTableHeight + (parseFloat(copy.y) || 0);
          }
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

  const bottomMinY =
    bottomBlocks.length > 0
      ? Math.min(
          ...bottomBlocks.map((b) => {
            if (layoutMode === "sections") {
              return pageH - 180 + (parseFloat(b.y) || 0);
            }
            return parseFloat(b.y) || pageH;
          }),
        )
      : pageH;

  const firstPageMaxSpace =
    bottomBlocks.length > 0
      ? bottomMinY - tableY - headerHeight - 15
      : pageH - tableY - headerHeight - repeatedFooterH - 20;

  // Inner pages: table starts right below repeated header (+ 8px padding).
  // repeatedHeaderH is now the ACTUAL visual bottom of header blocks (no 120px min).
  const innerPageTableY = repeatHeader ? tableY : 20;

  // Safety margin is 30px (not 20) to buffer row-height estimation errors
  // that would otherwise push rows into the reserved footer band.
  const middlePageMaxSpace =
    bottomBlocks.length > 0
      ? bottomMinY - innerPageTableY - headerHeight - repeatedFooterH - 15
      : pageH - innerPageTableY - headerHeight - repeatedFooterH - 30;

  if (hasMaxRows) {
    let pageIdx = 0;
    while (rowCursor < rows.length || (rowCursor === 0 && rows.length === 0)) {
      const isFirstPage = pageIdx === 0;
      const maxSpace = isFirstPage ? firstPageMaxSpace : middlePageMaxSpace;
      // First page starts with header blocks; inner pages get repeated header clones
      const pageBlocks = isFirstPage
        ? JSON.parse(JSON.stringify(headerBlocks))
        : cloneRepeatedHeader(pageIdx);
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

      const totalTableHeight = headerHeight + tableRowsHeight + borderH;

      const pageTableY = isFirstPage ? tableY : innerPageTableY;

      const requiredFooterSpace = repeatFooter ? 0 : footerHeight + 10;
      const footerFits =
        rowCursor >= rows.length && currentSpace >= requiredFooterSpace;

      if (rowCursor >= rows.length && footerFits) {
        // ── Last page: data rows + footer ────────────────────────────────────
        // On multi-page last pages (pageIdx > 0), we intentionally skip the
        // empty-row padding so the table ends right at the last data row and
        // the footer appears immediately below with the designed gap.
        const isMultiPageLast = pageIdx > 0;
        if (!isMultiPageLast) {
          // Single-page invoice: add empty rows for visual consistency
          const emptyNeeded = maxRowsPerPage - pageRows.length;
          for (let i = 0; i < emptyNeeded; i++) {
            pageRows.push({
              type: "empty",
              index: items.length + pageRows.length,
              height: singleEmptyRowH,
            });
          }
        }

        const tableRowsHeight = pageRows.reduce((sum, r) => sum + r.height, 0);
        const totalTableHeight = headerHeight + tableRowsHeight + borderH;
        const hasEmptyRows = pageRows.some((r) => r.type === "empty");

        pageTable.y = pageTableY;
        pageTable.height = totalTableHeight;
        pageTable.renderRows = pageRows;
        pageTable._designHeight = tableHeight;
        pageTable._estimatedHeight = totalTableHeight;
        pageTable._instanceId = `table_page_${pageIdx}`;
        pageTable._hasEmptyRows = hasEmptyRows;
        pageBlocks.push(pageTable);

        // Last page: real footer (no pinned repeated footer to avoid duplicate totals)
        footerBlocks.forEach((fb) => {
          pageBlocks.push(formatFooterBlock(fb, pageTableY, totalTableHeight));
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
        pageTable._designHeight = tableHeight;
        pageTable._estimatedHeight = totalTableHeight;
        pageTable._instanceId = `table_page_${pageIdx}`;
        pageBlocks.push(pageTable);
        // Inject repeated footer (pinned to page bottom) on non-last pages
        cloneRepeatedFooter(pageIdx).forEach((b) => pageBlocks.push(b));

        pages.push({
          blocks: pageBlocks,
          height: pageH,
        });

        if (rowCursor >= rows.length) {
          // Footer didn't fit on this page — place it on a new final page
          const finalPageBlocks = [];
          footerBlocks.forEach((fb) => {
            finalPageBlocks.push(formatFooterBlock(fb, 20, 0));
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
    // On the first page also inject a pinned repeated footer (if enabled)
    // NOTE: it's pushed AFTER the table below, not here
    const firstPageTable = JSON.parse(JSON.stringify(table));
    const firstPageRows = [];
    let currentSpace = firstPageMaxSpace;

    // Check if all rows + footer fits on page 1.
    // If repeatFooter is true, the footer space is already reserved/subtracted
    // from firstPageMaxSpace, so we don't add it to the required space.
    const requiredFooterSpace = repeatFooter ? 0 : footerHeight + 10;
    const allFitOnPage1 =
      getRemainingRowsHeight(0) + requiredFooterSpace <=
      firstPageMaxSpace * 0.95;

    if (allFitOnPage1) {
      // Everything fits on one page!
      const pageRowsHeight = getRemainingRowsHeight(0);
      const totalTableHeight = headerHeight + pageRowsHeight + borderH;

      firstPageTable.y = tableY;
      firstPageTable.height = totalTableHeight;
      firstPageTable.itemsData = items; // Inject full items
      firstPageTable.renderRows = rows; // Inject all rows
      firstPageTable._designHeight = tableHeight;
      firstPageTable._estimatedHeight = totalTableHeight;
      firstPageTable._instanceId = `table_page_${pages.length}`;
      firstPageBlocks.push(firstPageTable);

      // Add footer blocks (renderer adjusts based on measured height).
      // Skip repeated footer on last page to avoid duplicate totals.
      const allFitHasEmptyRows = rows.some((r) => r.type === "empty");
      firstPageTable._hasEmptyRows = allFitHasEmptyRows;
      footerBlocks.forEach((fb) => {
        firstPageBlocks.push(formatFooterBlock(fb, tableY, totalTableHeight));
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

    // Inject repeated footer on first page if it couldn't all fit
    cloneRepeatedFooter(0).forEach((b) => firstPageBlocks.push(b));

    // Adjust Page 1 table height to fit its rows
    const page1TableHeight =
      headerHeight +
      firstPageRows.reduce((sum, r) => sum + r.height, 0) +
      borderH;
    firstPageTable.y = tableY;
    firstPageTable.height = page1TableHeight;
    firstPageTable.renderRows = firstPageRows;
    firstPageTable._designHeight = tableHeight;
    firstPageTable._estimatedHeight = page1TableHeight;
    firstPageTable._instanceId = `table_page_${pages.length}`;
    firstPageBlocks.push(firstPageTable);
    pages.push({
      blocks: firstPageBlocks,
      height: pageH,
    });

    // 2. Middle & Last Pages
    while (rowCursor < rows.length) {
      const requiredFooterSpace = repeatFooter ? 0 : footerHeight + 10;
      const fitOnThisPage =
        getRemainingRowsHeight(rowCursor) + requiredFooterSpace <=
        middlePageMaxSpace * 0.95;

      if (fitOnThisPage) {
        // Last page: real footer only (no repeated footer to avoid duplicate totals)
        const lastPageBlocks = cloneRepeatedHeader(pages.length);
        const lastPageTable = JSON.parse(JSON.stringify(table));
        const lastPageRows = rows.slice(rowCursor);

        const tableRowsHeight = lastPageRows.reduce(
          (sum, r) => sum + r.height,
          0,
        );
        const totalTableHeight = headerHeight + tableRowsHeight + borderH;

        // Table starts at inner page top margin
        lastPageTable.y = innerPageTableY;
        lastPageTable.height = totalTableHeight;
        lastPageTable.renderRows = lastPageRows;
        lastPageTable._designHeight = tableHeight;
        lastPageTable._estimatedHeight = totalTableHeight;
        lastPageTable._instanceId = `table_page_${pages.length}`;
        lastPageBlocks.push(lastPageTable);

        // non-maxRows last page: no empty-row padding, table ends at data rows.
        lastPageTable._hasEmptyRows = false;

        footerBlocks.forEach((fb) => {
          lastPageBlocks.push(
            formatFooterBlock(fb, innerPageTableY, totalTableHeight),
          );
        });

        pages.push({
          blocks: lastPageBlocks,
          height: pageH,
        });
        rowCursor = rows.length; // Complete
        break;
      } else {
        // Another middle page
        const midPageBlocks = cloneRepeatedHeader(pages.length);
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
        const totalTableHeight = headerHeight + tableRowsHeight + borderH;

        midPageTable.y = innerPageTableY;
        midPageTable.height = totalTableHeight;
        midPageTable.renderRows = midPageRows;
        midPageTable._designHeight = tableHeight;
        midPageTable._estimatedHeight = totalTableHeight;
        midPageTable._instanceId = `table_page_${pages.length}`;
        midPageBlocks.push(midPageTable);
        // Inject repeated footer on middle pages
        cloneRepeatedFooter(pages.length).forEach((b) => midPageBlocks.push(b));

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
        b._isRepeatedFooter || footerBlocks.some((fb) => fb.id === b.id),
      )
    ) {
      const finalPageBlocks = [];
      footerBlocks.forEach((fb) => {
        finalPageBlocks.push(formatFooterBlock(fb, 20, 0));
      });

      pages.push({
        blocks: finalPageBlocks,
        height: pageH,
      });
    }
  }

  return pages;
}
