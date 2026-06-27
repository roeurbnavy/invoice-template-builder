// Document type field schemas
// Each schema defines the data fields available for binding when a user
// designs a template. The POS system sends data matching these schemas
// when rendering the final invoice.

export const DOCUMENT_SCHEMAS = {
  Sale: {
    label: 'Sale',
    description: 'Standard invoice / sale receipt',
    fields: [
      // Document
      { key: 'doc.number', label: 'Invoice No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Issue Date', group: 'Document', type: 'date' },
      { key: 'doc.due_date', label: 'Due Date', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Reference / PO No', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Notes', group: 'Document', type: 'string' },
      { key: 'doc.terms', label: 'Terms & Conditions', group: 'Document', type: 'string' },

      // Company
      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.email', label: 'Company Email', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },
      { key: 'company.website', label: 'Company Website', group: 'Company', type: 'string' },
      { key: 'company.tax_id', label: 'Company Tax ID', group: 'Company', type: 'string' },
      { key: 'company.bank_name', label: 'Bank Name', group: 'Company', type: 'string' },
      { key: 'company.account_no', label: 'Account Number', group: 'Company', type: 'string' },
      { key: 'company.account_name', label: 'Account Name', group: 'Company', type: 'string' },

      // Customer
      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.email', label: 'Customer Email', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },
      { key: 'customer.address', label: 'Customer Address', group: 'Customer', type: 'string' },
      { key: 'customer.tax_id', label: 'Customer Tax ID', group: 'Customer', type: 'string' },

      // Financial
      { key: 'totals.subtotal', label: 'Subtotal', group: 'Financial', type: 'currency' },
      { key: 'totals.discount', label: 'Discount', group: 'Financial', type: 'currency' },
      { key: 'totals.tax', label: 'Tax', group: 'Financial', type: 'currency' },
      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },
      { key: 'totals.balance', label: 'Balance Due', group: 'Financial', type: 'currency' },
      { key: 'totals.paid', label: 'Amount Paid', group: 'Financial', type: 'currency' },

      // Items (table)
      { key: 'items', label: 'Line Items', group: 'Items', type: 'table' },
    ],
  },

  'Sale Order': {
    label: 'Sale Order',
    description: 'Sales order with delivery details',
    fields: [
      { key: 'doc.number', label: 'Order No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Order Date', group: 'Document', type: 'date' },
      { key: 'doc.delivery_date', label: 'Expected Delivery', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Ref No', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Order Notes', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.email', label: 'Company Email', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.email', label: 'Customer Email', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },
      { key: 'customer.address', label: 'Customer Address', group: 'Customer', type: 'string' },

      { key: 'totals.subtotal', label: 'Subtotal', group: 'Financial', type: 'currency' },
      { key: 'totals.discount', label: 'Discount', group: 'Financial', type: 'currency' },
      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Order Items', group: 'Items', type: 'table' },
    ],
  },

  Receipt: {
    label: 'Receipt',
    description: 'Payment receipt',
    fields: [
      { key: 'doc.number', label: 'Receipt No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Date', group: 'Document', type: 'date' },
      { key: 'doc.notes', label: 'Notes', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },

      { key: 'payment.method', label: 'Payment Method', group: 'Payment', type: 'string' },
      { key: 'payment.amount', label: 'Paid Amount', group: 'Payment', type: 'currency' },
      { key: 'payment.change', label: 'Change', group: 'Payment', type: 'currency' },

      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Receipt Items', group: 'Items', type: 'table' },
    ],
  },

  Deposit: {
    label: 'Deposit',
    description: 'Deposit / prepayment receipt',
    fields: [
      { key: 'doc.number', label: 'Deposit No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Date', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Reference Invoice', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Notes', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
      { key: 'company.bank_name', label: 'Bank Name', group: 'Company', type: 'string' },
      { key: 'company.account_no', label: 'Account Number', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },

      { key: 'payment.method', label: 'Payment Method', group: 'Payment', type: 'string' },
      { key: 'payment.amount', label: 'Deposit Amount', group: 'Payment', type: 'currency' },

      { key: 'deposit.total', label: 'Total Amount', group: 'Deposit', type: 'currency' },
      { key: 'deposit.paid', label: 'Amount Paid', group: 'Deposit', type: 'currency' },
      { key: 'deposit.balance', label: 'Remaining Balance', group: 'Deposit', type: 'currency' },
    ],
  },

  Invoice: {
    label: 'Invoice',
    description: 'Standard invoice',
    fields: [
      { key: 'doc.number', label: 'Invoice No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Issue Date', group: 'Document', type: 'date' },
      { key: 'doc.due_date', label: 'Due Date', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Reference / PO No', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Notes', group: 'Document', type: 'string' },
      { key: 'doc.terms', label: 'Terms & Conditions', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.email', label: 'Company Email', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },
      { key: 'company.website', label: 'Company Website', group: 'Company', type: 'string' },
      { key: 'company.tax_id', label: 'Company Tax ID', group: 'Company', type: 'string' },
      { key: 'company.bank_name', label: 'Bank Name', group: 'Company', type: 'string' },
      { key: 'company.account_no', label: 'Account Number', group: 'Company', type: 'string' },
      { key: 'company.account_name', label: 'Account Name', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.email', label: 'Customer Email', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },
      { key: 'customer.address', label: 'Customer Address', group: 'Customer', type: 'string' },
      { key: 'customer.tax_id', label: 'Customer Tax ID', group: 'Customer', type: 'string' },

      { key: 'totals.subtotal', label: 'Subtotal', group: 'Financial', type: 'currency' },
      { key: 'totals.discount', label: 'Discount', group: 'Financial', type: 'currency' },
      { key: 'totals.tax', label: 'Tax', group: 'Financial', type: 'currency' },
      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },
      { key: 'totals.balance', label: 'Balance Due', group: 'Financial', type: 'currency' },
      { key: 'totals.paid', label: 'Amount Paid', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Line Items', group: 'Items', type: 'table' },
    ],
  },

  Quote: {
    label: 'Quote',
    description: 'Quotation',
    fields: [
      { key: 'doc.number', label: 'Quote No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Quote Date', group: 'Document', type: 'date' },
      { key: 'doc.valid_until', label: 'Valid Until', group: 'Document', type: 'date' },
      { key: 'doc.notes', label: 'Notes', group: 'Document', type: 'string' },
      { key: 'doc.terms', label: 'Terms & Conditions', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.email', label: 'Company Email', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.email', label: 'Customer Email', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },
      { key: 'customer.address', label: 'Customer Address', group: 'Customer', type: 'string' },

      { key: 'totals.subtotal', label: 'Subtotal', group: 'Financial', type: 'currency' },
      { key: 'totals.discount', label: 'Discount', group: 'Financial', type: 'currency' },
      { key: 'totals.tax', label: 'Tax', group: 'Financial', type: 'currency' },
      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Quote Items', group: 'Items', type: 'table' },
    ],
  },

  'Delivery Note': {
    label: 'Delivery Note',
    description: 'Delivery note with shipping details',
    fields: [
      { key: 'doc.number', label: 'DN No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Date', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'PO Ref', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Instructions', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.address', label: 'Delivery Address', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },

      { key: 'shipping.carrier', label: 'Carrier', group: 'Shipping', type: 'string' },
      { key: 'shipping.tracking', label: 'Tracking No', group: 'Shipping', type: 'string' },

      { key: 'items', label: 'Delivery Items', group: 'Items', type: 'table' },
    ],
  },

  'Purchase Order': {
    label: 'Purchase Order',
    description: 'Purchase order to vendor',
    fields: [
      { key: 'doc.number', label: 'PO Number', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Issue Date', group: 'Document', type: 'date' },
      { key: 'doc.required_date', label: 'Required By', group: 'Document', type: 'date' },
      { key: 'doc.notes', label: 'Instructions', group: 'Document', type: 'string' },
      { key: 'doc.terms', label: 'Terms', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },

      { key: 'vendor.name', label: 'Vendor Name', group: 'Vendor', type: 'string' },
      { key: 'vendor.email', label: 'Vendor Email', group: 'Vendor', type: 'string' },
      { key: 'vendor.phone', label: 'Vendor Phone', group: 'Vendor', type: 'string' },
      { key: 'vendor.address', label: 'Vendor Address', group: 'Vendor', type: 'string' },

      { key: 'totals.subtotal', label: 'Subtotal', group: 'Financial', type: 'currency' },
      { key: 'totals.tax', label: 'Tax', group: 'Financial', type: 'currency' },
      { key: 'totals.total', label: 'Grand Total', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Order Items', group: 'Items', type: 'table' },
    ],
  },

  'Credit Note': {
    label: 'Credit Note',
    description: 'Credit note / refund document',
    fields: [
      { key: 'doc.number', label: 'Credit Note No', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Date Issued', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Original Invoice Ref', group: 'Document', type: 'string' },
      { key: 'doc.reason', label: 'Reason for Credit', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Notice', group: 'Document', type: 'string' },

      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.email', label: 'Company Email', group: 'Company', type: 'string' },
      { key: 'company.address', label: 'Company Address', group: 'Company', type: 'string' },

      { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
      { key: 'customer.email', label: 'Customer Email', group: 'Customer', type: 'string' },

      { key: 'totals.total', label: 'Credit Amount', group: 'Financial', type: 'currency' },

      { key: 'items', label: 'Credit Items', group: 'Items', type: 'table' },
    ],
  },

  'Khmer Invoice': {
    label: 'Khmer Invoice (វិក្កយបត្រ)',
    description: 'Traditional Khmer invoice with dual currency (USD/KHR), exchange rate, and triple signature fields',
    fields: [
      // Document
      { key: 'doc.number', label: 'Invoice No (លេខវិក្កយបត្រ)', group: 'Document', type: 'string' },
      { key: 'doc.date', label: 'Date (ថ្ងៃទី)', group: 'Document', type: 'date' },
      { key: 'doc.reference', label: 'Reference No (លេខសំគាល់)', group: 'Document', type: 'string' },
      { key: 'doc.notes', label: 'Note (សំគាល់)', group: 'Document', type: 'string' },
      { key: 'doc.terms', label: 'Terms & Conditions', group: 'Document', type: 'string' },

      // Company
      { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
      { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },

      // Customer
      { key: 'customer.name', label: 'Customer Name (ឈ្មោះអតិថិជន)', group: 'Customer', type: 'string' },
      { key: 'customer.sub_name', label: 'Customer Sub-name (ឈ្មោះអតិថិជនភាសាអង់គ្លេស)', group: 'Customer', type: 'string' },
      { key: 'customer.phone', label: 'Customer Phone (លេខទូរស័ព្ទ)', group: 'Customer', type: 'string' },

      // Financial
      { key: 'totals.total', label: 'Grand Total USD (សរុបទឹកប្រាក់)', group: 'Financial', type: 'currency' },
      { key: 'totals.exchange_rate', label: 'Exchange Rate (អត្រាប្តូរប្រាក់)', group: 'Financial', type: 'string' },
      { key: 'totals.total_riel', label: 'Grand Total KHR (សរុបប្រាក់រៀល)', group: 'Financial', type: 'string' },

      // Items
      { key: 'items', label: 'Line Items (តារាងមុខទំនិញ)', group: 'Items', type: 'table' }
    ]
  },

  Custom: {
    label: 'Custom',
    description: 'Blank canvas',
    fields: [],
  },
}

// Get all available fields for a document type
export function getSchemaFields(documentType) {
  const schema = DOCUMENT_SCHEMAS[documentType]
  if (!schema) return []
  return schema.fields
}

// Get all unique field groups for a document type
export function getSchemaGroups(documentType) {
  const fields = getSchemaFields(documentType)
  return [...new Set(fields.map(f => f.group))]
}

// Get fields filtered by type
export function getSchemaFieldsByType(documentType, type) {
  return getSchemaFields(documentType).filter(f => f.type === type)
}

// Get fields appropriate for a given block type
export function getBindableFields(documentType, blockType) {
  const fields = getSchemaFields(documentType)
  switch (blockType) {
    case 'item_table':
    case 'table_builder':
      return fields.filter(f => f.type === 'table')
    case 'image':
      return fields.filter(f => f.type === 'image')
    default:
      return fields.filter(f => f.type !== 'table')
  }
}
