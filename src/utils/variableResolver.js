import { SAMPLE_DATA } from '../constants/variableFields.js'
import { DOCUMENT_SCHEMAS } from '../constants/documentSchemas.js'

/**
 * Resolve template variables in a string
 * e.g. "Invoice #{{invoice.number}}" → "Invoice #INV-2024-0001"
 */
export function resolveVariables(template, data = SAMPLE_DATA, previewMode = false) {
  if (!template || typeof template !== 'string') return template

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmed = path.trim()
    const value = getNestedValue(data, trimmed)
    if (value === undefined || value === null) {
      return previewMode ? `[${trimmed}]` : match
    }
    return String(value)
  })
}

/**
 * Get a nested value from an object using dot notation
 * e.g. getNestedValue(data, 'invoice.total') → 1045.00
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    return acc[key]
  }, obj)
}

/**
 * Format a value based on its type and format string
 */
export function formatValue(value, type, format = {}) {
  if (value === null || value === undefined) return ''

  switch (type) {
    case 'date':
      return formatDate(value, format.dateFormat)
    case 'number':
      return formatNumber(value, format)
    case 'currency':
      return formatCurrency(value, format)
    default:
      return String(value)
  }
}

function formatDate(value, dateFormat = 'DD/MM/YYYY') {
  try {
    const d = new Date(value)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return dateFormat
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
  } catch {
    return String(value)
  }
}

function formatNumber(value, { decimals = 2 } = {}) {
  const num = parseFloat(value)
  if (isNaN(num)) return String(value)
  const dec = Math.max(0, Math.min(10, decimals ?? 2))
  return num.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
}

function formatCurrency(value, { currency = 'USD', locale = 'en-US', decimals } = {}) {
  const num = parseFloat(value)
  if (isNaN(num)) return String(value)
  const dec = Math.max(0, Math.min(10, decimals ?? 2))
  // Standard ISO 4217 codes (3 uppercase letters) use Intl
  if (/^[A-Z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: dec, maximumFractionDigits: dec }).format(num)
    } catch {
      // fall through
    }
  }
  // Custom symbol: format number then prepend the symbol
  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
  return `${currency}${formatted}`
}

/**
 * Resolve a block's dataBinding against provided data.
 *
 * Design mode (previewMode=false, data=SAMPLE_DATA):
 *   shows a placeholder like `[Field Name]`
 * Preview mode (previewMode=true):
 *   resolves against SAMPLE_DATA
 * Production (previewMode=false, data=posData):
 *   resolves against real POS data
 */
export function resolveBlockBinding(block, data, previewMode = false) {
  const binding = block.dataBinding
  if (!binding || !binding.field) {
    return null
  }

  const resolvedData = data ?? SAMPLE_DATA
  const rawValue = getNestedValue(resolvedData, binding.field)

  if (rawValue === undefined || rawValue === null) {
    if (previewMode) {
      return `[${getFieldLabelForDoc(resolvedData, binding.field)}]`
    }
    return block.fallback ?? block.content ?? ''
  }

  if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    return String(rawValue)
  }

  if (Array.isArray(rawValue)) {
    return rawValue
  }

  return formatValue(rawValue, binding.type, binding.format)
}

/**
 * Get a user-friendly label for a field path, e.g. "customer.name" → "Customer Name"
 */
export function getFieldLabel(fieldKey) {
  if (!fieldKey) return ''
  const parts = fieldKey.split('.')
  return parts.map(p => p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' › ')
}

function getFieldLabelForDoc(data, fieldKey) {
  for (const schema of Object.values(DOCUMENT_SCHEMAS)) {
    const field = schema.fields.find(f => f.key === fieldKey)
    if (field) return field.label
  }
  return getFieldLabel(fieldKey)
}

export { SAMPLE_DATA }
