import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  PAPER_FORMATS,
  DEFAULT_FORMAT,
  DEFAULT_ORIENTATION,
  getFormatDimensions,
} from "../constants/paperFormats.js";

export const useCanvasStore = defineStore("canvas", () => {
  // Canvas instance (Fabric.js Canvas object)
  const fabricCanvas = ref(null);

  // Zoom and pan
  const zoom = ref(1);
  const panX = ref(0);
  const panY = ref(0);
  const isPanning = ref(false);

  // Paper format
  const formatId = ref(DEFAULT_FORMAT);
  const orientation = ref(DEFAULT_ORIENTATION);
  const paperFormats = ref(PAPER_FORMATS);

  // UI toggles
  const showRulers = ref(false);
  const showGrid = ref(false);
  const snapToGrid = ref(false);
  const gridSize = ref(10);
  const showAlignmentGuides = ref(true);
  const previewMode = ref(false);
  const fillMode = ref(false);
  const showPreview = ref(false);
  const editingBlockId = ref(null);
  // Zone being hovered during a block-drag (for cross-section visual feedback)
  const draggingToZone = ref(null);

  // Computed
  const paperDimensions = computed(() => {
    const fmt = paperFormats.value[formatId.value] ?? paperFormats.value.A4;
    if (!fmt) return { width: 794, height: 1123 };
    if (orientation.value === "landscape" && !fmt.isThermal) {
      return { width: fmt.height, height: fmt.width };
    }
    return { width: fmt.width, height: fmt.height };
  });

  const currentFormat = computed(() => paperFormats.value[formatId.value]);

  // Actions
  function setPaperFormats(formats) {
    paperFormats.value = formats;
    if (formats && !Object.keys(formats).includes(formatId.value)) {
      formatId.value = Object.keys(formats)[0] || "A4";
    }
  }

  function setFabricCanvas(canvas) {
    fabricCanvas.value = canvas;
  }

  function setZoom(val) {
    zoom.value = Math.min(Math.max(val, 0.1), 5);
    if (fabricCanvas.value) {
      fabricCanvas.value.setZoom(zoom.value);
      fabricCanvas.value.renderAll();
    }
  }

  function zoomIn() {
    setZoom(zoom.value + 0.1);
  }
  function zoomOut() {
    setZoom(zoom.value - 0.1);
  }
  function resetZoom() {
    setZoom(1);
  }

  function setPan(x, y) {
    panX.value = x;
    panY.value = y;
  }

  function setFormat(newFormatId) {
    formatId.value = newFormatId;
  }

  function setOrientation(newOrientation) {
    orientation.value = newOrientation;
  }

  function toggleOrientation() {
    orientation.value =
      orientation.value === "portrait" ? "landscape" : "portrait";
  }

  function togglePreviewMode() {
    previewMode.value = !previewMode.value;
  }

  function toggleFillMode() {
    fillMode.value = !fillMode.value;
  }

  function setFillMode(val) {
    fillMode.value = val;
  }

  return {
    fabricCanvas,
    zoom,
    panX,
    panY,
    isPanning,
    formatId,
    orientation,
    showRulers,
    showGrid,
    snapToGrid,
    gridSize,
    showAlignmentGuides,
    previewMode,
    fillMode,
    showPreview,
    editingBlockId,
    draggingToZone,
    paperDimensions,
    currentFormat,
    setFabricCanvas,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
    setFormat,
    setOrientation,
    toggleOrientation,
    togglePreviewMode,
    toggleFillMode,
    setFillMode,
    paperFormats,
    setPaperFormats,
  };
});
