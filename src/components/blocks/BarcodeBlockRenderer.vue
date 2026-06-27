<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCanvasStore } from '../../stores/canvas.js'
import { resolveBlockBinding } from '../../utils/variableResolver.js'
import { getBorderStyle } from '../../utils/blockDefaults.js'
import JsBarcode from 'jsbarcode'

const props = defineProps({ block: { type: Object, required: true } })
const canvasStore = useCanvasStore()

const svgRef = ref(null)
const hasError = ref(false)

const barcodeContent = computed(() => {
  const binding = resolveBlockBinding(props.block, null, canvasStore.previewMode)
  if (binding !== null) return String(binding)
  return props.block.content || ''
})

function getOptions() {
  return {
    format: props.block.barcodeFormat || 'CODE128',
    width: props.block.barcodeWidth ?? 2,
    height: props.block.barcodeHeight ?? 50,
    displayValue: props.block.showBarcodeText !== false,
    fontSize: props.block.barcodeFontSize ?? 12,
    margin: props.block.barcodeMargin ?? 10,
    background: '#ffffff',
    lineColor: '#000000',
  }
}

function renderBarcode() {
  hasError.value = false
  const el = svgRef.value
  if (!el) return
  const content = barcodeContent.value
  if (!content) {
    el.innerHTML = ''
    return
  }
  try {
    JsBarcode(el, content, getOptions())
  } catch {
    el.innerHTML = ''
    hasError.value = true
  }
}

onMounted(() => {
  nextTick(renderBarcode)
})

watch(barcodeContent, renderBarcode)
watch(getOptions, renderBarcode, { deep: true })

const style = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  boxSizing: 'border-box',
  ...getBorderStyle(props.block),
}))
</script>

<template>
  <div :style="style">
    <svg ref="svgRef" style="width:100%;height:100%;max-height:100%" />
    <div v-if="hasError" style="position:absolute;font-size:11px;color:var(--color-panel-muted,#999);pointer-events:none">
      Invalid content for {{ props.block.barcodeFormat || 'CODE128' }}
    </div>
  </div>
</template>
