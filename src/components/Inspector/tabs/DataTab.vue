<script setup>
import { ref, computed } from "vue";
import { useBlockStore } from "../../../stores/blocks.js";
import { useHistoryStore } from "../../../stores/history.js";
import { useSettingsStore } from "../../../stores/settings.js";
import { resolveBlockBinding, getFieldLabel, getNestedValue } from "../../../utils/variableResolver.js";
import { Upload } from "@lucide/vue";

const props = defineProps({
    block: { type: Object, required: true },
});

const blockStore = useBlockStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();

function getSchemaFields(documentType) {
    const schema = settingsStore.documentSchemas[documentType];
    if (!schema) return [];
    return schema.fields || [];
}

function getSchemaGroups(documentType) {
    const fields = getSchemaFields(documentType);
    return [...new Set(fields.map(f => f.group))];
}

const schemaFields = computed(() => {
    return getSchemaFields(settingsStore.documentType);
});

const schemaGroups = computed(() => {
    return getSchemaGroups(settingsStore.documentType);
});

const fieldsByGroup = computed(() => {
    const groups = {};
    for (const field of schemaFields.value) {
        const group = field.group || 'Other';
        if (!groups[group]) groups[group] = [];
        groups[group].push(field);
    }
    return groups;
});

const bindableFields = computed(() => {
    const type = props.block.type;
    if (type === 'image') {
        return schemaFields.value.filter(f => f.type === 'image');
    }
    return schemaFields.value;
});

const currentBinding = computed(() => {
    return props.block.dataBinding || { field: null, type: 'string', format: {} };
});

const resolvedPreview = computed(() => {
    if (!currentBinding.value?.field) return null;
    return resolveBlockBinding(props.block, null, true);
});

const fieldTypeHint = computed(() => {
    const field = currentBinding.value?.field;
    if (!field) return '';
    const found = schemaFields.value.find(f => f.key === field);
    return found ? found.type : 'string';
});

const formatOptions = computed(() => {
    const type = fieldTypeHint.value;
    const fmt = currentBinding.value?.format || {};
    switch (type) {
        case 'currency':
            return [
                { key: 'currency', label: 'Currency', value: fmt.currency || 'USD', type: 'text' },
                { key: 'decimals', label: 'Decimals', value: fmt.decimals ?? 2, type: 'number', min: 0, max: 4 },
            ];
        case 'date':
            return [
                { key: 'dateFormat', label: 'Format', value: fmt.dateFormat || 'DD/MM/YYYY', type: 'select',
                  options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD Mon YYYY', 'Mon DD, YYYY'] },
            ];
        case 'number':
            return [
                { key: 'decimals', label: 'Decimals', value: fmt.decimals ?? 2, type: 'number', min: 0, max: 6 },
            ];
        default:
            return [];
    }
});

function updateBinding(fieldKey) {
    if (!fieldKey) {
        blockStore.updateBlock(props.block.id, {
            dataBinding: { field: null, type: 'string', format: {} },
        });
        return;
    }
    const found = schemaFields.value.find(f => f.key === fieldKey);
    blockStore.updateBlock(props.block.id, {
        dataBinding: {
            field: fieldKey,
            type: found ? found.type : 'string',
            format: {},
        },
    });
}

function updateFormat(key, value) {
    const current = { ...(currentBinding.value?.format || {}) };
    current[key] = value;
    blockStore.updateBlock(props.block.id, {
        dataBinding: { ...currentBinding.value, format: current },
    });
    commitHistory();
}

function commitHistory() {
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

const fileInput = ref(null);

function triggerUpload() {
    if (fileInput.value) fileInput.value.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            blockStore.updateBlock(props.block.id, { src: event.target.result });
            commitHistory();
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
}

function clearImage() {
    blockStore.updateBlock(props.block.id, { src: null });
    commitHistory();
}

const hasBinding = computed(() => !!currentBinding.value?.field);
const showSampleData = ref(true);

const sampleDataRows = computed(() => {
    return schemaFields.value
        .filter(f => f.type !== 'table')
        .map(f => {
            const raw = getNestedValue(settingsStore.sampleData, f.key);
            const sampleValue = raw !== undefined && raw !== null
                ? String(raw)
                : '—';
            return {
                key: f.key,
                label: f.label,
                type: f.type,
                group: f.group,
                sampleValue,
                isBound: currentBinding.value?.field === f.key,
            };
        });
});

// Map of field.key → short sample value string for showing in <option> labels
const sampleValueMap = computed(() => {
    const map = {};
    for (const row of sampleDataRows.value) {
        // Truncate long values for select option labels
        const val = row.sampleValue;
        map[row.key] = val.length > 28 ? val.slice(0, 26) + '…' : val;
    }
    return map;
});

const sampleDataGroups = computed(() => {
    const groups = {};
    for (const row of sampleDataRows.value) {
        const group = row.group || 'Other';
        if (!groups[group]) groups[group] = [];
        groups[group].push(row);
    }
    return groups;
});

const itemProperties = computed(() => {
    const firstItem = settingsStore.sampleData.items?.[0] || {};
    const props = {};
    for (const [key, val] of Object.entries(firstItem)) {
        props[key] = typeof val;
    }
    return props;
});
</script>

<template>
    <div class="tab-panel">
        <div class="data-tab-content">
            <!-- Image upload section -->
            <template v-if="block.type === 'image'">
                <div class="field-group">
                    <div class="field-label">Upload Image</div>
                    <label
                        class="upload-btn"
                        @click.prevent="triggerUpload"
                    >
                        <Upload :size="16" />
                        <span>{{ block.src ? 'Replace Image' : 'Upload File' }}</span>
                    </label>
                    <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="handleFileUpload"
                    />
                </div>

                <div class="field-group">
                    <div class="field-label">Image URL</div>
                    <input
                        type="text"
                        :value="block.src ?? ''"
                        class="field-input"
                        placeholder="https://example.com/logo.png"
                        @input="blockStore.updateBlock(props.block.id, { src: $event.target.value })"
                        @blur="commitHistory"
                    />
                </div>

                <div v-if="block.src" class="field-group">
                    <div class="field-label">Preview</div>
                    <div class="image-preview-box">
                        <img :src="block.src" class="image-preview-thumb" />
                        <button class="clear-btn" @click="clearImage">Remove</button>
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">Fit Mode</div>
                    <select
                        :value="block.fitMode ?? 'contain'"
                        class="field-input"
                        @change="blockStore.updateBlock(props.block.id, { fitMode: $event.target.value }); commitHistory()"
                    >
                        <option value="contain">Contain (Keep Aspect Ratio)</option>
                        <option value="cover">Cover (Fill Block)</option>
                        <option value="fill">Stretch (Distort to Fit)</option>
                    </select>
                </div>

                <div class="divider" />
            </template>

            <!-- Document type info -->
            <div class="field-group" v-if="block.type !== 'image'">
                <div class="field-label">Document Type</div>
                <div class="doc-type-badge">{{ settingsStore.documentType }}</div>
            </div>

            <!-- Field selector -->
            <div v-if="block.type !== 'image'" class="field-group">
                <div class="field-label">Data Field</div>
                <select
                    class="field-select"
                    :value="currentBinding.field || ''"
                    @change="updateBinding($event.target.value)"
                >
                    <option value="">— No binding —</option>
                    <optgroup
                        v-for="(fields, group) in fieldsByGroup"
                        :key="group"
                        :label="group"
                    >
                        <option
                            v-for="field in fields"
                            :key="field.key"
                            :value="field.key"
                            :disabled="!bindableFields.some(f => f.key === field.key)"
                        >
                            {{ field.label }}
                            <template v-if="field.type !== 'string'"> ({{ field.type }})</template>
                            <template v-if="sampleValueMap[field.key]"> — {{ sampleValueMap[field.key] }}</template>
                        </option>
                    </optgroup>
                </select>

                <!-- Inline preview chip shown immediately after a field is selected -->
                <div v-if="hasBinding" class="binding-preview-chip">
                    <span class="binding-chip-icon">⚡</span>
                    <span class="binding-chip-path">{{ currentBinding.field }}</span>
                    <span class="binding-chip-sep">→</span>
                    <span class="binding-chip-value">
                        {{ resolvedPreview !== null ? resolvedPreview : '—' }}
                    </span>
                    <span class="binding-chip-type" :class="'type-' + fieldTypeHint">{{ fieldTypeHint }}</span>
                </div>
            </div>

            <!-- Format options -->
            <div v-if="hasBinding && formatOptions.length > 0 && block.type !== 'image'" class="field-group">
                <div class="field-label">Format Settings</div>
                <div
                    v-for="opt in formatOptions"
                    :key="opt.key"
                    class="format-row"
                >
                    <label class="format-label">{{ opt.label }}</label>
                    <select
                        v-if="opt.type === 'select'"
                        :value="opt.value"
                        class="format-select"
                        @change="updateFormat(opt.key, $event.target.value)"
                    >
                        <option
                            v-for="o in opt.options"
                            :key="o"
                            :value="o"
                        >
                            {{ o }}
                        </option>
                    </select>
                    <input
                        v-else-if="opt.type === 'number'"
                        type="number"
                        :value="opt.value"
                        :min="opt.min"
                        :max="opt.max"
                        class="format-input"
                        @change="updateFormat(opt.key, parseFloat($event.target.value) || 0)"
                    />
                    <input
                        v-else-if="opt.type === 'text'"
                        type="text"
                        :value="opt.value"
                        class="format-input"
                        @change="updateFormat(opt.key, $event.target.value)"
                    />
                </div>
            </div>

            <!-- Unbind button -->
            <button
                v-if="hasBinding && block.type !== 'image'"
                class="unbind-btn"
                @click="updateBinding(null); commitHistory()"
            >
                Clear Binding
            </button>

            <!-- Table-specific hint -->
            <template v-if="block.type === 'item_table'">
                <div class="divider" />
                <div class="field-group">
                    <div class="field-label">Columns Mapping</div>
                    <p class="hint-text">
                        Bind the table to a data field above, then configure columns
                        in the <strong>Block</strong> tab. The binding will provide
                        the rows; the column configuration controls display.
                    </p>
                    <p class="hint-text" style="margin-top: 8px;">
                        Each column ID should match a property key from the data
                        source.
                    </p>

                    <div style="margin-top: 10px; padding: 10px; background: var(--color-card-bg); border: 1px solid var(--color-panel-border); border-radius: 6px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--color-accent); margin-bottom: 6px; letter-spacing: 0.03em;">Available Data Keys:</div>
                        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto;">
                            <div v-for="(type, key) in itemProperties" :key="key" style="display: flex; justify-content: space-between; font-family: monospace; font-size: 10px; padding: 3px 6px; background: var(--color-workspace); border-radius: 3px;">
                                <span style="color: var(--color-panel-text); font-weight: bold;">{{ key }}</span>
                                <span style="color: var(--color-panel-muted); font-size: 9px; text-transform: uppercase;">{{ type }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Help section for first-time users -->
            <div v-if="!hasBinding && block.type !== 'image'" class="help-section">
                <div class="help-title">Quick Start: Bind a Field</div>
                <div class="help-step">
                    <span class="help-step-num">1</span>
                    <span class="help-step-text">Pick a document type from the toolbar (e.g. <strong>Sale</strong>, <strong>Receipt</strong>) — this determines which fields are available.</span>
                </div>
                <div class="help-step">
                    <span class="help-step-num">2</span>
                    <span class="help-step-text">Select a field from the dropdown below. Fields are grouped by category: <strong>Document</strong>, <strong>Customer</strong>, <strong>Company</strong>, <strong>Financial</strong>, etc.</span>
                </div>
                <div class="help-step">
                    <span class="help-step-num">3</span>
                    <span class="help-step-text">The block now displays sample data. Click the <strong>Preview</strong> button in the toolbar to toggle between design and live preview.</span>
                </div>
                <div class="help-step">
                    <span class="help-step-num">4</span>
                    <span class="help-step-text">Adjust format settings (currency, date format) below the field selector. Then save the template.</span>
                </div>
                <div class="help-tip">
                    <strong>💡 Need a different field?</strong> Switch the document type in the toolbar to see a different set of available fields.
                </div>
                <div class="help-tip">
                    <strong>🔗 What happens next?</strong> When your POS system generates an invoice using this template, each bound block automatically fills with the real data — no manual editing needed.
                </div>
            </div>

            <!-- Sample Data Preview toggle -->
            <template v-if="block.type !== 'image'">
            <div class="divider" />
            <div class="preview-toggle" @click="showSampleData = !showSampleData">
                <span class="preview-toggle-icon">{{ showSampleData ? '▼' : '▶' }}</span>
                <span class="preview-toggle-label">Sample Data Preview</span>
                <span class="preview-toggle-count">({{ sampleDataRows.length }} fields)</span>
            </div>

            <div v-if="showSampleData" class="sample-data-section">
                <div class="sample-data-hint">
                    Shows the data your POS will send for <strong>{{ settingsStore.documentType }}</strong>.
                    Highlighted rows are bound to the selected block.
                </div>
                <div
                    v-for="(rows, group) in sampleDataGroups"
                    :key="group"
                    class="sample-group"
                >
                    <div class="sample-group-label">{{ group }}</div>
                    <div
                        v-for="row in rows"
                        :key="row.key"
                        class="sample-row"
                        :class="{ 'sample-row-bound': row.isBound }"
                    >
                        <span class="sample-field">{{ row.label }}</span>
                        <span class="sample-value">{{ row.sampleValue }}</span>
                        <span class="sample-type">{{ row.type }}</span>
                    </div>
                </div>
                <div v-if="sampleDataRows.length === 0" class="no-fields">
                    No sample data for this document type.
                </div>
            </div>
            </template><!-- end v-if not image -->

            <!-- Instruction for non-bound blocks -->
            <div v-if="!hasBinding && bindableFields.length === 0 && block.type !== 'image'" class="no-fields">
                No data fields available for this document type.
            </div>
        </div>
    </div>
</template>

<style scoped>
.tab-panel {
    display: flex;
    flex-direction: column;
}

.data-tab-content {
    padding: 12px;
}

.field-group {
    margin-bottom: 14px;
}

.field-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-panel-muted);
    margin-bottom: 6px;
}

.doc-type-badge {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-accent);
    background: var(--color-accent-dim);
    padding: 4px 10px;
    border-radius: 4px;
    display: inline-block;
}

.field-select {
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    background: var(--color-panel-input);
    color: var(--color-text);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
}

.field-select:focus {
    border-color: var(--color-accent);
}

.field-path {
    font-size: 11px;
    font-family: monospace;
    color: var(--color-text);
    background: var(--color-panel-input);
    padding: 4px 8px;
    border-radius: 3px;
    word-break: break-all;
}

.field-type-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    margin-top: 4px;
}

.field-type-badge.string { background: #e0f2fe; color: #0369a1; }
.field-type-badge.date { background: #fef3c7; color: #92400e; }
.field-type-badge.currency { background: #d1fae5; color: #065f46; }
.field-type-badge.number { background: #ede9fe; color: #5b21b6; }
.field-type-badge.table { background: #fce7f3; color: #9d174d; }

.format-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.format-label {
    font-size: 11px;
    color: var(--color-text);
    min-width: 70px;
    flex-shrink: 0;
}

.format-select,
.format-input {
    flex: 1;
    padding: 4px 6px;
    font-size: 11px;
    background: var(--color-panel-input);
    color: var(--color-text);
    border: 1px solid var(--color-panel-border);
    border-radius: 3px;
    outline: none;
    box-sizing: border-box;
}

.format-select:focus,
.format-input:focus {
    border-color: var(--color-accent);
}

.preview-box {
    background: var(--color-panel-input);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    padding: 8px 10px;
    min-height: 28px;
    display: flex;
    align-items: center;
}

.preview-value {
    font-size: 13px;
    color: var(--color-text);
}

.preview-empty {
    font-size: 11px;
    color: var(--color-panel-muted);
    font-style: italic;
}

.unbind-btn {
    width: 100%;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    color: #ef4444;
    background: transparent;
    border: 1px solid #ef4444;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 4px;
}

.unbind-btn:hover {
    background: #fef2f2;
}

.divider {
    height: 1px;
    background: var(--color-panel-border);
    margin: 16px 0;
}

.hint-text {
    font-size: 11px;
    color: var(--color-panel-muted);
    line-height: 1.6;
    margin: 0;
}

.hint-text code {
    font-size: 10px;
    background: var(--color-panel-input);
    padding: 1px 4px;
    border-radius: 2px;
}

.no-fields {
    font-size: 11px;
    color: var(--color-panel-muted);
    text-align: center;
    padding: 20px 0;
    font-style: italic;
}

.help-section {
    background: var(--color-panel-input);
    border: 1px solid var(--color-panel-border);
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 14px;
}

.help-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-accent);
    margin-bottom: 12px;
}

.help-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
}

.help-step-num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
}

.help-step-text {
    font-size: 11px;
    color: var(--color-text);
    line-height: 1.6;
}

.help-tip {
    margin-top: 10px;
    padding: 8px 10px;
    background: rgba(0, 180, 216, 0.08);
    border-radius: 5px;
    font-size: 11px;
    color: var(--color-panel-muted);
    line-height: 1.5;
}

.help-tip strong {
    color: var(--color-accent);
}

.preview-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    margin-bottom: 8px;
    background: var(--color-panel-input);
    border: 1px solid var(--color-panel-border);
    border-radius: 5px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
}

.preview-toggle:hover {
    background: rgba(0, 180, 216, 0.06);
}

.preview-toggle-icon {
    font-size: 8px;
    color: var(--color-panel-muted);
}

.preview-toggle-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-accent);
    flex: 1;
}

.preview-toggle-count {
    font-size: 10px;
    color: var(--color-panel-muted);
}

.sample-data-section {
    padding: 0 2px;
}

.sample-data-hint {
    font-size: 10px;
    color: var(--color-panel-muted);
    margin-bottom: 10px;
    line-height: 1.5;
}

.sample-group {
    margin-bottom: 10px;
}

.sample-group-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-panel-muted);
    margin-bottom: 4px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--color-panel-border);
}

.sample-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 10px;
    transition: background 0.15s;
}

.sample-row-bound {
    background: rgba(0, 180, 216, 0.1);
    outline: 1px solid rgba(0, 180, 216, 0.25);
}

.sample-field {
    flex: 1;
    color: var(--color-text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sample-value {
    font-family: monospace;
    color: var(--color-accent);
    font-size: 10px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sample-type {
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-panel-muted);
    background: var(--color-panel-input);
    padding: 1px 4px;
    border-radius: 2px;
    flex-shrink: 0;
}

.upload-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    cursor: pointer;
    justify-content: center;
    border: 1px dashed var(--color-panel-border);
    padding: 12px;
    border-radius: 5px;
    font-size: 12px;
    color: var(--color-accent);
    background: transparent;
    transition: background 0.15s;
    box-sizing: border-box;
}
.upload-btn:hover {
    background: rgba(0, 180, 216, 0.06);
}

.field-input {
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    background: var(--color-panel-input);
    color: var(--color-text);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    outline: none;
    box-sizing: border-box;
}
.field-input:focus {
    border-color: var(--color-accent);
}

.image-preview-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-panel-input);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    padding: 8px 10px;
}
.image-preview-thumb {
    width: 60px;
    height: 60px;
    object-fit: contain;
    border-radius: 3px;
    background: rgba(0,0,0,0.1);
}
.clear-btn {
    font-size: 11px;
    color: #ef4444;
    background: transparent;
    border: 1px solid #ef4444;
    border-radius: 3px;
    padding: 3px 10px;
    cursor: pointer;
    transition: all 0.15s;
}
.clear-btn:hover {
    background: #fef2f2;
}

/* ── Binding preview chip (shown below the select after a field is picked) ── */
.binding-preview-chip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
    padding: 7px 10px;
    background: rgba(0, 180, 216, 0.07);
    border: 1px solid rgba(0, 180, 216, 0.25);
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.4;
    animation: chip-fade-in 0.18s ease;
}

@keyframes chip-fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}

.binding-chip-icon {
    font-size: 12px;
    flex-shrink: 0;
}

.binding-chip-path {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: var(--color-panel-muted);
    background: var(--color-panel-input);
    padding: 1px 5px;
    border-radius: 3px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.binding-chip-sep {
    color: var(--color-panel-muted);
    font-size: 10px;
}

.binding-chip-value {
    font-weight: 600;
    color: var(--color-accent);
    font-size: 11px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 130px;
}

.binding-chip-type {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 5px;
    border-radius: 3px;
    background: var(--color-panel-border);
    color: var(--color-panel-muted);
    flex-shrink: 0;
}
.binding-chip-type.type-currency  { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.binding-chip-type.type-number    { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
.binding-chip-type.type-date      { background: rgba(245, 158, 11, 0.15); color: #d97706; }
.binding-chip-type.type-string    { background: rgba(0, 180, 216, 0.12); color: var(--color-accent); }
</style>
