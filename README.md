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

## Data Binding & POS Integration

See [`FEATURES.md`](./FEATURES.md#9-data-binding-system) for full documentation.

Each document type defines a field schema in `src/constants/documentSchemas.js`. Blocks bound via the Inspector Data Tab store a `dataBinding` property. The exported template JSON can be consumed by a POS system using the utilities in `src/utils/variableResolver.js`.

### Quick POS Consumption

```js
const { resolveBlockBinding } = require('./utils/variableResolver')

template.blocks.forEach(block => {
  const resolved = resolveBlockBinding(block, posOrderData, false)
  if (resolved !== null) {
    block.resolvedContent = Array.isArray(resolved) ? resolved : String(resolved)
  }
})
```

## Document Types

| Type | Schema Fields |
|---|---|
| Sale | doc, customer, company, totals, items |
| Sale Order | doc, customer, company, totals, items, shipping |
| Deposit | doc, deposit, customer, payment, company, totals |
| Receipt | doc, receipt, customer, payment, company, totals, items |
| Quote | doc, customer, company, totals, items |
| Purchase Order | doc, vendor, company, totals, items, shipping |
| Delivery Note | doc, customer, company, totals, items, shipping |
| Credit Note | doc, customer, company, totals, items |
| Custom | (none — user-defined fields only) |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected block |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste block |
| `Ctrl+D` | Duplicate block |
| Arrow keys | Nudge 1px (Shift: 10px) |
| `Escape` | Deselect |
| `Ctrl+B/I/U` | Bold / Italic / Underline (in text edit mode) |

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** (build)
- **Pinia** (state management)
- **Lucide Vue** (icons)
- **Vanilla CSS** with custom properties
