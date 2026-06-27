<script setup>
import { computed } from 'vue'
import { useCanvasStore } from '../../stores/canvas.js'

const canvasStore = useCanvasStore()

const props = defineProps({
  rulerSize: { type: Number, default: 24 },
  vertical: { type: Boolean, default: false },
})

const paperW = computed(() => canvasStore.paperDimensions.width)
const paperH = computed(() => canvasStore.paperDimensions.height)
const z = computed(() => canvasStore.zoom)

const rulerWidth = computed(() => `${paperW.value * z.value}px`)
const rulerHeight = computed(() => `${paperH.value * z.value}px`)

const majorStep = 50
const minorStep = 10

const hTicks = computed(() => {
  const ticks = []
  const w = paperW.value
  for (let i = 0; i <= w; i += minorStep) {
    const isMajor = i % majorStep === 0
    ticks.push({ pos: i * z.value, label: isMajor ? String(i) : '', isMajor, isMinor: !isMajor })
  }
  return ticks
})

const vTicks = computed(() => {
  const ticks = []
  const h = paperH.value
  for (let i = 0; i <= h; i += minorStep) {
    const isMajor = i % majorStep === 0
    ticks.push({ pos: i * z.value, label: isMajor ? String(i) : '', isMajor, isMinor: !isMajor })
  }
  return ticks
})
</script>

<template>
  <template v-if="vertical">
    <svg
      class="ruler ruler-v"
      :style="{ height: rulerHeight, width: rulerSize + 'px' }"
    >
      <line
        v-for="t in vTicks"
        :key="'v' + t.pos"
        :x1="rulerSize" :y1="t.pos"
        :x2="t.isMajor ? 6 : rulerSize - 6" :y2="t.pos"
        stroke="var(--color-panel-muted, #999)"
        stroke-width="1"
      />
    <template v-for="t in vTicks" :key="'vl' + t.pos">
      <text
        v-if="t.isMajor && t.label"
        :x="10" :y="t.pos + 3"
        :font-size="9"
        fill="var(--color-panel-muted, #999)"
        text-anchor="end"
      >{{ t.label }}</text>
    </template>
    </svg>
  </template>
  <template v-else>
    <div class="ruler-corner" :style="{ width: rulerSize + 'px', height: rulerSize + 'px' }" />
    <svg
      class="ruler ruler-h"
      :style="{ width: rulerWidth, height: rulerSize + 'px' }"
    >
      <line
        v-for="t in hTicks"
        :key="'h' + t.pos"
        :x1="t.pos" :y1="rulerSize"
        :x2="t.pos" :y2="t.isMajor ? 6 : rulerSize - 6"
        stroke="var(--color-panel-muted, #999)"
        stroke-width="1"
      />
    <template v-for="t in hTicks" :key="'hl' + t.pos">
      <text
        v-if="t.isMajor && t.label"
        :x="t.pos" :y="12"
        :font-size="9"
        fill="var(--color-panel-muted, #999)"
        text-anchor="middle"
      >{{ t.label }}</text>
    </template>
    </svg>
  </template>
</template>

<style scoped>
.ruler-corner {
  background: var(--color-workspace, #e8e8e8);
  border-right: 1px solid var(--color-panel-border, #ccc);
  border-bottom: 1px solid var(--color-panel-border, #ccc);
  box-sizing: border-box;
  flex-shrink: 0;
}
.ruler {
  display: block;
  flex-shrink: 0;
  overflow: visible;
  background: var(--color-workspace, #e8e8e8);
  pointer-events: none;
  user-select: none;
}
.ruler-h {
  border-bottom: 1px solid var(--color-panel-border, #ccc);
}
.ruler-v {
  border-right: 1px solid var(--color-panel-border, #ccc);
}
</style>
