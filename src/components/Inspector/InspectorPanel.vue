<script setup>
import { computed, ref, onMounted } from "vue";

const panelWidth = ref(320);

onMounted(() => {
    const saved = localStorage.getItem("inspector_panel_width");
    if (saved) {
        panelWidth.value = parseInt(saved, 10) || 320;
    }
});

function startResize(e) {
    e.preventDefault();
    const startWidth = panelWidth.value;
    const startX = e.clientX;

    function doResize(moveEvent) {
        const deltaX = moveEvent.clientX - startX;
        panelWidth.value = Math.max(260, Math.min(600, startWidth - deltaX));
    }

    function stopResize() {
        window.removeEventListener("mousemove", doResize);
        window.removeEventListener("mouseup", stopResize);
        localStorage.setItem("inspector_panel_width", panelWidth.value.toString());
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
}
import { useBlockStore } from "../../stores/blocks.js";
import { useInspectorStore } from "../../stores/inspector.js";
import { useHistoryStore } from "../../stores/history.js";
import { useCanvasStore } from "../../stores/canvas.js";
import { useSettingsStore } from "../../stores/settings.js";
import {
    Settings,
    Lock,
    Unlock,
    Copy,
    Trash2,
    ChevronUp,
    ChevronDown,
    ChevronsUp,
    ChevronsDown,
} from "@lucide/vue";

// Import Tab Components
import LayoutTab from "./tabs/LayoutTab.vue";
import StyleTab from "./tabs/StyleTab.vue";
import TextTab from "./tabs/TextTab.vue";
import DataTab from "./tabs/DataTab.vue";
import BlockTab from "./tabs/BlockTab.vue";
import ResponsiveTab from "./tabs/ResponsiveTab.vue";
import HistoryTab from "./tabs/HistoryTab.vue";

const blockStore = useBlockStore();
const inspectorStore = useInspectorStore();
const historyStore = useHistoryStore();
const canvasStore = useCanvasStore();
const settingsStore = useSettingsStore();

const block = computed(() => blockStore.selectedBlock);
const isSelected = computed(() => !!block.value);
const isFillMode = computed(() => canvasStore.fillMode);

// Tabs configuration
const tabs = [
    { id: "layout", label: "Layout" },
    { id: "style", label: "Style" },
    { id: "text", label: "Text" },
    { id: "data", label: "Data" },
    { id: "block", label: "Block" },
    { id: "responsive", label: "Responsive" },
    { id: "history", label: "History" },
];

// Tab visibility checks based on block type
const visibleTabs = computed(() => {
    if (!isSelected.value) return [];
    const type = block.value.type;

    // Fill mode: only position/size and block content fields are relevant
    if (isFillMode.value) {
        return tabs.filter((tab) => ["layout", "block"].includes(tab.id));
    }

    return tabs.filter((tab) => {
        if (tab.id === "text") {
            return [
                "text",
                "field_row",
                "document_title",
                "document_number",
                "issue_date",
                "due_date",
                "reference_number",
                "terms",
                "footer_note",
                "thank_you",
                "signature_line",
                "company_info",
                "client_info",
                "bank_details",
                "watermark",
            ].includes(type);
        }
        if (tab.id === "data") {
            return !["signature_line", "spacer", "divider", "cut_line", "page_break", "carbon_copy_label"].includes(type);
        }
        if (tab.id === "block") {
            return [
                "item_table",
                "shape",
                "divider",
                "bank_details",
                "company_info",
                "client_info",
                "signature_line",
                "watermark",
                "checkboxes_row",
                "barcode",
                "header_grid",
                "container",
            ].includes(type);
        }
        return true;
    });
});

// Auto-correct active tab if it's hidden for the selected block
const activeTabId = computed(() => {
    const current = inspectorStore.activeTab;
    const visible = visibleTabs.value.map((t) => t.id);
    if (!visible.includes(current)) {
        return visible[0] || "layout";
    }
    return current;
});

const activeTabComponent = computed(() => {
    switch (activeTabId.value) {
        case "style":
            return StyleTab;
        case "text":
            return TextTab;
        case "data":
            return DataTab;
        case "block":
            return BlockTab;
        case "responsive":
            return ResponsiveTab;
        case "history":
            return HistoryTab;
        case "layout":
        default:
            return LayoutTab;
    }
});

// Actions
function toggleLock() {
    if (!block.value) return;
    blockStore.updateBlock(block.value.id, { locked: !block.value.locked });
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function handleDuplicate() {
    if (!block.value) return;
    const dup = blockStore.duplicateBlock(block.value.id);
    if (dup) {
        blockStore.selectBlock(dup.id);
        historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
    }
}

function handleDelete() {
    if (!block.value) return;
    blockStore.removeBlock(block.value.id);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function moveUp() {
    if (!block.value) return;
    blockStore.bringForward(block.value.id);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function moveDown() {
    if (!block.value) return;
    blockStore.sendBackward(block.value.id);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function moveToFront() {
    if (!block.value) return;
    blockStore.bringToFront(block.value.id);
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

const formatBlockName = (type) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
</script>

<template>
    <aside
        class="panel"
        :style="{
            width: panelWidth + 'px',
            position: 'relative',
            borderLeft: '1px solid var(--color-panel-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            flexShrink: 0,
        }"
    >
        <!-- Resize Handle -->
        <div
            class="inspector-resize-handle"
            style="
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                cursor: col-resize;
                z-index: 100;
                transition: background-color 0.2s;
            "
            @mousedown="startResize"
            @mouseover="$event.target.style.backgroundColor = 'rgba(0, 180, 216, 0.4)'"
            @mouseleave="$event.target.style.backgroundColor = 'transparent'"
        />
        <div class="panel-header">Inspector</div>

        <div
            v-if="isFillMode"
            style="
                padding: 6px 14px;
                background: rgba(0, 180, 216, 0.1);
                border-bottom: 1px solid rgba(0, 180, 216, 0.3);
                font-size: 10px;
                color: var(--color-accent);
                font-weight: 600;
                text-align: center;
                letter-spacing: 0.05em;
            "
        >
            ✏ FILL MODE — Click any block to type
        </div>

        <!-- Document Settings (when no block is selected) -->
        <div v-if="!isSelected" class="global-settings-panel" style="flex: 1; padding: 16px; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--color-panel-border); padding-bottom: 12px;">
                <Settings :size="18" class="text-panel-muted" />
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-panel-text);">Document Settings</h3>
            </div>
            
            <!-- Global Font Settings -->
            <div class="field-group" style="margin-bottom: 20px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 8px;">Typography</div>
                <div class="field-single" style="margin-bottom: 10px;">
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Global Font</label>
                    <select
                        :value="settingsStore.globalFont"
                        class="inp"
                        @change="settingsStore.setGlobalFont($event.target.value)"
                    >
                        <option
                            v-for="font in settingsStore.fonts"
                            :key="font.value"
                            :value="font.value"
                        >
                            {{ font.name }}
                        </option>
                    </select>
                </div>
                <div class="field-single">
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Global Font Size</label>
                    <div class="field-unit">
                        <input
                            type="number"
                            :value="settingsStore.globalFontSize"
                            class="inp"
                            min="8"
                            max="32"
                            @input="settingsStore.setGlobalFontSize(parseInt($event.target.value) || 12)"
                        />
                        <span class="field-unit-label">px</span>
                    </div>
                </div>
            </div>
        </div>


        <!-- Inspector Content -->
        <div
            v-else
            style="
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            "
        >
            <!-- Selected Block Header Info -->
            <div
                class="inspector-selected-header"
                style="
                    padding: 12px 14px;
                    border-bottom: 1px solid var(--color-panel-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                "
            >
                <div>
                    <span
                        style="
                            font-size: 11px;
                            color: var(--color-panel-muted);
                            font-weight: 600;
                            text-transform: uppercase;
                        "
                    >
                        {{ block.type }}
                    </span>
                    <h4
                        style="
                            font-size: 14px;
                            font-weight: 600;
                            color: var(--color-panel-text, #ffffff);
                            margin: 0;
                        "
                    >
                        {{ formatBlockName(block.type) }}
                    </h4>
                </div>

                <!-- Quick Actions -->
                <div style="display: flex; gap: 4px">
                    <!-- Lock/Unlock -->
                    <button
                        class="btn btn-ghost btn-icon"
                        :data-tooltip="
                            block.locked ? 'Unlock Block' : 'Lock Block'
                        "
                        @click="toggleLock"
                    >
                        <component
                            :is="block.locked ? Unlock : Lock"
                            :size="13"
                        />
                    </button>

                    <!-- Duplicate -->
                    <button
                        class="btn btn-ghost btn-icon"
                        data-tooltip="Duplicate Block"
                        :disabled="block.locked"
                        @click="handleDuplicate"
                    >
                        <Copy :size="13" />
                    </button>

                    <!-- Reordering -->
                    <button
                        class="btn btn-ghost btn-icon"
                        data-tooltip="Bring Forward"
                        :disabled="block.locked"
                        @click="moveUp"
                    >
                        <ChevronUp :size="13" />
                    </button>
                    <button
                        class="btn btn-ghost btn-icon"
                        data-tooltip="Send Backward"
                        :disabled="block.locked"
                        @click="moveDown"
                    >
                        <ChevronDown :size="13" />
                    </button>

                    <!-- Delete -->
                    <button
                        class="btn btn-ghost btn-icon text-danger"
                        data-tooltip="Delete Block"
                        @click="handleDelete"
                    >
                        <Trash2 :size="13" />
                    </button>
                </div>
            </div>

            <!-- Tab Buttons -->
            <div class="inspector-tabs">
                <button
                    v-for="tab in visibleTabs"
                    :key="tab.id"
                    class="inspector-tab"
                    :class="{ active: activeTabId === tab.id }"
                    @click="inspectorStore.setTab(tab.id)"
                >
                    {{ tab.label }}
                </button>
            </div>

            <!-- Active Tab Panel -->
            <div
                style="
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                "
            >
                <component :is="activeTabComponent" :block="block" />
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* Custom styled horizontal scrollbar for inspector tabs */
.inspector-tabs {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 180, 216, 0.3) transparent;
    padding-bottom: 8px; /* Extra padding to prevent scrollbar overlapping active tab background */
}

.inspector-tabs::-webkit-scrollbar {
    height: 4px;
}

.inspector-tabs::-webkit-scrollbar-track {
    background: transparent;
}

.inspector-tabs::-webkit-scrollbar-thumb {
    background: rgba(0, 180, 216, 0.35);
    border-radius: 2px;
    transition: background var(--transition-fast);
}

.inspector-tabs::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 180, 216, 0.6);
}
</style>
