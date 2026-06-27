<script setup>
import { computed, ref, watch, nextTick } from "vue";
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

const blockStyle = computed(() => ({
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 13}px`,
    fontWeight: props.block.fontWeight ?? "normal",
    fontStyle: props.block.fontStyle ?? "normal",
    color: props.block.color ?? "#000000",
    lineHeight: props.block.lineHeight ?? 1.5,
    letterSpacing: `${props.block.letterSpacing ?? 0}px`,
    textAlign: props.block.textAlign ?? "left",
    textDecoration: props.block.textDecoration ?? "none",
    textTransform: props.block.textTransform ?? "none",
    backgroundColor: props.block.backgroundColor ?? "transparent",
    padding: `${props.block.paddingTop ?? 2}px ${props.block.paddingRight ?? 4}px ${props.block.paddingBottom ?? 2}px ${props.block.paddingLeft ?? 4}px`,
    ...getBorderStyle(props.block),
    borderRadius: `${props.block.borderRadius ?? 0}px`,
}));

const editRef = ref(null);

function saveContent() {
    if (!editRef.value) return;
    const html = editRef.value.innerHTML;
    if (html !== props.block.content) {
        blockStore.updateBlock(props.block.id, { content: html });
    }
}

watch(
    () => props.fillMode,
    (newVal) => {
        if (newVal) {
            nextTick(() => {
                const el = editRef.value;
                if (!el) return;
                el.innerHTML = props.block.content ?? "";
                el.focus();
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            });
        } else {
            saveContent();
        }
    }
);

function onKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b': e.preventDefault(); document.execCommand('bold'); return;
            case 'i': e.preventDefault(); document.execCommand('italic'); return;
            case 'u': e.preventDefault(); document.execCommand('underline'); return;
        }
    }
}
</script>

<template>
    <div v-if="fillMode" :style="{ ...blockStyle, position: 'relative', width: '100%', height: '100%' }">
        <div class="inline-toolbar" @mousedown.stop @click.stop>
            <button class="inline-fmt-btn" title="Bold (Ctrl+B)" @click="document.execCommand('bold')"><b>B</b></button>
            <button class="inline-fmt-btn" title="Italic (Ctrl+I)" @click="document.execCommand('italic')"><i>I</i></button>
            <button class="inline-fmt-btn" title="Underline (Ctrl+U)" @click="document.execCommand('underline')"><u>U</u></button>
        </div>
        <div
            ref="editRef"
            contenteditable="true"
            class="rich-text-editor"
            @keydown="onKeydown"
        />
    </div>
    <div v-else :style="{ ...blockStyle, position: 'relative', width: '100%', height: '100%' }">
        <div class="text-display" v-html="displayText"></div>
        <div
            v-if="block.dataBinding?.field"
            :title="'Bound to: ' + block.dataBinding.field"
            class="binding-badge"
        >⚡</div>
    </div>
</template>

<style scoped>
.rich-text-editor {
    width: 100%;
    height: 100%;
    outline: none;
    box-sizing: border-box;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
    background: transparent;
    border: 1px solid rgba(0, 180, 216, 0.4);
    border-radius: 0;
}
.rich-text-editor:empty::before {
    content: "Click to type...";
    color: #a0aec0;
    pointer-events: none;
}
.text-display {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
}
.inline-toolbar {
    position: absolute;
    top: -32px;
    left: 4px;
    display: flex;
    gap: 2px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 6px;
    padding: 3px;
    z-index: 10;
}
.inline-fmt-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 24px;
    border: none;
    background: transparent;
    color: #fff;
    border-radius: 3px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    padding: 0;
}
.inline-fmt-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}
.binding-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 9px;
    color: var(--color-accent, #00b4d8);
    opacity: 0.6;
    pointer-events: none;
    line-height: 1;
}
</style>
