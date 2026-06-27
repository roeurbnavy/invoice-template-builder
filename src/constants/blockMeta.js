// Block metadata for the library panel
// Each entry maps a block type → icon name (Lucide), name, description

export const BLOCK_META = {
  // Basic
  text: { icon: "Type", name: "Text", description: "Static text, any style" },
  dynamic_text: {
    icon: "Variable",
    name: "Dynamic Text",
    description: "{{variable}} placeholder",
  },
  image: {
    icon: "Image",
    name: "Image",
    description: "Upload logo, stamp, QR image",
  },
  divider: { icon: "Minus", name: "Divider", description: "Horizontal line" },
  spacer: {
    icon: "AlignVerticalSpaceAround",
    name: "Spacer",
    description: "Vertical gap",
  },
  shape: {
    icon: "Square",
    name: "Shape",
    description: "Rectangle, circle, line",
  },
  container: {
    icon: "Box",
    name: "Container",
    description: "Group blocks together",
  },

  // Layout
  row: {
    icon: "AlignHorizontalJustifyStart",
    name: "Row",
    description: "Horizontal flex layout",
  },
  column: {
    icon: "AlignVerticalJustifyStart",
    name: "Column",
    description: "Vertical layout",
  },
  grid: { icon: "LayoutGrid", name: "Grid", description: "Multi-column grid" },
  section: {
    icon: "Columns2",
    name: "Section",
    description: "Reusable grouped layout",
  },
  background_block: {
    icon: "PaintBucket",
    name: "Background",
    description: "Colored section background",
  },
  page_break: {
    icon: "Scissors",
    name: "Page Break",
    description: "Force new page in PDF",
  },
  page_number: {
    icon: "Hash",
    name: "Page Number",
    description: "Auto page numbering",
  },

  // Company & Client
  company_info: {
    icon: "Building2",
    name: "Company Info",
    description: "Logo + name + address + contact",
  },
  client_info: {
    icon: "User",
    name: "Client Info",
    description: "Name + address + contact",
  },
  header_grid: {
    icon: "PanelTop",
    name: "Header Grid",
    description: "Multi-column info grid, fill mode",
  },
  field_row: {
    icon: "Tag",
    name: "Text & Content",
    description: "Label + value pair",
  },

  // Document
  document_title: {
    icon: "Heading1",
    name: "Document Title",
    description: "INVOICE / RECEIPT heading",
  },
  document_number: {
    icon: "FileDigit",
    name: "Document Number",
    description: "Auto invoice number",
  },
  issue_date: {
    icon: "Calendar",
    name: "Issue Date",
    description: "Date with format options",
  },
  due_date: {
    icon: "CalendarClock",
    name: "Due Date",
    description: "Due date with overdue highlight",
  },
  reference_number: {
    icon: "Fingerprint",
    name: "Reference No.",
    description: "PO or custom reference",
  },
  terms: {
    icon: "ScrollText",
    name: "Terms & Conditions",
    description: "Scrollable terms text",
  },
  footer_note: {
    icon: "AlignBottom",
    name: "Footer Note",
    description: "Small print at bottom",
  },
  thank_you: {
    icon: "Heart",
    name: "Thank You",
    description: "Styled closing message",
  },

  // Table & Data
  item_table: {
    icon: "Table",
    name: "Item Table",
    description: "Line items with configurable columns",
  },
  table_builder: {
    icon: "Table2",
    name: "Table Builder",
    description: "Fully custom column table",
  },
  currency_summary: {
    icon: "Coins",
    name: "Currency Summary",
    description: "Multi-currency breakdown",
  },
  // Financial
  subtotal: {
    icon: "Sigma",
    name: "Subtotal",
    description: "Auto sum of line items",
  },
  discount: {
    icon: "Percent",
    name: "Discount",
    description: "Fixed or percentage discount",
  },
  tax: {
    icon: "Receipt",
    name: "Tax / VAT",
    description: "Configurable tax rate",
  },
  grand_total: {
    icon: "CircleDollarSign",
    name: "Grand Total",
    description: "Bold styled final amount",
  },
  balance_due: {
    icon: "Wallet",
    name: "Balance Due",
    description: "Remaining unpaid amount",
  },
  deposit_paid: {
    icon: "ArrowDownCircle",
    name: "Deposit / Paid",
    description: "Amount already paid",
  },
  bank_details: {
    icon: "Landmark",
    name: "Bank Details",
    description: "Bank name, account info",
  },
  // Signature
  signature_line: {
    icon: "PenLine",
    name: "Signature Line",
    description: "Signature line + label",
  },
  digital_signature: {
    icon: "ShieldCheck",
    name: "Digital Signature",
    description: "Placeholder for digital sig",
  },

  // Logic
  variable_binding: {
    icon: "Braces",
    name: "Variable Binding",
    description: "{{customer.name}} binding",
  },
  repeat_block: {
    icon: "RefreshCw",
    name: "Repeat Block",
    description: "Loop over data array",
  },
  conditional_block: {
    icon: "GitBranch",
    name: "Conditional Block",
    description: "Show/hide on condition",
  },
  formula_block: {
    icon: "FunctionSquare",
    name: "Formula",
    description: "Custom calculation formula",
  },

  // Smart
  barcode: {
    icon: "Barcode",
    name: "Barcode",
    description: "Product or document barcode",
  },
  multi_language_row: {
    icon: "Languages",
    name: "Multi-language",
    description: "Khmer + English side by side",
  },
  watermark: {
    icon: "Stamp",
    name: "Watermark",
    description: "Diagonal text or image overlay",
  },
  scanner_result: {
    icon: "ScanLine",
    name: "Scanner Result",
    description: "Display QR scan result as text",
  },

  // Payment
  payment_qr: {
    icon: "QrCode",
    name: "Payment QR",
    description: "QR code image with optional label",
  },

  // New simplified blocks
  checkboxes_row: {
    icon: "CheckSquare",
    name: "Checkboxes Row",
    description: "\u2610 Cash  \u2610 Transfer  \u2610 Credit",
  },
  table: {
    icon: "Table2",
    name: "Table",
    description: "Rows + columns, fully configurable",
  },
  cut_line: {
    icon: "Scissors",
    name: "Cut Line",
    description: "\u2702 Dashed separation line",
  },
  carbon_copy_label: {
    icon: "Copy",
    name: "Carbon Copy Label",
    description: "ORIGINAL / COPY 1 / COPY 2",
  },
};
