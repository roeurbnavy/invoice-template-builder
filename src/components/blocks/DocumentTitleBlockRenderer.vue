<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useBlockStore } from "../../stores/blocks.js";
import { useCanvasStore } from "../../stores/canvas.js";
import { resolveBlockBinding } from "../../utils/variableResolver.js";

const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const blockStore = useBlockStore();
const canvasStore = useCanvasStore();

const displayContent = computed(() => {
    const binding = resolveBlockBinding(props.block, null, canvasStore.previewMode);
    if (binding !== null) return String(binding);
    return props.block.content ?? "INVOICE";
});

const baseStyle = computed(() => ({
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 28}px`,
    fontWeight: props.block.fontWeight ?? "bold",
    color: props.block.color ?? "#1a1a2e",
    textAlign: props.block.textAlign ?? "left",
    letterSpacing: props.block.letterSpacing
        ? `${props.block.letterSpacing}px`
        : "0.02em",
    textTransform: props.block.textTransform ?? "uppercase",
    backgroundColor: props.block.backgroundColor ?? "transparent",
}));

const style = computed(() => ({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    boxSizing: "border-box",
    overflow: "hidden",
    ...baseStyle.value,
}));

const fillInputStyle = computed(() => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "4px 8px",
    background: "transparent",
    border: "1px solid rgba(0, 180, 216, 0.4)",
    outline: "none",
    ...baseStyle.value,
}));

const editRef = ref(null);

onMounted(() => {
    if (editRef.value) {
        editRef.value.innerHTML = props.block.content ?? "INVOICE";
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
</script>

<template>
    <div
        v-if="fillMode"
        ref="editRef"
        contenteditable="true"
        :style="fillInputStyle"
        class="rich-text-editor"
        @input="
            blockStore.updateBlock(block.id, { content: $event.target.innerHTML })
        "
    />
    <div v-else :style="style" v-html="displayContent"></div>
</template>

<style scoped>
.rich-text-editor {
    outline: none;
}
.rich-text-editor:empty::before {
    content: "INVOICE";
    color: #a0aec0;
    pointer-events: none;
}
</style>
