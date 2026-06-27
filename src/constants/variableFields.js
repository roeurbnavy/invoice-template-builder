// All available template variable fields
// These are shown in the Inspector → Data tab for binding
export const VARIABLE_FIELDS = [
  // Invoice
  { key: 'invoice.number',    label: 'Invoice Number',    group: 'Invoice',  type: 'string' },
  { key: 'invoice.date',      label: 'Issue Date',        group: 'Invoice',  type: 'date'   },
  { key: 'invoice.due_date',  label: 'Due Date',          group: 'Invoice',  type: 'date'   },
  { key: 'invoice.reference', label: 'Reference Number',  group: 'Invoice',  type: 'string' },
  { key: 'invoice.subtotal',  label: 'Subtotal',          group: 'Invoice',  type: 'number' },
  { key: 'invoice.discount',  label: 'Discount',          group: 'Invoice',  type: 'number' },
  { key: 'invoice.tax',       label: 'Tax Amount',        group: 'Invoice',  type: 'number' },
  { key: 'invoice.total',     label: 'Grand Total',       group: 'Invoice',  type: 'number' },
  { key: 'invoice.balance',   label: 'Balance Due',       group: 'Invoice',  type: 'number' },
  { key: 'invoice.paid',      label: 'Amount Paid',       group: 'Invoice',  type: 'number' },
  { key: 'invoice.notes',     label: 'Notes',             group: 'Invoice',  type: 'string' },
  { key: 'invoice.terms',     label: 'Terms & Conditions',group: 'Invoice',  type: 'string' },

  // Customer
  { key: 'customer.name',      label: 'Customer Name',     group: 'Customer', type: 'string' },
  { key: 'customer.email',     label: 'Customer Email',    group: 'Customer', type: 'string' },
  { key: 'customer.phone',     label: 'Customer Phone',    group: 'Customer', type: 'string' },
  { key: 'customer.address',   label: 'Customer Address',  group: 'Customer', type: 'string' },
  { key: 'customer.city',      label: 'Customer City',     group: 'Customer', type: 'string' },
  { key: 'customer.country',   label: 'Customer Country',  group: 'Customer', type: 'string' },
  { key: 'customer.tax_id',    label: 'Customer Tax ID',   group: 'Customer', type: 'string' },

  // Company
  { key: 'company.name',       label: 'Company Name',      group: 'Company',  type: 'string' },
  { key: 'company.email',      label: 'Company Email',     group: 'Company',  type: 'string' },
  { key: 'company.phone',      label: 'Company Phone',     group: 'Company',  type: 'string' },
  { key: 'company.address',    label: 'Company Address',   group: 'Company',  type: 'string' },
  { key: 'company.website',    label: 'Company Website',   group: 'Company',  type: 'string' },
  { key: 'company.tax_id',     label: 'Company Tax ID',    group: 'Company',  type: 'string' },
  { key: 'company.bank_name',  label: 'Bank Name',         group: 'Company',  type: 'string' },
  { key: 'company.account_no', label: 'Account Number',    group: 'Company',  type: 'string' },
  { key: 'company.account_name', label: 'Account Name',   group: 'Company',  type: 'string' },

  // Document meta
  { key: 'doc.type',           label: 'Document Type',     group: 'Document', type: 'string' },
  { key: 'doc.page_number',    label: 'Page Number',       group: 'Document', type: 'number' },
  { key: 'doc.total_pages',    label: 'Total Pages',       group: 'Document', type: 'number' },
]

export const VARIABLE_GROUPS = [...new Set(VARIABLE_FIELDS.map(f => f.group))]

// Sample data for preview mode
// Includes both old (invoice.*) and new (doc.* / totals.*) paths for backward compat
export const SAMPLE_DATA = {
  invoice: {
    number: 'INV-2024-0001',
    date: '2024-01-15',
    due_date: '2024-02-15',
    reference: 'PO-12345',
    subtotal: 1000.00,
    discount: 50.00,
    tax: 95.00,
    total: 1045.00,
    balance: 1045.00,
    paid: 0,
    notes: 'Thank you for your business.',
    terms: 'Payment is due within 30 days.',
  },
  doc: {
    type: 'Invoice',
    number: 'INV-2024-0001',
    date: '2024-01-15',
    due_date: '2024-02-15',
    reference: 'PO-12345',
    delivery_date: '2024-02-01',
    valid_until: '2024-02-15',
    required_date: '2024-02-15',
    reason: 'Returned goods - damaged in transit',
    notes: 'Thank you for your business.',
    terms: 'Payment is due within 30 days.',
    page_number: 1,
    total_pages: 1,
  },
  totals: {
    subtotal: 1000.00,
    discount: 50.00,
    tax: 95.00,
    total: 1045.00,
    balance: 1045.00,
    paid: 0,
  },
  deposit: {
    total: 2000.00,
    paid: 500.00,
    balance: 1500.00,
  },
  payment: {
    method: 'Cash',
    amount: 1045.00,
    change: 0,
  },
  shipping: {
    carrier: 'Speed Logistics',
    tracking: 'TRK-9981',
  },
  vendor: {
    name: 'Global Supplies Co.',
    email: 'orders@globalsupplies.com',
    phone: '+1 (555) 234-5678',
    address: '789 Supplier Blvd',
  },
  customer: {
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Suite 100',
    city: 'New York, NY 10001',
    country: 'United States',
    tax_id: 'US-TAX-123456',
  },
  company: {
    name: 'My Company Ltd.',
    email: 'hello@mycompany.com',
    phone: '+1 (555) 987-6543',
    address: '456 Business Ave',
    website: 'www.mycompany.com',
    tax_id: 'VAT-987654',
    bank_name: 'First National Bank',
    account_no: '1234-5678-9012',
    account_name: 'My Company Ltd.',
  },
  items: [
    { no: 1, description: 'Web Design Service', qty: 1, unit_price: 500.00, discount: 0, tax: 10, total: 500.00, amountAfterDiscount: 500.00 },
    { no: 2, description: 'Hosting (Annual)', qty: 1, unit_price: 300.00, discount: 0, tax: 10, total: 300.00, amountAfterDiscount: 300.00 },
    { no: 3, description: 'Domain Registration', qty: 1, unit_price: 200.00, discount: 0, tax: 10, total: 200.00, amountAfterDiscount: 200.00 },
  ],
}
