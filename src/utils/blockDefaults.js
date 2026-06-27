import { BLOCK_TYPES } from "../constants/blockTypes.js";

const BASE = {
  x: 100,
  y: 100,
  rotation: 0,
  opacity: 1,
  locked: false,
  hideOnPrint: false,
  visibleFormats: ["A4", "A5", "RECEIPT_58", "RECEIPT_80"],
  // Style
  backgroundColor: "transparent",
  borderWidth: 0,
  borderTopWidth: undefined,
  borderRightWidth: undefined,
  borderBottomWidth: undefined,
  borderLeftWidth: undefined,
  borderColor: "#000000",
  borderStyle: "solid",
  borderRadius: 0,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: "rgba(0,0,0,0.2)",
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  // Data binding
  dataBinding: {
    field: null,
    type: 'string',
    format: {},
  },
};

const TEXT_STYLE = {
  fontFamily: "Noto Sans, sans-serif",
  fontSize: 13,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#000000",
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: "left",
  textDecoration: "none",
  textTransform: "none",
};

export const BLOCK_DEFAULTS = {
  [BLOCK_TYPES.TEXT]: {
    ...BASE,
    width: 200,
    height: 32,
    content: "Text block",
    ...TEXT_STYLE,
  },

  [BLOCK_TYPES.DYNAMIC_TEXT]: {
    ...BASE,
    width: 200,
    height: 32,
    content: "{{invoice.number}}",
    variable: "invoice.number",
    fallback: "N/A",
    ...TEXT_STYLE,
    dataBinding: { field: null, type: 'string', format: {} },
  },

  [BLOCK_TYPES.IMAGE]: {
    ...BASE,
    width: 120,
    height: 120,
    src: null,
    fitMode: "contain",
    borderRadius: 0,
  },

  [BLOCK_TYPES.DIVIDER]: {
    ...BASE,
    width: 300,
    height: 2,
    lineWidth: 1,
    lineColor: "#cccccc",
    lineStyle: "solid",
  },

  [BLOCK_TYPES.SPACER]: {
    ...BASE,
    width: 200,
    height: 24,
    backgroundColor: "transparent",
  },

  [BLOCK_TYPES.SHAPE]: {
    ...BASE,
    width: 100,
    height: 100,
    shapeType: "rectangle",
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#aaaaaa",
    borderRadius: 0,
  },

  [BLOCK_TYPES.CONTAINER]: {
    ...BASE,
    width: 300,
    height: 200,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#cccccc",
    lockChildren: false,
    childIds: [],
  },

  [BLOCK_TYPES.FIELD_ROW]: {
    ...BASE,
    width: 280,
    height: 28,
    label: "Field Label",
    value: "Value",
    labelWidth: 40,
    ...TEXT_STYLE,
    labelFontWeight: "bold",
  },

  [BLOCK_TYPES.HEADER_GRID]: {
    ...BASE,
    width: 600,
    height: 120,
    columns: [
      { label: 'From', content: '' },
      { label: 'To', content: '' },
      { label: 'Details', content: '' },
    ],
    ...TEXT_STYLE,
  },

  [BLOCK_TYPES.DOCUMENT_TITLE]: {
    ...BASE,
    width: 200,
    height: 48,
    content: "INVOICE",
    ...TEXT_STYLE,
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a2e",
    textAlign: "left",
  },

  [BLOCK_TYPES.ITEM_TABLE]: {
    ...BASE,
    width: 600,
    height: 240,
    columns: [
      { id: "no", label: "#", width: 5, visible: true },
      { id: "description", label: "Description", width: 40, visible: true },
      { id: "qty", label: "Qty", width: 10, visible: true },
      { id: "unit_price", label: "Unit Price", width: 15, visible: true },
      { id: "discount", label: "Discount", width: 10, visible: false },
      { id: "tax", label: "Tax", width: 10, visible: false },
      { id: "total", label: "Total", width: 20, visible: true },
    ],
    showHeader: true,
    showRowNumbers: false,
    showBorders: true,
    borderColor: "#e0e0e0",
    headerBg: "#f5f5f5",
    headerColor: "#333333",
    headerFontWeight: "bold",
    bodyFontSize: 12,
    emptyRows: 3,
    showEmptyRowBorders: true,
    items: [],
  },

  [BLOCK_TYPES.SIGNATURE_LINE]: {
    ...BASE,
    width: 200,
    height: 60,
    label: "Authorized Signature",
    showDate: true,
    ...TEXT_STYLE,
    fontSize: 11,
    color: "#555555",
  },

  [BLOCK_TYPES.COMPANY_INFO]: {
    ...BASE,
    width: 280,
    height: 100,
    showLogo: true,
    showName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    ...TEXT_STYLE,
    address: "",
    phone: "",
    email: "",
    website: "",
  },

  [BLOCK_TYPES.CLIENT_INFO]: {
    ...BASE,
    width: 240,
    height: 100,
    showName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    label: "Bill To",
    ...TEXT_STYLE,
    clientName: "",
    clientAddress: "",
    clientPhone: "",
    clientEmail: "",
    clientTaxId: "",
  },

  [BLOCK_TYPES.PAYMENT_QR]: {
    ...BASE,
    width: 120,
    height: 120,
    src: null,
    fitMode: "contain",
    label: "Scan to Pay",
    showLabel: true,
    ...TEXT_STYLE,
    fontSize: 10,
    textAlign: "center",
  },

  [BLOCK_TYPES.BANK_DETAILS]: {
    ...BASE,
    width: 280,
    height: 100,
    label: "Bank Details",
    showBankName: true,
    showAccountNo: true,
    showAccountName: true,
    ...TEXT_STYLE,
    fontSize: 12,
    bankName: "",
    accountNo: "",
    accountName: "",
  },

  [BLOCK_TYPES.WATERMARK]: {
    ...BASE,
    width: 400,
    height: 200,
    content: "DRAFT",
    ...TEXT_STYLE,
    fontSize: 72,
    fontWeight: "bold",
    color: "rgba(200,200,200,0.3)",
    rotation: -45,
    textAlign: "center",
  },

  [BLOCK_TYPES.CHECKBOXES_ROW]: {
    ...BASE,
    width: 260,
    height: 32,
    options: [
      { label: "Cash", checked: false },
      { label: "Transfer", checked: false },
      { label: "Credit", checked: false },
    ],
    ...TEXT_STYLE,
  },

  [BLOCK_TYPES.STAMP_BOX]: {
    ...BASE,
    width: 100,
    height: 100,
    label: "Stamp",
    borderWidth: 2,
    borderColor: "#000000",
    borderStyle: "solid",
    borderRadius: 0,
  },

  [BLOCK_TYPES.CUT_LINE]: {
    ...BASE,
    width: 600,
    height: 24,
    showLabel: true,
    hideOnPrint: true,
  },

  [BLOCK_TYPES.CARBON_COPY_LABEL]: {
    ...BASE,
    width: 120,
    height: 40,
    content: "ORIGINAL",
    ...TEXT_STYLE,
    fontSize: 14,
    fontWeight: "bold",
    borderRadius: 4,
  },

  [BLOCK_TYPES.BARCODE]: {
    ...BASE,
    width: 250,
    height: 80,
    content: "",
    ...TEXT_STYLE,
    fontSize: 11,
    textAlign: "center",
    barcodeFormat: "CODE128",
    barcodeHeight: 50,
    barcodeWidth: 2,
    showBarcodeText: true,
    barcodeFontSize: 12,
    barcodeMargin: 10,
  },

  [BLOCK_TYPES.TABLE]: {
    ...BASE,
    width: 400,
    height: 200,
    columns: [
      { id: "col1", label: "Column 1", width: 50, visible: true },
    ],
    showHeader: true,
    showBorders: true,
    borderColor: "#cccccc",
  },

  [BLOCK_TYPES.PAGE_BREAK]: {
    ...BASE,
    width: 600,
    height: 16,
    hideOnPrint: true,
  },

};

/**
 * Get default config for a block type
 * Merges base defaults with type-specific defaults
 */
export function getBlockDefaults(type, overrides = {}) {
  if (!type) {
    console.warn(`getBlockDefaults called with invalid type: ${type}`)
    return null
  }
  const defaults = BLOCK_DEFAULTS[type] ?? { ...BASE, width: 200, height: 50 };
  return {
    ...defaults,
    ...overrides,
    id: crypto.randomUUID(),
    type,
    name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

/**
 * Get border style object for a block, supporting per-side widths.
 * Returns longhand border properties (borderTop, borderRight, etc.)
 * Falls back to uniform borderWidth for each side if per-side value not set.
 */
export function getBorderStyle(block) {
  const side = (s) => {
    const val = block[`border${s}Width`]
    return val !== undefined && val !== null ? val : (block.borderWidth ?? 0)
  }
  const style = block.borderStyle ?? 'solid'
  const color = block.borderColor ?? '#000'
  const top = side('Top')
  const right = side('Right')
  const bottom = side('Bottom')
  const left = side('Left')
  if (!top && !right && !bottom && !left) return { border: 'none' }
  return {
    borderTop: top ? `${top}px ${style} ${color}` : 'none',
    borderRight: right ? `${right}px ${style} ${color}` : 'none',
    borderBottom: bottom ? `${bottom}px ${style} ${color}` : 'none',
    borderLeft: left ? `${left}px ${style} ${color}` : 'none',
  }
}
