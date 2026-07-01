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
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    FolderPlus,
    ChevronsLeftRight,
    ChevronsUpDown,
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
const hasMultiSelection = computed(() => blockStore.selectedIds.length > 1);

function handleGroup() {
    blockStore.groupSelected();
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

function handleDeleteSelected() {
    blockStore.removeSelected();
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

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

        <!-- Multiple Selection Panel -->
        <div v-if="hasMultiSelection" class="global-settings-panel" style="flex: 1; padding: 16px; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--color-panel-border); padding-bottom: 12px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-panel-text);">Selection ({{ blockStore.selectedIds.length }})</h3>
            </div>

            <!-- Alignment Tools Group -->
            <div class="field-group" style="margin-bottom: 24px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 12px;">Align Elements</div>
                
                <!-- Horizontal Align Row -->
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('left')"
                    >
                        <AlignLeft :size="15" />
                        <span>Left</span>
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('center')"
                    >
                        <AlignCenter :size="15" />
                        <span>Center</span>
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('right')"
                    >
                        <AlignRight :size="15" />
                        <span>Right</span>
                    </button>
                </div>

                <!-- Vertical Align Row -->
                <div style="display: flex; gap: 8px;">
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('top')"
                    >
                        <AlignStartVertical :size="15" />
                        <span>Top</span>
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('middle')"
                    >
                        <AlignCenterVertical :size="15" />
                        <span>Middle</span>
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        @click="blockStore.alignSelected('bottom')"
                    >
                        <AlignEndVertical :size="15" />
                        <span>Bottom</span>
                    </button>
                </div>
            </div>

            <!-- Distribute Spacing Group -->
            <div class="field-group" style="margin-bottom: 24px; border-top: 1px solid var(--color-panel-border); padding-top: 16px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 12px;">Distribute Spacing</div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        :disabled="blockStore.selectedIds.length < 3"
                        @click="blockStore.distributeSelected('horizontal')"
                    >
                        <ChevronsLeftRight :size="15" />
                        <span>Horizontal</span>
                    </button>
                    <button
                        class="btn btn-ghost"
                        style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; font-size: 10px;"
                        :disabled="blockStore.selectedIds.length < 3"
                        @click="blockStore.distributeSelected('vertical')"
                    >
                        <ChevronsUpDown :size="15" />
                        <span>Vertical</span>
                    </button>
                </div>
                <div v-if="blockStore.selectedIds.length < 3" style="font-size: 9.5px; color: var(--color-panel-muted); font-style: italic; text-align: center; margin-top: 4px;">
                    Select 3 or more blocks to distribute spacing
                </div>
            </div>

            <!-- Group Actions Group -->
            <div class="field-group" style="margin-bottom: 24px; border-top: 1px solid var(--color-panel-border); padding-top: 16px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 12px;">Bulk Actions</div>
                
                <button
                    class="btn btn-primary"
                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; padding: 10px; font-size: 11px;"
                    @click="handleGroup"
                >
                    <FolderPlus :size="14" />
                    <span>Group Selected</span>
                </button>

                <button
                    class="btn btn-ghost text-danger"
                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; font-size: 11px; border: 1px solid rgba(220, 53, 69, 0.25);"
                    @click="handleDeleteSelected"
                >
                    <Trash2 :size="14" />
                    <span>Delete Selection</span>
                </button>
            </div>
        </div>

        <!-- Document Settings (when no block is selected) -->
        <div v-else-if="!isSelected" class="global-settings-panel" style="flex: 1; padding: 16px; overflow-y: auto;">
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
            
            <!-- Canvas Layout Settings -->
            <div class="field-group" style="margin-bottom: 20px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 8px;">Canvas Layout</div>
                <div class="field-single">
                    <label style="font-size: 10px; color: var(--color-panel-muted); display: block; margin-bottom: 4px;">Layout Mode</label>
                    <select
                        :value="settingsStore.layoutMode"
                        class="inp"
                        @change="settingsStore.setLayoutMode($event.target.value)"
                    >
                        <option value="freeform">Freeform (Absolute)</option>
                        <option value="sections">Section Flow (Header/Summary/Footer)</option>
                    </select>
                    <div style="font-size: 10.5px; color: var(--color-panel-muted); margin-top: 8px; line-height: 1.45;">
                        ℹ️ <b>ប្លង់លំហូរតាមផ្នែក (Section Flow)៖</b> កម្ពស់ផ្នែកនីមួយៗនឹងលូតវែង ឬបង្រួមដោយស្វ័យប្រវត្តិតាមទីតាំងប្លុក។ បងអាចទាញប្លុកចុះក្រោម ដើម្បីពង្រីកកម្ពស់ផ្នែកនោះបាន។
                    </div>
                </div>
            </div>

            <!-- Page Repeat Settings -->
            <div class="field-group" style="margin-bottom: 20px;">
                <div class="field-label" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-panel-muted); margin-bottom: 8px;">📄 Page Repeat</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-weight: 500; display: block; font-size: 12px;">Repeat Header</span>
                            <span style="font-size: 10.5px; color: var(--color-panel-muted); line-height: 1.4;">Show header blocks on every page</span>
                        </div>
                        <label class="toggle">
                            <input
                                type="checkbox"
                                :checked="settingsStore.repeatHeader"
                                @change="settingsStore.setRepeatHeader($event.target.checked)"
                            />
                            <span class="toggle-track" />
                        </label>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-weight: 500; display: block; font-size: 12px;">Repeat Footer</span>
                            <span style="font-size: 10.5px; color: var(--color-panel-muted); line-height: 1.4;">Pin footer blocks on every page</span>
                        </div>
                        <label class="toggle">
                            <input
                                type="checkbox"
                                :checked="settingsStore.repeatFooter"
                                @change="settingsStore.setRepeatFooter($event.target.checked)"
                            />
                            <span class="toggle-track" />
                        </label>
                    </div>
                    <div v-if="settingsStore.repeatHeader || settingsStore.repeatFooter" style="font-size: 10px; color: var(--color-panel-muted); background: rgba(0,180,216,0.07); border-radius: 6px; padding: 7px 9px; line-height: 1.5; margin-top: 2px;">
                        ℹ️ Repeated blocks appear in Preview and Print. Table rows will automatically shrink to fit above/below the repeated sections.
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
