# Invoice Builder

A visual drag-and-drop invoice and document template builder for the browser. Design professional invoices, receipts, quotes, purchase orders, and more — with live preview, data binding, and POS integration support.

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
npm run preview
```

## Features

- **Drag & drop canvas** — position, resize, rotate any block freely
- **25+ block types** — text, images, tables, signatures, QR codes, barcodes, dividers, watermarks, and more
- **Paper formats** — A4, A5, 58mm receipt, 80mm receipt, portrait or landscape
- **Per-block styling** — font, color, border, shadow, padding, opacity, rotation
- **Rich text editing** — bold/italic/underline with inline toolbar and keyboard shortcuts
- **Document presets** — Invoice, Sale Order, Receipt, Quote, Delivery Note, Purchase Order, Credit Note, Deposit
- **Data binding system** — bind any block to a POS data field via the Inspector Data Tab (schema-driven, per-document-type)
- **Preview mode** — see bound blocks rendered with sample data before printing
- **Item table per-column config** — custom data keys, format (text/number/currency), bold toggle, empty row borders
- **Image blocks** — upload from file picker or URL, fit modes (contain/cover/stretch)
- **History & undo/redo** — full session history with visual timeline in the Inspector
- **Print & export** — browser print dialog, PNG export

## Project Structure

```
src/
├── assets/            # Global CSS (design tokens, topbar, canvas)
├── components/
│   ├── Canvas/        # Canvas workspace, paper, block rendering
│   ├── Inspector/     # Right panel — Block, Text, Style, Layout, Data, History tabs
│   ├── Layout/        # Left panel — block library, preset loader
│   ├── TopBar/        # Global toolbar
│   ├── blocks/        # Individual block renderers (Text, Image, ItemTable, etc.)
│   └── common/        # Shared UI (PreviewModal, etc.)
├── constants/         # Block types, schemas, presets, sample data
├── stores/            # Pinia stores (canvas, blocks, settings, history)
└── utils/             # Helpers (block defaults, variable resolver, export)
```

## Package Installation & Usage

You can use this builder inside other POS subsystems or applications as a dynamic template builder. The builder supports runtime configuration injects for schemas, presets, and sample data.

### 1. Build and Export the Package

Build the package into the `dist/` bundle:

```bash
npm run build
```

### 2. Integration inside your Parent POS

Import the component and pass your custom schemas, sample data, presets, or saved templates:

```vue
<script setup>
import { ref } from "vue";
import InvoiceBuilder from "@my-pos/invoice-builder";
import "@my-pos/invoice-builder/dist/assets/index.css";

// 1. Define custom document schemas for this client/company
const clientSchemas = ref({
  borrowing: {
    label: "Borrowing Note",
    description: "Borrowing item transaction tracking",
    fields: [
      {
        key: "doc.number",
        label: "Note Number",
        group: "Document",
        type: "string",
      },
      {
        key: "borrower.name",
        label: "Borrower Name",
        group: "Borrower",
        type: "string",
      },
      { key: "items", label: "Borrow Items", group: "Items", type: "table" },
    ],
  },
  Payback: {
    label: "Payback Note",
    description: "Item return tracking",
    fields: [
      {
        key: "doc.number",
        label: "Note Number",
        group: "Document",
        type: "string",
      },
      { key: "items", label: "Returned Items", group: "Items", type: "table" },
    ],
  },
});

// 2. Define corresponding sample data for real-time design preview
const clientSampleData = ref({
  doc: { number: "BOR-2026-0099" },
  borrower: { name: "John Doe" },
  items: [{ no: 1, description: "Power Drill X1", qty: 1 }],
});

// 3. (Optional) Custom layout coordinates percentage-based presets
const clientPresets = ref({
  borrowing: [
    {
      type: "text",
      xPercent: 0.1,
      yPercent: 0.1,
      widthPercent: 0.8,
      heightPercent: 0.1,
      defaultProps: { content: "BORROWING TEMPLATE" },
    },
  ],
});

// 4. Initial blocks if loading a previously saved template
const savedBlocks = ref([]);

// 5. (Optional) Custom selectable fonts & paper formats
const customFonts = ref([
  { name: "Roboto", value: '"Roboto", sans-serif' },
  { name: "Lora", value: '"Lora", serif' },
]);
const customFormats = ref({
  A4: {
    id: "A4",
    label: "A4 Standard",
    width: 794,
    height: 1123,
    isThermal: false,
  },
  RECEIPT_80: {
    id: "RECEIPT_80",
    label: "80mm Thermal",
    width: 302,
    height: 1512,
    isThermal: true,
  },
});

function handleSave(event) {
  console.log("Saved Template Blocks JSON Configuration:", event);
}
</script>

<template>
  <InvoiceBuilder
    :schemas="clientSchemas"
    :sampleData="clientSampleData"
    :presets="clientPresets"
    :initialBlocks="savedBlocks"
    :fonts="customFonts"
    :paperFormats="customFormats"
    @save="handleSave"
  />
</template>
```

## Rendering Designed Templates with Real POS Data

Once you design a template and save its JSON blocks configuration, you have two primary methods to render the final document with real live POS transaction data:

### Method 1: Browser-Based Live Rendering (Vue + Pinia)

If you want to render the template inside a Vue preview window or show a print modal populated with a real transaction:

1. Import the Pinia `useSettingsStore`.
2. Populate the store's `sampleData` state with the **real transaction data** before opening/mounting the preview mode.
3. The block components will automatically listen reactively, resolve the paths, and display the final values.

```javascript
import { useSettingsStore } from "./stores/settings.js";
import { useCanvasStore } from "./stores/canvas.js";

const settingsStore = useSettingsStore();
const canvasStore = useCanvasStore();

// 1. Inject the live POS data into the Pinia state
settingsStore.setSampleData({
  doc: {
    number: "INV-2026-9876",
    date: "2026-06-27",
    notes: "Thank you for shopping with us!",
  },
  company: {
    name: "Acme Distribution Center",
    phone: "+1 (555) 987-6543",
  },
  customer: {
    name: "John Doe",
  },
  totals: {
    subtotal: 1045.0,
    discount: 45.0,
    total: 1000.0,
  },
  items: [
    {
      no: 1,
      description: "Wireless Keyboard",
      qty: 2,
      unit_price: 25.0,
      total: 50.0,
    },
    {
      no: 2,
      description: "Ergonomic Monitor Mount",
      qty: 1,
      unit_price: 950.0,
      total: 950.0,
    },
  ],
});

// 2. Open the Preview / Print modal
canvasStore.previewMode = true;
canvasStore.showPreview = true;
```

---

### Method 2: Programmatic Headless Rendering (Node.js / Backend)

If you need to generate PDFs, emails, or thermal receipt printer print commands (ESC/POS) on your server without mounting a visual canvas:

Use the lightweight, framework-agnostic helper functions inside `src/utils/variableResolver.js` to map your JSON blocks:

```javascript
import { resolveBlockBinding } from "./utils/variableResolver.js";

// Load your template blocks configuration
const templateBlocks = savedTemplate.blocks; // JSON Array

// Loop and resolve variables
templateBlocks.forEach((block) => {
  // Resolve binding against real posData
  const resolved = resolveBlockBinding(block, realLivePosData, false);

  if (resolved !== null) {
    // If the block is a text/label block
    block.resolvedContent = Array.isArray(resolved)
      ? resolved
      : String(resolved);
  }
});

// Now you can render 'templateBlocks' to HTML/Canvas/PDF using coordinates (block.x, block.y)
```

---

### Method 3: Direct Printing from POS Screens (e.g., Customer/Vendor Center)

When a user clicks **"Print"** or **"Print A5"** next to a transaction row in your Customer or Vendor Center, you can render the template off-screen and trigger the print dialog instantly:

1. **Create a temporary hidden container** (or iframe) in your DOM.
2. **Mount the `InvoiceRenderer`** inside it, passing the saved template configuration and the clicked row's live data.
3. **Trigger printing** using CSS print styles.

```vue
<!-- PrintWrapper.vue (Inside your POS system) -->
<script setup>
import { ref } from "vue";
import { useSettingsStore } from "@my-pos/invoice-builder";
import InvoiceRenderer from "@my-pos/invoice-builder/renderer";

const props = defineProps({
  templateBlocks: Array,
  transactionData: Object,
  paperFormat: String, // e.g., 'A5'
});

const isPrinting = ref(false);

function printDocument() {
  isPrinting.value = true;

  // Set store data
  const settingsStore = useSettingsStore();
  settingsStore.setSampleData(props.transactionData);

  // Wait for DOM update, then print
  setTimeout(() => {
    window.print();
    isPrinting.value = false;
  }, 100);
}
</script>

<template>
  <!-- Hidden on screen, visible only during print media query -->
  <div class="print-only-container">
    <InvoiceRenderer
      :blocks="templateBlocks"
      :data="transactionData"
      :formatId="paperFormat"
    />
  </div>
</template>

<style>
/* CSS to display the template only when printing */
@media screen {
  .print-only-container {
    display: none;
  }
}
@media print {
  body > *:not(.print-only-container) {
    display: none !important;
  }
  .print-only-container {
    display: block !important;
  }
}
</style>
```

---

### Method 4: Integrating with POS Custom / Native Print Functions

If your POS system uses a **custom hardware printing utility**, a **native thermal printer library (ESC/POS)**, or a **backend PDF engine**, you can extract the raw, fully resolved coordinates and formatted text values directly to feed into your printer function:

```javascript
import { resolveBlockBinding } from "@my-pos/invoice-builder/resolver";

/**
 * Prepares template blocks for custom printers by resolving data keys and formats
 * @param {Array} blocks - Saved blocks configuration
 * @param {Object} posData - Real transaction data from POS
 * @returns {Array} List of printable blocks with absolute positions and resolved text
 */
function getPrintableBlocks(blocks, posData) {
  return blocks
    .filter((block) => !block.hidden)
    .map((block) => {
      // 1. Resolve variables/bindings against real live POS transaction data
      const resolved = resolveBlockBinding(block, posData, false);

      return {
        id: block.id,
        type: block.type,
        // Absolute coordinates on page (for custom layout rendering)
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        rotation: block.rotation ?? 0,
        // Typography & colors
        fontFamily: block.fontFamily,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
        color: block.color,
        // Fully resolved content (formatted dates, currencies, decimals, etc.)
        content: resolved !== null ? String(resolved) : (block.content ?? ""),
      };
    });
}

// Example usage:
const printableItems = getPrintableBlocks(
  savedTemplate.blocks,
  currentTransaction,
);

// Feed this array directly to your POS custom thermal/laser printer driver:
myPosHardwarePrinter.printCustomLayout(printableItems);
```

## Document Types

| Type           | Schema Fields                                           |
| -------------- | ------------------------------------------------------- |
| Sale           | doc, customer, company, totals, items                   |
| Sale Order     | doc, customer, company, totals, items, shipping         |
| Deposit        | doc, deposit, customer, payment, company, totals        |
| Receipt        | doc, receipt, customer, payment, company, totals, items |
| Quote          | doc, customer, company, totals, items                   |
| Purchase Order | doc, vendor, company, totals, items, shipping           |
| Delivery Note  | doc, customer, company, totals, items, shipping         |
| Credit Note    | doc, customer, company, totals, items                   |
| Custom         | (none — user-defined fields only)                       |

## Keyboard Shortcuts

| Shortcut               | Action                                        |
| ---------------------- | --------------------------------------------- |
| `Ctrl+Z`               | Undo                                          |
| `Ctrl+Shift+Z`         | Redo                                          |
| `Delete` / `Backspace` | Delete selected block                         |
| `Ctrl+C` / `Ctrl+V`    | Copy / Paste block                            |
| `Ctrl+D`               | Duplicate block                               |
| Arrow keys             | Nudge 1px (Shift: 10px)                       |
| `Escape`               | Deselect                                      |
| `Ctrl+B/I/U`           | Bold / Italic / Underline (in text edit mode) |

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** (build)
- **Pinia** (state management)
- **Lucide Vue** (icons)
- **Vanilla CSS** with custom properties
