# Invoice Builder — Features & Capabilities

> A visual, drag-and-drop invoice and document template builder for the browser.  
> Build professional PDFs, print-ready receipts, and multi-copy documents without writing code.

---

## Table of Contents

1. [Top Bar — Global Settings](#1-top-bar--global-settings)
2. [Canvas & Paper Formats](#2-canvas--paper-formats)
3. [Block Library — All Available Blocks](#3-block-library--all-available-blocks)
4. [Inspector Panel — Tabs & Controls](#4-inspector-panel--tabs--controls)
5. [Preset Layouts (Document Types)](#5-preset-layouts-document-types)
6. [Save, Export & Import](#6-save-export--import)
7. [Language Translation](#7-language-translation)
8. [Keyboard Shortcuts](#8-keyboard-shortcuts)
9. [Data Binding System](#9-data-binding-system)
10. [History & Undo / Redo](#10-history--undo--redo)

---

## 1. Top Bar — Global Settings

The top bar controls document-level settings that apply to the whole canvas.

| Control                  | What it does                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| **Company Name**         | Sets the company name displayed in Company Info blocks            |
| **Document Type**        | Switches the document type and optionally loads a preset layout   |
| **Currency**             | Sets the global currency (affects Totals Block display)           |
| **Global Font**          | Sets the default font family for the entire canvas                |
| **Global Font Size**     | Sets the base font size (8–72 px)                                 |
| **Paper Format**         | Switches between A4, A5, 58mm Receipt, 80mm Receipt               |
| **Orientation Toggle**   | Flips between Portrait ↔ Landscape                                |
| **Undo / Redo**          | Steps forward and backward through edit history                   |
| **Save**                 | Saves the template to browser storage (localStorage)              |
| **Reset**                | Reloads the default preset layout for the current document type   |
| **Print**                | Opens the browser print dialog at zoom 1×                         |
| **Translate**            | One-click English ↔ Khmer translation of all text on the canvas   |
| **Export / Import menu** | Export as PDF, PNG, or JSON — or import an existing JSON template |

---

## 2. Canvas & Paper Formats

### Supported Formats

| Format            | Dimensions   | Best for                                   |
| ----------------- | ------------ | ------------------------------------------ |
| **A4**            | 210 × 297 mm | Standard invoices, purchase orders, quotes |
| **A5**            | 148 × 210 mm | Compact documents, half-size invoices      |
| **58 mm Receipt** | 58 mm wide   | Thermal receipt printers (narrow)          |
| **80 mm Receipt** | 80 mm wide   | Thermal receipt printers (wide)            |

### Orientation

- **Portrait** and **Landscape** supported for A4 and A5.
- Switching format or orientation auto-migrates block positions to fit the new dimensions.

### Canvas Controls

- **Zoom** — zoom in/out on the canvas work area.
- **Snap to grid** — blocks align to a grid when dragged.
- **Alignment guides** — smart guides appear when blocks align with each other.
- **Fill Mode** — click-to-fill mode lets you type directly into blocks on the canvas instead of the inspector.
- **Preview Mode** — renders variable placeholders with sample data so you can see what the final document looks like.

---

## 3. Block Library — All Available Blocks

Blocks are dragged from the left panel onto the canvas. Every block can be freely repositioned, resized, and rotated. Below is the full list organized by category.

### 📝 Text & Content

| Block              | Description                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Text**           | Free-form text block. Supports rich typography, multi-line content, and formatting.                       |
| **Image**          | Embed any image via file upload or URL. Fit modes: Contain, Cover, Stretch.                               |
| **Divider**        | Horizontal line. Configurable thickness, style (solid/dashed/dotted), and color.                          |
| **Spacer**         | Invisible gap block for adding vertical whitespace.                                                       |
| **Checkboxes Row** | A row of labelled checkboxes. Options can be added, removed, renamed, and pre-checked from the inspector. |

### 📐 Layout

| Block         | Description                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Container** | A grouped area that can hold other blocks. Supports locking children so they can't be moved accidentally. |
| **Table**     | A simple data table with configurable columns.                                                            |

### 🏢 Info Blocks

| Block            | Description                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Company Info** | Displays company name, address, phone, email, and website. Each field is individually shown/hidden. Supports custom additional fields (label + value pairs). |
| **Client Info**  | Displays client name, address, phone, email, and tax ID. Configurable section header (e.g. "Bill To"). Also supports custom additional fields.               |
| **Field Row**    | A single label + value row (e.g. "Invoice No: INV-001"). Label width is configurable as a percentage.                                                        |
| **Header Grid**  | A multi-column grid header (e.g. From / To / Invoice). Each column has a label and free-form content that supports `{{variable}}` placeholders.              |

### 📄 Document

| Block               | Description                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document Header** | A structured block showing document title, number, issue date, due date, and reference. Each field can be shown/hidden individually. All fields are editable from the inspector. |
| **Notes**           | A labelled text area for general notes or instructions.                                                                                                                          |
| **Barcode**         | Placeholder for a barcode element.                                                                                                                                               |

### 💰 Financial

| Block               | Description                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Item Table**      | The main line-item table. Columns (No, Description, Qty, Unit Price, Discount, Tax, Total) can be shown/hidden, renamed, and reordered. Header background and text color are configurable. Supports empty rows and row numbers. |
| **Totals Block**    | Shows Subtotal, Discount, Tax, Grand Total, and Balance Due. Each line is individually toggleable. Tax rate and discount (fixed or %) are configurable per block. Supports per-block currency override.                         |
| **Amount in Words** | Spells out the total amount in words (e.g. "One Hundred Dollars").                                                                                                                                                              |

### ✍️ Footer / Signature

| Block              | Description                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Signature Line** | A signature area with a customizable label (e.g. "Authorized Signature") and an optional date placeholder.                |
| **Authorized By**  | Same as Signature Line — for dual-signature layouts.                                                                      |
| **Company Stamp**  | An image block styled for a stamp/seal.                                                                                   |
| **Stamp Box**      | A bordered empty box with a label (e.g. "Stamp" or "Received").                                                           |
| **Watermark**      | Large diagonal text overlay (e.g. DRAFT, PAID, COPY). Fully configurable text, size, color, and opacity.                  |
| **Bank Details**   | Displays bank name, account number, and account holder name. Section header and each field are individually configurable. |
| **Payment QR**     | A QR code image block with an optional label (e.g. "Scan to Pay").                                                        |

### 🖨️ Print

| Block                 | Description                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Cut Line**          | A dashed cut line with a "Cut Here" label, useful for receipt/voucher layouts. Hidden on print by default. |
| **Page Break**        | Forces a page break when printing/exporting to PDF.                                                        |
| **Carbon Copy Label** | A badge block for multi-copy layouts (e.g. ORIGINAL, COPY 1, COPY 2). Label text is editable.              |

### 📱 Mobile / Receipt

| Block              | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Receipt Header** | Centered block for small receipts — shows Shop/Store Name, Address, and Phone.           |
| **Receipt Footer** | Centered block for small receipts — shows a thank-you message and a policy/returns note. |

---

## 4. Inspector Panel — Tabs & Controls

When you click a block on the canvas, the right-side inspector panel opens. It has up to 6 tabs depending on the block type:

### 📋 Block Tab

Block-specific settings. Every block type that has unique content exposes it here:

- **Text** → Free text content area
- **Image / Company Stamp** → Upload or URL, fit mode (Contain / Cover / Stretch)
- **Divider** → Line thickness, style, color
- **Shape** → Shape type (Rectangle / Circle)
- **Signature Line / Authorized By** → Line label, show/hide date placeholder
- **Watermark** → Watermark text
- **Company Info** → Address, phone, email, website; custom fields (add/remove); show/hide each field
- **Client Info** → Client name, address, phone, email, tax ID; custom fields; show/hide each field; section header
- **Bank Details** → Section header, bank name, account number, account holder; show/hide fields
- **Payment QR** → Label, show/hide label, upload QR image
- **Document Header** → Title, document number, issue date, due date, reference; show/hide each field
- **Header Grid** → Column labels and content (multi-line, supports `{{variables}}`)
- **Totals Block** → Currency, tax rate, discount value/type; show/hide each financial row
- **Item Table** → Empty rows, body font size; header background & text color; show/hide header/borders/row numbers; column visibility, label, and width
- **Receipt Header** → Shop name, address, phone
- **Receipt Footer** → Thank you message, policy/note
- **Checkboxes Row** → Add/remove/rename options; toggle pre-checked state per option
- **Stamp Box** → Label text
- **Carbon Copy Label** → Label content text
- **Container** → Lock children toggle
- **Spacer** → Informational (resize via canvas handles)

### 🔤 Text Tab

Typography and styling for text-based blocks:

- **Content** — Edit text content, label, and value fields directly
- **Font Family** — Per-block font override (or inherit global)
- **Font Size** — 6 to 144 px
- **Font Weight** — Light, Normal, Medium, Semi-Bold, Bold, Extra-Bold
- **Text Color** — Color picker + hex input
- **Alignment** — Left, Center, Right, Justify
- **Line Height** — 0.5 to 3.0
- **Letter Spacing** — in px
- **Text Decoration** — None, Underline, Line-Through
- **Text Transform** — Normal, UPPERCASE, lowercase, Capitalize

### 🎨 Style Tab

Visual appearance controls, available for all blocks:

- **Background Color** — Color picker + hex input
- **Border** — Width, color, style (solid/dashed/dotted), radius
- **Shadow** — X offset, Y offset, blur radius, color
- **Padding** — Top, Right, Bottom, Left (in px)

### 📏 Layout Tab

Exact positioning and transform controls:

- **X / Y Position** — Pixel-accurate position on canvas
- **Width / Height** — Pixel-accurate dimensions
- **Rotation** — –180° to +180° with both number input and slider
- **Opacity** — 10% to 100% with slider
- **Lock Position** — Prevents dragging and resizing on canvas
- **Hide on Print** — Excludes the block from PDF/PNG exports and print output

### 📊 Data Tab

Available on **Item Table** blocks:

- Add, edit, and delete line items (rows)
- Each item: description, quantity, unit price, discount, tax, total (auto-calculated)

### 📜 History Tab

- Shows a timestamped list of all changes in the current session
- Click any history entry to jump back to that state

---

## 5. Preset Layouts (Document Types)

Selecting a document type from the top bar dropdown loads a professionally arranged preset layout. The following types have built-in presets:

| Document Type      | Description                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Invoice**        | Standard invoice with company info, client info, item table, totals, bank details, and signature |
| **Sale Order**     | Sales order layout with order details and delivery fields                                        |
| **Receipt**        | Receipt layout with payment checkboxes and thank you message                                     |
| **Quote**          | Quotation with terms and validity fields                                                         |
| **Delivery Note**  | Delivery note with shipped items and condition fields                                            |
| **Purchase Order** | PO layout with seller/buyer fields                                                               |
| **Credit Note**    | Credit note layout with refund details                                                           |
| **Custom**         | Blank canvas — build from scratch                                                                |

> **Note:** Switching document type shows a confirmation dialog. You can choose to load the preset or keep your current layout.

---

## 6. Save, Export & Import

### Save to Browser

- **Save** button → prompts for a template name → stores in browser `localStorage`
- Templates are persisted across page refreshes
- Saved as a full JSON schema including blocks, format, orientation, and settings

### Download as JSON

- From the Save dialog → "Save to Device" → downloads a `.json` file
- JSON schema can be re-imported later

### Export

| Format   | Details                                                                    |
| -------- | -------------------------------------------------------------------------- |
| **PDF**  | Exports the canvas as a print-quality PDF using the browser's print engine |
| **PNG**  | Exports the canvas as a PNG image                                          |
| **JSON** | Exports the full template schema as a downloadable `.json` file            |

### Import

- Accepts any `.json` file exported by Invoice Builder
- Restores blocks, paper format, orientation, fonts, currency, and document type

---

## 7. Language Translation

Invoice Builder has a built-in **one-click translation** between **English** and **Khmer** (ខ្មែរ).

### What it does

- Translates all text labels, content, and column headers on the canvas
- Switches the global font to **Noto Sans Khmer** (or back to Noto Sans)
- Switches currency between USD ↔ KHR automatically
- Covers: document title, field labels, table column headers, notes, terms, checkboxes, signature labels, stamp labels, header grid columns, carbon copy labels, watermark text

### Coverage

The translation map includes 80+ common document terms:

- Document types (Invoice, Receipt, Quote, Delivery Note, etc.)
- Field labels (Issue Date, Due Date, Bill To, Ship To, etc.)
- Financial terms (Subtotal, Tax, Discount, Grand Total, Balance Due, etc.)
- Table column labels (Description, Qty, Unit Price, Total, etc.)
- Payment terms (Cash, Transfer, Credit, Scan to Pay, etc.)
- Signature and footer labels

> The "Translate" button in the top bar automatically detects the current language and toggles to the other.

---

## 8. Keyboard Shortcuts

| Shortcut               | Action                        |
| ---------------------- | ----------------------------- |
| `Ctrl + Z`             | Undo                          |
| `Ctrl + Shift + Z`     | Redo                          |
| `Ctrl + P`             | Print                         |
| `Delete` / `Backspace` | Delete selected block         |
| `Ctrl + C`             | Copy selected block           |
| `Ctrl + V`             | Paste block                   |
| `Ctrl + D`             | Duplicate selected block      |
| `Arrow Keys`           | Nudge selected block by 1 px  |
| `Shift + Arrow Keys`   | Nudge selected block by 10 px |
| `Escape`               | Deselect / close menus        |

---

## 9. Data Binding System

Invoice Builder includes a schema-driven **data binding** system that connects visual blocks on the canvas to data fields from your POS system.

### How It Works

1. Each **document type** (Sale, Deposit, Receipt, etc.) defines its own **field schema** — a list of available data fields grouped by category (Document, Customer, Company, Financial, Items, etc.).
2. When you select a block and open the **Inspector → Data Tab**, you see all available fields for the current document type.
3. Pick a field to **bind** the block to that data source. The block now displays dynamic data instead of static content.

### Data Tab UI

| Control                 | Description                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document Type Badge** | Shows which document schema is active                                                                                                                          |
| **Field Selector**      | Dropdown grouped by category showing all available fields for the active document type. Incompatible fields (e.g., table fields for text blocks) are disabled. |
| **Field Path**          | Displays the dot-notation path of the bound field (e.g., `customer.name`)                                                                                      |
| **Type Badge**          | Shows the data type: `string`, `currency`, `date`, `number`, `table` — color-coded for quick identification                                                    |
| **Format Settings**     | Type-specific options appear when a field is bound: date format picker, currency selector, decimal precision, etc.                                             |
| **Preview**             | Shows a live preview of the resolved value using sample data                                                                                                   |
| **Clear Binding**       | Removes the binding and reverts to static content                                                                                                              |

### Schema Definitions

Field schemas are defined in `src/constants/documentSchemas.js`. Each schema specifies:

```js
{ key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' }
```

- `key` — Dot-notation path used to resolve data (e.g., `doc.number`, `totals.total`)
- `label` — Human-readable name shown in the Data Tab
- `group` — Category grouping for the dropdown
- `type` — Data type: `string`, `date`, `currency`, `number`, `table`

### Preview Mode

Toggle **Preview** in the toolbar to see how bound blocks will look with live data. The system resolves bindings against built-in sample data.

### POS Integration

When your POS system uses a template to generate a document:

```js
import { resolveBlockBinding } from "./utils/variableResolver.js";
import { DOCUMENT_SCHEMAS } from "./constants/documentSchemas.js";

// Your POS order data
const posData = {
  doc: { number: "INV-001", date: "2026-06-27" },
  customer: { name: "ABC Corp", address: "123 Main St" },
  company: { name: "Your Store", phone: "+855 12 345 678" },
  totals: { subtotal: 100.0, tax: 10.0, total: 110.0 },
  items: [{ description: "Widget", qty: 2, unit_price: 50.0, total: 100.0 }],
};

// Resolve bindings for each block
template.blocks.forEach((block) => {
  const resolved = resolveBlockBinding(block, posData, false);
  if (resolved !== null) {
    block.resolvedContent = Array.isArray(resolved)
      ? resolved
      : String(resolved);
  }
});
```

The exported template JSON includes all `dataBinding` info so your POS system can resolve fields with zero additional configuration.

### Adding Custom Document Types

To add a new document type for your POS:

1. Add a schema in `documentSchemas.js` with the fields your POS sends
2. Add a preset layout in `presets.js` with block positions and defaults
3. The document type appears automatically in the toolbar

---

## 10. History & Undo / Redo

- Every change that modifies the canvas is pushed to a history stack
- **Undo** (`Ctrl+Z`) steps backward through the stack
- **Redo** (`Ctrl+Shift+Z`) steps forward
- The **History Tab** in the inspector shows a full timestamped log of all recorded changes in the current session
- Clicking any history entry restores the canvas to that exact state
- History is stored in-memory (cleared on page refresh; use Save to persist your work)

---

## 11. Tech Stack (for developers)

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Framework        | Vue 3 (Composition API)                                |
| Build Tool       | Vite                                                   |
| State Management | Pinia                                                  |
| Icons            | Lucide Vue                                             |
| Fonts            | Google Fonts (Noto Sans, Inter, Roboto, Poppins, etc.) |
| Export           | Browser Print API (PDF/Print), Canvas API (PNG)        |
| Storage          | `localStorage` (template save/load)                    |
| Styling          | Vanilla CSS with CSS custom properties (design tokens) |

---

_Last updated: June 2026_
