<script setup>
import { computed, ref, watch, onMounted, nextTick } from "vue";
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

const displayText = computed(() => {
    const binding = resolveBlockBinding(props.block, null, canvasStore.previewMode);
    if (binding !== null) return String(binding);
    return props.block.content ?? "";
});

const style = computed(() => ({
    width: "100%",
    height: "100%",
    padding: `${props.block.paddingTop ?? 4}px ${props.block.paddingRight ?? 8}px ${props.block.paddingBottom ?? 4}px ${props.block.paddingLeft ?? 8}px`,
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 12}px`,
    fontWeight: props.block.fontWeight ?? "normal",
    fontStyle: props.block.fontStyle ?? "normal",
    color: props.block.color ?? "#555555",
    backgroundColor: props.block.backgroundColor ?? "transparent",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: "4px",
    textAlign: props.block.textAlign ?? "left",
    ...getBorderStyle(props.block),
    borderRadius: `${props.block.borderRadius ?? 0}px`,
}));

const fillLabelInputStyle = computed(() => ({
    fontSize: "10px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: props.block.color ?? "#555555",
    opacity: "0.7",
    fontFamily: props.block.fontFamily ?? "inherit",
    background: "transparent",
    border: "none",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    padding: "0",
    marginBottom: "2px",
}));

const fillTextareaStyle = computed(() => ({
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 12}px`,
    fontWeight: props.block.fontWeight ?? "normal",
    fontStyle: props.block.fontStyle ?? "normal",
    color: props.block.color ?? "#555555",
    textAlign: props.block.textAlign ?? "left",
    background: "transparent",
    border: "1px solid rgba(0, 180, 216, 0.4)",
    outline: "none",
    resize: "none",
    flex: "1",
    width: "100%",
    boxSizing: "border-box",
    padding: "2px 4px",
    overflow: "auto",
}));

const editRef = ref(null);

onMounted(() => {
    if (editRef.value) {
        editRef.value.innerHTML = props.block.content ?? "";
    }
});

watch(
    () => props.block.content,
    (newVal) => {
        if (editRef.value && editRef.value.innerHTML !== newVal) {
            editRef.value.innerHTML = newVal ?? "";
        }
    }
);

watch(
    () => props.fillMode,
    (newVal) => {
        if (newVal) {
            nextTick(() => {
                if (editRef.value) {
                    editRef.value.focus();
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(editRef.value);
                    range.collapse(false); // cursor to the end
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });
        }
    }
);
</script>

<template>
    <!-- Fill mode -->
    <div v-if="fillMode" :style="style">
        <input
            v-if="block.label"
            type="text"
            :value="block.label"
            :style="fillLabelInputStyle"
            @input="
                blockStore.updateBlock(block.id, { label: $event.target.value })
            "
        />
        <div
            ref="editRef"
            contenteditable="true"
            :style="fillTextareaStyle"
            placeholder="Enter notes or terms here..."
            class="rich-text-editor"
            @input="blockStore.updateBlock(block.id, { content: $event.target.innerHTML })"
        />
    </div>

    <!-- Design mode -->
    <div v-else :style="style">
        <div
            v-if="block.label"
            class="notes-label"
            style="font-size: 0.85em; font-weight: 600"
        >
            {{ block.label }}
        </div>
        <div
            class="notes-content"
            style="white-space: pre-wrap; word-break: break-word"
            v-html="displayText || 'Enter notes or terms here...'"
        >
        </div>
    </div>
</template>

<style scoped>
.notes-label {
    margin-bottom: 2px;
}
.rich-text-editor {
    outline: none;
}
.rich-text-editor:empty::before {
    content: attr(placeholder);
    color: #a0aec0;
    pointer-events: none;
}
</style>
