// All block type identifiers — frozen to prevent accidental mutation
export const BLOCK_TYPES = Object.freeze({
  // Basic
  TEXT: "text",
  DYNAMIC_TEXT: "dynamic_text",
  IMAGE: "image",
  DIVIDER: "divider",
  SPACER: "spacer",
  SHAPE: "shape",
  CONTAINER: "container",

  // Layout
  ROW: "row",
  COLUMN: "column",
  GRID: "grid",
  SECTION: "section",
  BACKGROUND_BLOCK: "background_block",
  PAGE_BREAK: "page_break",
  PAGE_NUMBER: "page_number",

  // Company & Client
  COMPANY_INFO: "company_info",
  CLIENT_INFO: "client_info",
  HEADER_GRID: "header_grid",
  FIELD_ROW: "field_row",

  // Document
  DOCUMENT_TITLE: "document_title",
  DOCUMENT_NUMBER: "document_number",
  ISSUE_DATE: "issue_date",
  DUE_DATE: "due_date",
  REFERENCE_NUMBER: "reference_number",
  TERMS: "terms",
  FOOTER_NOTE: "footer_note",
  THANK_YOU: "thank_you",

  // Table & Data
  ITEM_TABLE: "item_table",
  TABLE_BUILDER: "table_builder",
  CURRENCY_SUMMARY: "currency_summary",

  // Financial
  SUBTOTAL: "subtotal",
  DISCOUNT: "discount",
  TAX: "tax",
  GRAND_TOTAL: "grand_total",
  BALANCE_DUE: "balance_due",
  DEPOSIT_PAID: "deposit_paid",
  BANK_DETAILS: "bank_details",

  // Signature
  SIGNATURE_LINE: "signature_line",
  DIGITAL_SIGNATURE: "digital_signature",

  // Logic
  VARIABLE_BINDING: "variable_binding",
  REPEAT_BLOCK: "repeat_block",
  CONDITIONAL_BLOCK: "conditional_block",
  FORMULA_BLOCK: "formula_block",

  // Payment
  PAYMENT_QR: "payment_qr",

  // Smart
  BARCODE: "barcode",
  MULTI_LANGUAGE_ROW: "multi_language_row",
  WATERMARK: "watermark",
  SCANNER_RESULT: "scanner_result",

  // Simplified library additions
  CHECKBOXES_ROW: "checkboxes_row",
  TABLE: "table",
  CUT_LINE: "cut_line",
  CARBON_COPY_LABEL: "carbon_copy_label",
});

export const BLOCK_CATEGORIES = [
  {
    id: "content",
    label: "Text & Content",
    icon: "Type",
    blocks: ["text", "image", "divider", "spacer", "checkboxes_row", "field_row"],
  },
  {
    id: "document",
    label: "Document",
    icon: "FileText",
    blocks: ["barcode"],
  },
  {
    id: "financial",
    label: "Financial",
    icon: "DollarSign",
    blocks: ["item_table"],
  },
  {
    id: "footer",
    label: "Footer",
    icon: "PenLine",
    blocks: ["signature_line", "watermark"],
  },
  {
    id: "print",
    label: "Print",
    icon: "Printer",
    blocks: ["cut_line", "page_break", "carbon_copy_label"],
  },
];
