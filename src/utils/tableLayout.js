/**
 * tableLayout.js
 * Simulates the browser's page-break placement for an item table.
 *
 * The browser applies `break-inside: avoid` on every <tr>, so each row either
 * fits entirely on the current page or is pushed to the next one, leaving slack
 * (empty space) at the bottom of the page.  The <thead> is repeated at the top
 * of every new page (display: table-header-group default behaviour).
 *
 * @param {Object}  itemTable      - The item_table block configuration object
 * @param {Array}   items          - The resolved data rows array
 * @param {number}  pageH          - Full page height in px (e.g. 1123 for A4)
 * @param {number}  marginTopPx    - Top margin for page 2+ in px (0 if none)
 * @param {number}  marginBottomPx - Bottom margin for all pages in px (0 if none)
 * @returns {number} pixels to shift blocks that sit below the table
 */
export function computeTableShiftOffset(
  itemTable,
  items,
  pageH,
  marginTopPx = 0,
  marginBottomPx = 0,
) {
  if (!itemTable) return 0;

  const designHeight = parseFloat(itemTable.height) || 200;
  const designY = parseFloat(itemTable.y) || 0;

  // Header height
  const headerFontSize =
    itemTable.headerFontSize ?? itemTable.bodyFontSize ?? 12;
  const hTop =
    itemTable.headerPaddingTop ??
    itemTable.cellPaddingTop ??
    itemTable.cellPadding ??
    6;
  const hBottom =
    itemTable.headerPaddingBottom ??
    itemTable.cellPaddingBottom ??
    itemTable.cellPadding ??
    6;
  const headerH =
    itemTable.showHeader !== false ? headerFontSize + hTop + hBottom + 10 : 0;

  // Row min height
  const bodyFontSize = itemTable.bodyFontSize ?? 12;
  const pTop = itemTable.cellPaddingTop ?? itemTable.cellPadding ?? 5;
  const pBottom = itemTable.cellPaddingBottom ?? itemTable.cellPadding ?? 5;
  const rowMinH = bodyFontSize + pTop + pBottom + 8;
  const defaultRowH = itemTable.defaultRowHeight ?? 30;

  const getRowH = (i) => {
    if (i < items.length) {
      const custom = itemTable.rowStyles?.[i]?.height;
      return Math.max(custom != null ? custom : defaultRowH, rowMinH);
    }
    return Math.max(defaultRowH, rowMinH);
  };

  const emptyCount = Math.max(0, (itemTable.emptyRows ?? 0) - items.length);
  const totalRows = items.length + emptyCount;

  // Page 1: space below header down to page bottom edge
  let spaceRemaining = pageH - marginBottomPx - designY - headerH;
  let currentY = designY + headerH;
  let pageIdx = 0;

  // Simulate each data/empty row with break-inside: avoid
  for (let i = 0; i < totalRows; i++) {
    const rH = getRowH(i);
    if (rH > spaceRemaining) {
      // Row doesn't fit — push to next page (thead repeats there)
      pageIdx++;
      currentY = pageIdx * pageH + marginTopPx + headerH;
      spaceRemaining = pageH - marginTopPx - marginBottomPx - headerH;
    }
    currentY += rH;
    spaceRemaining -= rH;
  }

  // Special rows (dividers, summary rows)
  if (Array.isArray(itemTable.specialRows)) {
    itemTable.specialRows.forEach((sr) => {
      const srH =
        sr.type === "divider"
          ? (sr.thickness ?? 1) + 8
          : Math.max(defaultRowH, rowMinH);
      if (srH > spaceRemaining) {
        pageIdx++;
        currentY = pageIdx * pageH + marginTopPx + headerH;
        spaceRemaining = pageH - marginTopPx - marginBottomPx - headerH;
      }
      currentY += srH;
      spaceRemaining -= srH;
    });
  }

  // Bottom border/padding buffer (mirrors +10 in computedTableHeight)
  currentY += 10;

  const originalEnd = designY + designHeight;
  return Math.max(0, currentY - originalEnd);
}
