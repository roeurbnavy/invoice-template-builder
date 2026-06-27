import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DOCUMENT_SCHEMAS } from '../constants/documentSchemas.js'
import { SAMPLE_DATA } from '../constants/variableFields.js'

const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'THB', symbol: '฿',  name: 'Thai Baht' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
]

const FONTS = [
  { name: 'Noto Sans',       value: '"Noto Sans", sans-serif' },
  { name: 'Noto Sans Khmer', value: '"Noto Sans Khmer", sans-serif' },
  { name: 'Battambang',      value: '"Battambang", cursive' },
  { name: 'Siemreap',        value: '"Siemreap", cursive' },
  { name: 'Nokora',          value: '"Nokora", sans-serif' },
  { name: 'Moul',            value: '"Moul", cursive' },
  { name: 'Angkor',          value: '"Angkor", cursive' },
  { name: 'Koulen',          value: '"Koulen", cursive' },
  { name: 'Taprom',          value: '"Taprom", cursive' },
  { name: 'Bayon',           value: '"Bayon", sans-serif' },
  { name: 'Inter',           value: '"Inter", sans-serif' },
  { name: 'Roboto',          value: '"Roboto", sans-serif' },
  { name: 'Open Sans',       value: '"Open Sans", sans-serif' },
  { name: 'Lato',            value: '"Lato", sans-serif' },
  { name: 'Poppins',         value: '"Poppins", sans-serif' },
  { name: 'Montserrat',      value: '"Montserrat", sans-serif' },
  { name: 'Source Sans 3',   value: '"Source Sans 3", sans-serif' },
  { name: 'Georgia',         value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
]

export const useSettingsStore = defineStore('settings', () => {
  const company = ref('My Company')
  const documentType = ref('Custom')
  const currency = ref('USD')
  const globalFont = ref('"Noto Sans", sans-serif')
  const globalFontSize = ref(13)

  const currencies = ref(CURRENCIES)
  const fonts = ref(FONTS)
  
  const documentSchemas = ref(DOCUMENT_SCHEMAS)
  const sampleData = ref(SAMPLE_DATA)
  
  const documentTypes = computed(() => Object.keys(documentSchemas.value))

  function setCurrency(code) { currency.value = code }
  function setDocumentType(type) { documentType.value = type }
  function setGlobalFont(font) { globalFont.value = font }
  function setGlobalFontSize(size) { globalFontSize.value = size }
  function setCompany(name) { company.value = name }
  
  function setDocumentSchemas(schemas) {
    documentSchemas.value = schemas
    // Reset document type if it's no longer in the schema keys list
    if (schemas && !Object.keys(schemas).includes(documentType.value)) {
      documentType.value = Object.keys(schemas)[0] || 'Custom'
    }
  }
  
  function setSampleData(data) {
    sampleData.value = data
  }

  const currentCurrency = () => CURRENCIES.find(c => c.code === currency.value) ?? CURRENCIES[0]

  return {
    company, documentType, currency, globalFont, globalFontSize,
    currencies, fonts, documentTypes, documentSchemas, sampleData,
    setCurrency, setDocumentType, setGlobalFont, setGlobalFontSize, setCompany,
    setDocumentSchemas, setSampleData,
    currentCurrency,
  }
})
