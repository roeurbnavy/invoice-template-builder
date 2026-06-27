import InvoiceBuilder from "./App.vue";
import InvoiceRenderer from "./components/common/InvoiceRenderer.vue";
import { resolveBlockBinding, getFieldLabel } from "./utils/variableResolver.js";
import { useSettingsStore } from "./stores/settings.js";
import { useBlockStore } from "./stores/blocks.js";
import { useCanvasStore } from "./stores/canvas.js";

export {
  InvoiceBuilder,
  InvoiceRenderer,
  resolveBlockBinding,
  getFieldLabel,
  useSettingsStore,
  useBlockStore,
  useCanvasStore
};
