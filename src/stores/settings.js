import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { DOCUMENT_SCHEMAS } from "../constants/documentSchemas.js";
import { SAMPLE_DATA } from "../constants/variableFields.js";

const FONTS = [
  { name: "Noto Sans", value: '"Noto Sans", sans-serif' },
  { name: "Noto Sans Khmer", value: '"Noto Sans Khmer", sans-serif' },
  { name: "Battambang", value: '"Battambang", cursive' },
  { name: "Siemreap", value: '"Siemreap", cursive' },
  { name: "Nokora", value: '"Nokora", sans-serif' },
  { name: "Moul", value: '"Moul", cursive' },
  { name: "Angkor", value: '"Angkor", cursive' },
  { name: "Koulen", value: '"Koulen", cursive' },
  { name: "Taprom", value: '"Taprom", cursive' },
  { name: "Bayon", value: '"Bayon", sans-serif' },
  { name: "Inter", value: '"Inter", sans-serif' },
  { name: "Roboto", value: '"Roboto", sans-serif' },
  { name: "Open Sans", value: '"Open Sans", sans-serif' },
  { name: "Lato", value: '"Lato", sans-serif' },
  { name: "Poppins", value: '"Poppins", sans-serif' },
  { name: "Montserrat", value: '"Montserrat", sans-serif' },
  { name: "Source Sans 3", value: '"Source Sans 3", sans-serif' },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Times New Roman", value: '"Times New Roman", serif' },
];

export const useSettingsStore = defineStore("settings", () => {
  const documentType = ref("Custom");
  const globalFont = ref('"Noto Sans Khmer", "Noto Sans", sans-serif');
  const globalFontSize = ref(13);

  const fonts = ref(FONTS);

  const documentSchemas = ref(DOCUMENT_SCHEMAS);
  const sampleData = ref(SAMPLE_DATA);

  const documentTypes = computed(() => Object.keys(documentSchemas.value));

  function setDocumentType(type) {
    documentType.value = type;
  }
  function setGlobalFont(font) {
    globalFont.value = font;
  }
  function setGlobalFontSize(size) {
    globalFontSize.value = size;
  }

  function setDocumentSchemas(schemas) {
    documentSchemas.value = schemas;
    // Reset document type if it's no longer in the schema keys list
    if (schemas && !Object.keys(schemas).includes(documentType.value)) {
      documentType.value = Object.keys(schemas)[0] || "Custom";
    }
  }

  function setSampleData(data) {
    sampleData.value = data;
  }

  return {
    documentType,
    globalFont,
    globalFontSize,
    fonts,
    documentTypes,
    documentSchemas,
    sampleData,
    setDocumentType,
    setGlobalFont,
    setGlobalFontSize,
    setDocumentSchemas,
    setSampleData,
  };
});
