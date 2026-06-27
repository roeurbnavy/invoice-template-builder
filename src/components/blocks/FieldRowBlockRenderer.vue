<script setup>
import { computed } from "vue";
import { useBlockStore } from "../../stores/blocks.js";
import { useCanvasStore } from "../../stores/canvas.js";
import { resolveBlockBinding } from "../../utils/variableResolver.js";
import { getBorderStyle } from "../../utils/blockDefaults.js";

const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const blockStore = useBlockStore();
const canvasStore = useCanvasStore();

const displayValue = computed(() => {
    const binding = resolveBlockBinding(props.block, null, canvasStore.previewMode);
    if (binding !== null) return String(binding);
    return props.block.value ?? "";
});

const blockStyle = computed(() => ({
    fontFamily: props.block.fontFamily ?? 'inherit',
    fontSize: `${props.block.fontSize ?? 13}px`,
    color: props.block.color ?? '#000',
    backgroundColor: props.block.backgroundColor ?? 'transparent',
    ...getBorderStyle(props.block),
    borderRadius: `${props.block.borderRadius ?? 0}px`,
}));
</script>

<template>
    <div
        :style="{
            ...blockStyle,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '2px 4px',
            boxSizing: 'border-box',
            overflow: 'hidden',
        }"
    >
        <!-- Fill mode: editable inputs -->
        <template v-if="fillMode">
            <input
                type="text"
                :value="block.label ?? ''"
                :style="{
                    width: `${block.labelWidth ?? 40}%`,
                    flexShrink: 0,
                    marginRight: '8px',
                    fontFamily: block.fontFamily ?? 'inherit',
                    fontSize: `${block.fontSize ?? 13}px`,
                    fontWeight: block.labelFontWeight ?? 'bold',
                    color: block.color ?? '#000',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(0, 180, 216, 0.5)',
                    outline: 'none',
                    padding: '0 2px',
                    boxSizing: 'border-box',
                }"
                @input="
                    blockStore.updateBlock(block.id, {
                        label: $event.target.value,
                    })
                "
            />
            <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                <input
                    type="text"
                    :value="block.value ?? ''"
                    :style="{
                        flex: 1,
                        fontFamily: block.fontFamily ?? 'inherit',
                        fontSize: `${block.fontSize ?? 13}px`,
                        color: block.dataBinding?.field ? 'var(--color-accent)' : block.color ?? '#000',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: block.dataBinding?.field
                            ? '1px solid var(--color-accent)'
                            : '1px solid rgba(0, 180, 216, 0.5)',
                        outline: 'none',
                        padding: '0 2px',
                        boxSizing: 'border-box',
                    }"
                    @input="
                        blockStore.updateBlock(block.id, {
                            value: $event.target.value,
                        })
                    "
                />
                <span
                    v-if="block.dataBinding?.field"
                    :title="'Bound to: ' + block.dataBinding.field"
                    style="
                        font-size: 9px;
                        color: var(--color-accent);
                        cursor: help;
                        flex-shrink: 0;
                    "
                >⚡</span>
            </div>
        </template>

        <!-- Design mode: display spans -->
        <template v-else>
            <span
                :style="{
                    fontWeight: block.labelFontWeight ?? 'bold',
                    flexShrink: 0,
                    marginRight: '8px',
                    width: `${block.labelWidth ?? 40}%`,
                }"
            >
                <span v-html="block.label ?? ''"></span>:
            </span>
            <span style="flex: 1" v-html="displayValue"></span>
        </template>
    </div>
</template>
