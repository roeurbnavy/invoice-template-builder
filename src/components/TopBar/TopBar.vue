<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useSettingsStore } from "../../stores/settings.js";
import { useTemplateStore } from "../../stores/template.js";
import { useHistoryStore } from "../../stores/history.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useFormatMigration } from "../../composables/useFormatMigration.js";
import {
    FileText,
    Building2,
    RotateCcw,
    RotateCw,
    Save,
    Download,
    PenLine,
    Layout,
    ChevronDown,
    SwitchCamera,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Printer,
    Eye,
    EyeOff,
    Grid3x3,
    Sun,
    Moon,
} from "@lucide/vue";

import ConfirmModal from "../common/ConfirmModal.vue";

const canvasStore = useCanvasStore();
const settingsStore = useSettingsStore();
const templateStore = useTemplateStore();
const historyStore = useHistoryStore();
const blockStore = useBlockStore();
const { switchFormat, switchOrientation } = useFormatMigration();

const showConfirmModal = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmType = ref("warning");
const confirmCallback = ref(null);
const cancelCallback = ref(null);

function triggerConfirm(title, message, type, onConfirm, onCancel) {
    confirmTitle.value = title;
    confirmMessage.value = message;
    confirmType.value = type || "warning";
    confirmCallback.value = onConfirm;
    cancelCallback.value = onCancel;
    showConfirmModal.value = true;
}

function handleConfirmModal() {
    if (confirmCallback.value) confirmCallback.value();
    showConfirmModal.value = false;
}

function handleCancelModal() {
    if (cancelCallback.value) cancelCallback.value();
    showConfirmModal.value = false;
}

const showSaveModal = ref(false);
const saveName = ref(templateStore.currentTemplateName);

// ─── Export loading & toast ───────────────────────────────────
const toast = ref({ visible: false, message: "", type: "success" });
let toastTimer = null;

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    toast.value = { visible: true, message, type };
    toastTimer = setTimeout(() => {
        toast.value.visible = false;
    }, 3500);
}

// ─── Formats ─────────────────────────────────────────────────
const formats = ["A4", "A5", "RECEIPT_58", "RECEIPT_80"];
const formatLabels = {
    A4: "A4",
    A5: "A5",
    RECEIPT_58: "58mm",
    RECEIPT_80: "80mm",
};

// ─── Template Name Input Handlers ─────────────────────────────
function handleNameInput(val) {
    if (val.trim()) {
        templateStore.currentTemplateName = val;
    }
}

function handleNameBlur(e) {
    const val = e.target.value.trim();
    if (!val) {
        e.target.value = templateStore.currentTemplateName || "Untitled Template";
    } else {
        templateStore.currentTemplateName = val;
    }
    e.target.style.border = '1px dashed transparent';
    e.target.style.background = 'transparent';
}

// ─── Undo / Redo ─────────────────────────────────────────────
function handleUndo() {
    const snapshot = historyStore.undo();
    if (snapshot) blockStore.setBlocks(snapshot);
}
function handleRedo() {
    const snapshot = historyStore.redo();
    if (snapshot) blockStore.setBlocks(snapshot);
}

// ─── Save to browser (localStorage) ──────────────────────────
function handleSave() {
    saveName.value = templateStore.currentTemplateName;
    showSaveModal.value = true;
}

function confirmSave() {
    const schema = buildSchema(saveName.value);
    templateStore.saveTemplate(saveName.value, schema);
    showSaveModal.value = false;
    showToast(`✓ "${saveName.value}" saved to browser`, "success");
}

// ─── Save to device (download JSON) ──────────────────────────
function downloadJson() {
    const schema = buildSchema(
        saveName.value || templateStore.currentTemplateName,
    );
    templateStore.exportAsJson(schema);
    showSaveModal.value = false;
}

function buildSchema(name) {
    return {
        name,
        format: canvasStore.formatId,
        orientation: canvasStore.orientation,
        blocks: JSON.parse(JSON.stringify(blockStore.blocks)),
        settings: {
            globalFont: settingsStore.globalFont,
            globalFontSize: settingsStore.globalFontSize,
            currency: settingsStore.currency,
            documentType: settingsStore.documentType,
        },
    };
}

// ─── Print ───────────────────────────────────────────────────
async function handlePrint() {
    const backupZoom = canvasStore.zoom;
    const backupFillMode = canvasStore.fillMode;
    
    // Set zoom to 1 and disable fill mode for clean rendering
    canvasStore.setZoom(1);
    canvasStore.setFillMode(false);
    
    // Wait for Vue's next tick and a short timeout to let the browser compute the layout reflow
    await nextTick();
    await new Promise((r) => setTimeout(r, 150));
    
    window.print();
    
    // Restore state after print dialog closes
    setTimeout(() => {
        canvasStore.setZoom(backupZoom);
        canvasStore.setFillMode(backupFillMode);
    }, 500);
}

// ─── Document type & reset ────────────────────────────────────
function handleDocumentTypeChange(e) {
    const newType = e.target.value;
    if (blockStore.blocks.length === 0) {
        settingsStore.setDocumentType(newType);
        const { width, height } = canvasStore.paperDimensions;
        blockStore.loadPreset(newType, width, height);
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        return;
    }
    
    triggerConfirm(
        "Load Preset Layout",
        `Load default preset layout for "${newType}"? This will overwrite your current canvas.`,
        "warning",
        () => {
            settingsStore.setDocumentType(newType);
            const { width, height } = canvasStore.paperDimensions;
            blockStore.loadPreset(newType, width, height);
            historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        },
        () => {
            settingsStore.setDocumentType(newType);
        }
    );
}

function handleResetToDefault() {
    const currentType = settingsStore.documentType;
    triggerConfirm(
        "Reset Canvas",
        `Reset the canvas to the default layout for "${currentType}"? This will overwrite your current changes.`,
        "warning",
        () => {
            const { width, height } = canvasStore.paperDimensions;
            blockStore.loadPreset(currentType, width, height);
            historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
        }
    );
}

const isLightTheme = ref(false);

onMounted(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
        isLightTheme.value = true;
        document.body.classList.add("light");
    } else {
        isLightTheme.value = false;
        document.body.classList.remove("light");
    }
});

function toggleTheme() {
    isLightTheme.value = !isLightTheme.value;
    if (isLightTheme.value) {
        document.body.classList.add("light");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.remove("light");
        localStorage.setItem("theme", "dark");
    }
}
</script>

<template>
    <header class="topbar">
        <div class="topbar-scroll">
        <!-- Logo -->
        <div class="topbar-logo">
            <FileText :size="18" />
            <span>Invoice Builder</span>
        </div>

        <div class="topbar-sep" />

        <!-- Template Name Editor -->
        <div style="display: flex; align-items: center; gap: 4px;">
            <input
                type="text"
                :value="templateStore.currentTemplateName"
                class="inp"
                style="
                    background: transparent;
                    border: 1px dashed transparent;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--color-panel-text);
                    width: 140px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: all 0.15s ease;
                "
                placeholder="Template Name"
                title="Click to rename template"
                @input="handleNameInput($event.target.value)"
                @blur="handleNameBlur"
                @keydown.enter="$event.target.blur()"
                onfocus="this.style.border = '1px solid var(--color-panel-border)'; this.style.background = 'var(--color-input-bg)';"
            />
        </div>

        <div class="topbar-sep" />

        <!-- Document Type -->
        <select
            :value="settingsStore.documentType"
            class="topbar-select"
            @change="handleDocumentTypeChange"
        >
            <option
                v-for="dt in settingsStore.documentTypes"
                :key="dt"
                :value="dt"
            >
                {{ dt }}
            </option>
        </select>

        <!-- Font -->
        <select
            v-model="settingsStore.globalFont"
            class="topbar-select"
            style="width: 130px"
        >
            <option
                v-for="f in settingsStore.fonts"
                :key="f.value"
                :value="f.value"
            >
                {{ f.name }}
            </option>
        </select>

        <div class="topbar-sep" />

        <!-- Paper Formats -->
        <div class="format-toggle" style="display: flex; gap: 2px;">
            <button
                v-for="(val, key) in canvasStore.paperFormats"
                :key="key"
                class="format-btn"
                :class="{ active: canvasStore.formatId === key }"
                @click="switchFormat(key)"
            >
                {{ val.label || key }}
            </button>
        </div>

        <!-- Orientation Toggle -->
        <button
            class="btn btn-ghost btn-icon"
            data-tooltip="Toggle Orientation"
            @click="
                switchOrientation(
                    canvasStore.orientation === 'portrait'
                        ? 'landscape'
                        : 'portrait',
                )
            "
        >
            <SwitchCamera :size="14" />
        </button>

        <div class="topbar-sep" />

        <!-- Undo / Redo -->
        <button
            class="btn btn-ghost btn-icon"
            :class="{ 'opacity-40': !historyStore.canUndo }"
            data-tooltip="Undo (Ctrl+Z)"
            :disabled="!historyStore.canUndo"
            @click="handleUndo"
        >
            <RotateCcw :size="14" />
        </button>
        <button
            class="btn btn-ghost btn-icon"
            :class="{ 'opacity-40': !historyStore.canRedo }"
            data-tooltip="Redo (Ctrl+Shift+Z)"
            :disabled="!historyStore.canRedo"
            @click="handleRedo"
        >
            <RotateCw :size="14" />
        </button>

        <div class="topbar-sep" />

        <!-- Save to browser -->
        <button
            class="btn btn-ghost"
            data-tooltip="Save template changes (Local Storage)"
            @click="handleSave"
        >
            <Save :size="13" />
            Save
        </button>

        <!-- Reset to Default -->
        <button
            class="btn btn-ghost text-warning"
            data-tooltip="Reset to default preset"
            @click="handleResetToDefault"
        >
            <RefreshCw :size="13" />
            Reset
        </button>

        <!-- Ruler -->
        <button
            class="btn btn-ghost"
            :class="{ active: canvasStore.showRulers }"
            data-tooltip="Toggle Ruler"
            @click="canvasStore.showRulers = !canvasStore.showRulers"
        >
            <Layout :size="13" />
            Ruler
        </button>

        <!-- Grid -->
        <button
            class="btn btn-ghost"
            :class="{ active: canvasStore.showGrid }"
            data-tooltip="Toggle Grid"
            @click="canvasStore.showGrid = !canvasStore.showGrid"
        >
            <Grid3x3 :size="13" />
            Grid
        </button>

        <!-- Preview -->
        <button
            class="btn btn-ghost"
            data-tooltip="Preview rendered document (sample data)"
            @click="canvasStore.showPreview = true"
        >
            <Eye :size="13" />
            Preview
        </button>

        <!-- Print -->
        <button
            class="btn btn-ghost"
            data-tooltip="Print (Ctrl+P)"
            @click="handlePrint"
        >
            <Printer :size="13" />
            Print
        </button>

        <div class="topbar-sep" />

        <!-- Theme Toggle -->
        <button
            class="btn btn-ghost btn-icon"
            :data-tooltip="isLightTheme ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
            @click="toggleTheme"
        >
            <component :is="isLightTheme ? Moon : Sun" :size="13" />
        </button>

    </div></header>

    <!-- ─── Save Modal ─────────────────────────────────────── -->
    <Teleport to="body">
        <div
            v-if="showSaveModal"
            class="fixed inset-0 z-9999 flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.6)"
            @click.self="showSaveModal = false"
        >
            <div
                class="panel animate-fade-in"
                style="
                    border-radius: 12px;
                    padding: 24px;
                    width: 400px;
                    border: 1px solid var(--color-panel-border);
                "
            >
                <h3
                    style="
                        font-size: 15px;
                        font-weight: 600;
                        margin-bottom: 4px;
                    "
                >
                    Save Template
                </h3>
                <p
                    style="
                        font-size: 11px;
                        color: var(--color-panel-muted);
                        margin-bottom: 16px;
                    "
                >
                    "Save to Browser" stores the template in this browser
                    session. "Download .json" saves a file to your device.
                </p>
                <label class="field-label">Template Name</label>
                <input
                    v-model="saveName"
                    class="inp"
                    style="margin-bottom: 16px"
                    placeholder="My Invoice Template"
                />
                <div class="flex gap-2 justify-end">
                    <button
                        class="btn btn-ghost"
                        @click="showSaveModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="gap: 5px"
                        @click="downloadJson"
                    >
                        <Download :size="13" />
                        Download .json
                    </button>
                    <button
                        class="btn btn-accent"
                        style="gap: 5px"
                        @click="confirmSave"
                    >
                        <Save :size="13" />
                        Save to Browser
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- ─── Toast notification ────────────────────────────── -->
    <Teleport to="body">
        <div
            v-if="toast.visible"
            class="export-toast"
            :class="`export-toast--${toast.type}`"
        >
            {{ toast.message }}
        </div>
    </Teleport>

    <!-- ─── Confirmation Modal ────────────────────────────── -->
    <ConfirmModal
        :show="showConfirmModal"
        :title="confirmTitle"
        :message="confirmMessage"
        :type="confirmType"
        @confirm="handleConfirmModal"
        @cancel="handleCancelModal"
    />
</template>

<style scoped>
.spin {
    animation: spin 0.9s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.export-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    animation: toast-in 0.2s ease;
}
.export-toast--success {
    background: rgba(34, 197, 94, 0.92);
    color: #fff;
}
.export-toast--error {
    background: rgba(239, 68, 68, 0.92);
    color: #fff;
}
@keyframes toast-in {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}


</style>
