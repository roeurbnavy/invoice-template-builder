import { BLOCK_TYPES } from './blockTypes.js'

/**
 * Layout presets for each of the 7 document types.
 * Positions (xPercent, yPercent) and sizes (widthPercent, heightPercent)
 * are specified as a fraction of the paper's total width and height.
 */
export const DOCUMENT_PRESETS = {
  'Invoice': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.60,
      yPercent: 0.05,
      widthPercent: 0.35,
      heightPercent: 0.05,
      defaultProps: {
        content: 'INVOICE',
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.11,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Invoice No:',
        value: 'INV-2026-0001',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.14,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Issue Date:',
        value: '23/06/2026',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.17,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Due Date:',
        value: '23/07/2026',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.CLIENT_INFO,
      xPercent: 0.05,
      yPercent: 0.18,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Bill To',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.32,
      widthPercent: 0.90,
      heightPercent: 0.22,
      defaultProps: {
        emptyRows: 3,
        showHeader: true,
        showBorders: true,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Description', width: 50, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit_price', label: 'Unit Price', width: 15, visible: true },
          { id: 'total', label: 'Total', width: 20, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.BANK_DETAILS,
      xPercent: 0.05,
      yPercent: 0.74,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Bank Details',
        showBankName: true,
        showAccountNo: true,
        showAccountName: true
      }
    },
    {
      type: BLOCK_TYPES.PAYMENT_QR,
      xPercent: 0.75,
      yPercent: 0.74,
      widthPercent: 0.20,
      heightPercent: 0.12,
      defaultProps: {
        label: 'Scan to Pay',
        showLabel: true
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.48,
      yPercent: 0.88,
      widthPercent: 0.47,
      heightPercent: 0.06,
      defaultProps: {
        label: 'Authorized Signature',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.05,
      yPercent: 0.95,
      widthPercent: 0.90,
      heightPercent: 0.03,
      defaultProps: {
        label: '',
        content: 'Thank you for your business!',
        textAlign: 'center',
        fontSize: 10
      }
    }
  ],

  'Sale Order': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.35,
      yPercent: 0.05,
      widthPercent: 0.30,
      heightPercent: 0.06,
      defaultProps: {
        content: 'SALE ORDER',
        textAlign: 'center',
        fontSize: 24
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.65,
      yPercent: 0.05,
      widthPercent: 0.30,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Order No:',
        value: 'SO-0001',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.65,
      yPercent: 0.08,
      widthPercent: 0.30,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Order Date:',
        value: '23/06/2026',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.65,
      yPercent: 0.11,
      widthPercent: 0.30,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Ref No:',
        value: 'REF-8877',
        labelWidth: 80,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.HEADER_GRID,
      xPercent: 0.05,
      yPercent: 0.17,
      widthPercent: 0.90,
      heightPercent: 0.12,
      defaultProps: {
        columns: [
          { label: 'Seller', content: '' },
          { label: 'Buyer', content: '' },
          { label: 'Order Details', content: 'Payment Mode: COD\nPrepared By: Sales Dept' }
        ]
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.31,
      widthPercent: 0.90,
      heightPercent: 0.22,
      defaultProps: {
        emptyRows: 3,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Description', width: 45, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit_price', label: 'Unit Price', width: 15, visible: true },
          { id: 'discount', label: 'Discount', width: 10, visible: true },
          { id: 'total', label: 'Total', width: 15, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.05,
      yPercent: 0.85,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Seller Representative',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.85,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Buyer Signature',
        showDate: true
      }
    }
  ],

  'Receipt': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.30,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        showLogo: false,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: false,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.30,
      yPercent: 0.14,
      widthPercent: 0.40,
      heightPercent: 0.04,
      defaultProps: {
        content: 'RECEIPT',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.30,
      yPercent: 0.19,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Receipt No:',
        value: 'REC-1002',
        labelWidth: 100,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.30,
      yPercent: 0.22,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Date:',
        value: '23/06/2026',
        labelWidth: 100,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.20,
      yPercent: 0.27,
      widthPercent: 0.60,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Received From:',
        value: 'Acme Corporation',
        labelWidth: 120,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.15,
      yPercent: 0.32,
      widthPercent: 0.70,
      heightPercent: 0.18,
      defaultProps: {
        emptyRows: 2,
        showRowNumbers: false,
        columns: [
          { id: 'description', label: 'Description', width: 70, visible: true },
          { id: 'total', label: 'Amount', width: 30, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.15,
      yPercent: 0.59,
      widthPercent: 0.70,
      heightPercent: 0.04,
      defaultProps: {
        label: 'Amount in Words:',
        value: 'One Thousand Forty-Five Dollars Only',
        labelWidth: 120,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.PAYMENT_QR,
      xPercent: 0.40,
      yPercent: 0.66,
      widthPercent: 0.20,
      heightPercent: 0.12,
      defaultProps: {
        label: 'Payment Receipt QR',
        showLabel: false
      }
    },
    {
      type: BLOCK_TYPES.THANK_YOU,
      xPercent: 0.20,
      yPercent: 0.81,
      widthPercent: 0.60,
      heightPercent: 0.05,
      defaultProps: {
        label: '',
        content: 'Thank you for your payment!',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.15,
      yPercent: 0.89,
      widthPercent: 0.70,
      heightPercent: 0.04,
      defaultProps: {
        label: '',
        content: 'This is a computer generated receipt and requires no physical signature.',
        textAlign: 'center',
        fontSize: 9
      }
    }
  ],

  'Quote': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.55,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.05,
      defaultProps: {
        content: 'QUOTATION',
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.11,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Quote No:',
        value: 'QT-0001',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.14,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Quote Date:',
        value: '23/06/2026',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.17,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Valid Until:',
        value: '07/07/2026',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.CLIENT_INFO,
      xPercent: 0.05,
      yPercent: 0.17,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Quote For',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.35,
      widthPercent: 0.90,
      heightPercent: 0.20,
      defaultProps: {
        emptyRows: 2,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Description', width: 45, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit_price', label: 'Unit Price', width: 15, visible: true },
          { id: 'discount', label: 'Discount', width: 10, visible: true },
          { id: 'total', label: 'Total', width: 15, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.TERMS,
      xPercent: 0.05,
      yPercent: 0.74,
      widthPercent: 0.45,
      heightPercent: 0.12,
      defaultProps: {
        label: 'Terms & Conditions',
        content: '1. Prices are subject to VAT.\n2. Delivery lead time: 2 weeks.\n3. Validity: 14 days from date of quote.'
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.78,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Prepared By (Sales Dept)',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.05,
      yPercent: 0.94,
      widthPercent: 0.90,
      heightPercent: 0.03,
      defaultProps: {
        label: '',
        content: 'For queries regarding this quote, contact us at hello@mycompany.com.',
        textAlign: 'center',
        fontSize: 10
      }
    }
  ],

  'Delivery Note': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.30,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.06,
      defaultProps: {
        content: 'DELIVERY NOTE',
        textAlign: 'center',
        fontSize: 24
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.72,
      yPercent: 0.05,
      widthPercent: 0.23,
      heightPercent: 0.03,
      defaultProps: {
        label: 'DN No:',
        value: 'DN-9988',
        labelWidth: 60,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.72,
      yPercent: 0.08,
      widthPercent: 0.23,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Date:',
        value: '23/06/2026',
        labelWidth: 60,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.72,
      yPercent: 0.11,
      widthPercent: 0.23,
      heightPercent: 0.03,
      defaultProps: {
        label: 'PO Ref:',
        value: 'PO-5544',
        labelWidth: 60,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.HEADER_GRID,
      xPercent: 0.05,
      yPercent: 0.16,
      widthPercent: 0.90,
      heightPercent: 0.12,
      defaultProps: {
        columns: [
          { label: 'Ship From', content: '' },
          { label: 'Ship To / Buyer', content: '' },
          { label: 'Delivery Details', content: 'Carrier: Speed Logistics\nTracking No: TRK-9981' }
        ]
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.30,
      widthPercent: 0.90,
      heightPercent: 0.22,
      defaultProps: {
        emptyRows: 3,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Item Description', width: 45, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit', label: 'Unit', width: 10, visible: true },
          { id: 'condition', label: 'Condition', width: 15, visible: true },
          { id: 'notes', label: 'Remarks', width: 15, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.05,
      yPercent: 0.66,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Delivered By (Driver)',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.66,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Received By (Customer)',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.76,
      widthPercent: 0.40,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Actual Delivery Date:',
        value: '___/___/2026',
        labelWidth: 140
      }
    }
  ],

  'Purchase Order': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.50,
      yPercent: 0.05,
      widthPercent: 0.45,
      heightPercent: 0.05,
      defaultProps: {
        content: 'PURCHASE ORDER',
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.11,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'PO Number:',
        value: 'PO-2026-0001',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.14,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Issue Date:',
        value: '23/06/2026',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.17,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Required By:',
        value: '15/07/2026',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.CLIENT_INFO,
      xPercent: 0.05,
      yPercent: 0.17,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Vendor / Supplier',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.HEADER_GRID,
      xPercent: 0.05,
      yPercent: 0.28,
      widthPercent: 0.90,
      heightPercent: 0.12,
      defaultProps: {
        columns: [
          { label: 'Bill To', content: '' },
          { label: 'Ship To', content: '' },
          { label: 'Payment Terms', content: 'Net 30 Days\nFOB Destination' }
        ]
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.42,
      widthPercent: 0.90,
      heightPercent: 0.22,
      defaultProps: {
        emptyRows: 3,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Item / Description', width: 40, visible: true },
          { id: 'sku', label: 'SKU / Part #', width: 15, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit_price', label: 'Unit Price', width: 15, visible: true },
          { id: 'total', label: 'Total', width: 15, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.TERMS,
      xPercent: 0.05,
      yPercent: 0.82,
      widthPercent: 0.45,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Instructions & Terms',
        content: 'Send invoices to: payable@company.com.\nEnsure PO number is marked on packaging.'
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.82,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Purchasing Manager Signature',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.05,
      yPercent: 0.94,
      widthPercent: 0.90,
      heightPercent: 0.03,
      defaultProps: {
        label: '',
        content: 'This purchase order is subject to company standard terms of purchase.',
        textAlign: 'center',
        fontSize: 9
      }
    }
  ],

  'Credit Note': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.05,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.50,
      yPercent: 0.05,
      widthPercent: 0.45,
      heightPercent: 0.05,
      defaultProps: {
        content: 'CREDIT NOTE',
        textAlign: 'right',
        color: '#e63946'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.11,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Credit Note No:',
        value: 'CRN-0001',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.14,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Date Issued:',
        value: '23/06/2026',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.50,
      yPercent: 0.17,
      widthPercent: 0.45,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Orig Invoice Ref:',
        value: 'INV-2026-0001',
        labelWidth: 100,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.CLIENT_INFO,
      xPercent: 0.05,
      yPercent: 0.17,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Credit To',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.05,
      yPercent: 0.28,
      widthPercent: 0.90,
      heightPercent: 0.04,
      defaultProps: {
        label: 'Reason for Credit:',
        value: 'Returned goods - damaged in transit',
        labelWidth: 120
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.34,
      widthPercent: 0.90,
      heightPercent: 0.22,
      defaultProps: {
        emptyRows: 2,
        columns: [
          { id: 'no', label: '#', width: 5, visible: true },
          { id: 'description', label: 'Item Description', width: 50, visible: true },
          { id: 'qty', label: 'Qty', width: 10, visible: true },
          { id: 'unit_price', label: 'Unit Price', width: 15, visible: true },
          { id: 'total', label: 'Credit Amt', width: 20, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.74,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Authorized Approval Signature',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.05,
      yPercent: 0.94,
      widthPercent: 0.90,
      heightPercent: 0.03,
      defaultProps: {
        label: '',
        content: 'For credit inquiries, please email support@mycompany.com.',
        textAlign: 'center',
        fontSize: 10
      }
    }
  ],

  'Deposit': [
    {
      type: BLOCK_TYPES.COMPANY_INFO,
      xPercent: 0.30,
      yPercent: 0.05,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: false,
        textAlign: 'center'
      }
    },
    {
      type: BLOCK_TYPES.DOCUMENT_TITLE,
      xPercent: 0.30,
      yPercent: 0.14,
      widthPercent: 0.40,
      heightPercent: 0.05,
      defaultProps: {
        content: 'DEPOSIT / PREPAYMENT',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.21,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Deposit No:',
        value: 'DEP-0001',
        labelWidth: 90,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.24,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Date:',
        value: '23/06/2026',
        labelWidth: 90,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.27,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Inv Ref:',
        value: 'INV-2026-0001',
        labelWidth: 90,
        textAlign: 'right'
      }
    },
    {
      type: BLOCK_TYPES.CLIENT_INFO,
      xPercent: 0.05,
      yPercent: 0.20,
      widthPercent: 0.40,
      heightPercent: 0.10,
      defaultProps: {
        label: 'Deposited By',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: false
      }
    },
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.33,
      widthPercent: 0.90,
      heightPercent: 0.20,
      defaultProps: {
        emptyRows: 2,
        showRowNumbers: false,
        columns: [
          { id: 'description', label: 'Description', width: 70, visible: true },
          { id: 'total', label: 'Amount', width: 30, visible: true }
        ]
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.05,
      yPercent: 0.75,
      widthPercent: 0.50,
      heightPercent: 0.03,
      defaultProps: {
        label: 'Payment Method:',
        value: 'Cash',
        labelWidth: 130
      }
    },
    {
      type: BLOCK_TYPES.BANK_DETAILS,
      xPercent: 0.05,
      yPercent: 0.80,
      widthPercent: 0.40,
      heightPercent: 0.08,
      defaultProps: {
        label: 'Deposit To',
        showBankName: true,
        showAccountNo: true,
        showAccountName: true
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.55,
      yPercent: 0.88,
      widthPercent: 0.40,
      heightPercent: 0.06,
      defaultProps: {
        label: 'Received By',
        showDate: true
      }
    },
    {
      type: BLOCK_TYPES.FOOTER_NOTE,
      xPercent: 0.05,
      yPercent: 0.95,
      widthPercent: 0.90,
      heightPercent: 0.03,
      defaultProps: {
        label: '',
        content: 'This deposit is non-refundable and will be applied to the final invoice.',
        textAlign: 'center',
        fontSize: 9
      }
    }
  ],

  'Khmer Invoice': [
    // Header Left
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.05,
      yPercent: 0.04,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'ឈ្មោះអតិថិជន :',
        value: 'ម៉ាក់ អូន ហ៊ិច',
        labelWidth: 35,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        dataBinding: { field: 'customer.name', type: 'string' }
      }
    },
    {
      type: BLOCK_TYPES.TEXT,
      xPercent: 0.05,
      yPercent: 0.07,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        content: 'Oun Gech',
        fontFamily: '"Noto Sans", sans-serif',
        fontSize: 11,
        color: '#555555',
        dataBinding: { field: 'customer.sub_name', type: 'string' }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.05,
      yPercent: 0.10,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'លេខសំគាល់ :',
        value: '029',
        labelWidth: 35,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        dataBinding: { field: 'doc.reference', type: 'string' }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.05,
      yPercent: 0.13,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'លេខទូរស័ព្ទ :',
        value: '',
        labelWidth: 35,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        dataBinding: { field: 'customer.phone', type: 'string' }
      }
    },

    // Stylized Center Title
    {
      type: BLOCK_TYPES.TEXT,
      xPercent: 0.42,
      yPercent: 0.04,
      widthPercent: 0.16,
      heightPercent: 0.06,
      defaultProps: {
        content: 'វិក្កយបត្រ',
        fontFamily: '"Moul", cursive',
        fontSize: 22,
        textAlign: 'center',
        color: '#000000'
      }
    },

    // Header Right
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.04,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'លេខវិក្កយបត្រ :',
        value: 'CS000064925',
        labelWidth: 45,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        dataBinding: { field: 'doc.number', type: 'string' }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.07,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'ថ្ងៃទី :',
        value: '23/06/2026',
        labelWidth: 45,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        dataBinding: { field: 'doc.date', type: 'date', format: { dateFormat: 'DD/MM/YYYY' } }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.60,
      yPercent: 0.10,
      widthPercent: 0.35,
      heightPercent: 0.03,
      defaultProps: {
        label: 'សំគាល់ :',
        value: '',
        labelWidth: 45,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        dataBinding: { field: 'doc.notes', type: 'string' }
      }
    },

    // Item Table
    {
      type: BLOCK_TYPES.ITEM_TABLE,
      xPercent: 0.05,
      yPercent: 0.18,
      widthPercent: 0.90,
      heightPercent: 0.36,
      defaultProps: {
        emptyRows: 9,
        showHeader: true,
        showBorders: true,
        showRowNumbers: false,
        headerBg: '#ffffff',
        headerColor: '#000000',
        bodyFontSize: 11,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        columns: [
          { id: 'no', label: 'ល.រ', width: 8, visible: true },
          { id: 'description', label: 'តារាងមុខទំនិញ', width: 50, visible: true },
          { id: 'qty', label: 'បរិមាណ', width: 14, visible: true },
          { id: 'unit_price', label: 'តម្លៃ', width: 14, visible: true },
          { id: 'total', label: 'តម្លៃសរុប', width: 14, visible: true }
        ],
        dataBinding: { field: 'items', type: 'table' }
      }
    },

    // Terms & Disclaimer (Bottom Left)
    {
      type: BLOCK_TYPES.TEXT,
      xPercent: 0.05,
      yPercent: 0.56,
      widthPercent: 0.45,
      heightPercent: 0.12,
      defaultProps: {
        content: 'សូមពិនិត្យទំនិញឱ្យបានត្រឹមត្រូវ និងគ្រប់ចំនួនមុនឡានចេញទៅ បើមានករណីបាត់បង់ ឬបែកបាក់យើងខ្ញុំមិនទទួលខុសត្រូវទេ',
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 11,
        color: '#000000',
        lineHeight: 1.6,
        textAlign: 'left'
      }
    },

    // Totals Grid Border Box (Bottom Right)
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.56,
      widthPercent: 0.40,
      heightPercent: 0.035,
      defaultProps: {
        label: 'សរុបទឹកប្រាក់',
        value: '388.94 $',
        labelWidth: 60,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 6,
        paddingRight: 6,
        dataBinding: { field: 'totals.total', type: 'currency' }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.595,
      widthPercent: 0.40,
      heightPercent: 0.035,
      defaultProps: {
        label: 'អត្រាប្តូរប្រាក់',
        value: '4,053 ៛',
        labelWidth: 60,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 6,
        paddingRight: 6,
        dataBinding: { field: 'totals.exchange_rate', type: 'string' }
      }
    },
    {
      type: BLOCK_TYPES.FIELD_ROW,
      xPercent: 0.55,
      yPercent: 0.63,
      widthPercent: 0.40,
      heightPercent: 0.035,
      defaultProps: {
        label: 'សរុបប្រាក់រៀល',
        value: '1,576,400 ៛',
        labelWidth: 60,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        labelFontWeight: 'bold',
        textAlign: 'right',
        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 6,
        paddingRight: 6,
        dataBinding: { field: 'totals.total_riel', type: 'string' }
      }
    },

    // Footer Signatures
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.05,
      yPercent: 0.72,
      widthPercent: 0.26,
      heightPercent: 0.12,
      defaultProps: {
        label: 'ឈ្មោះ និង ហត្ថលេខា អ្នកចេញចុង',
        showDate: false,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        textAlign: 'center',
        color: '#000000'
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.37,
      yPercent: 0.72,
      widthPercent: 0.26,
      heightPercent: 0.12,
      defaultProps: {
        label: 'ឈ្មោះ និង ហត្ថលេខា អ្នកដឹក',
        showDate: false,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        textAlign: 'center',
        color: '#000000'
      }
    },
    {
      type: BLOCK_TYPES.SIGNATURE_LINE,
      xPercent: 0.69,
      yPercent: 0.72,
      widthPercent: 0.26,
      heightPercent: 0.12,
      defaultProps: {
        label: 'ឈ្មោះ និង ហត្ថលេខា អ្នកទិញ',
        showDate: false,
        fontFamily: '"Noto Sans Khmer", sans-serif',
        fontSize: 12,
        textAlign: 'center',
        color: '#000000'
      }
    }
  ],

  'Custom': []
}
