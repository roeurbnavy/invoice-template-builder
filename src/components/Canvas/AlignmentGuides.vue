<script setup>
import { computed } from 'vue'
import { guideLines } from '../../composables/useAlignmentGuides.js'
import { useCanvasStore } from '../../stores/canvas.js'

const canvasStore = useCanvasStore()
const z   = computed(() => canvasStore.zoom)
const dims = computed(() => canvasStore.paperDimensions)

/** Intersection points where a H and V guide cross */
const intersections = computed(() => {
  const pts = []
  const hs = guideLines.value.filter(g => g.orientation === 'h')
  const vs = guideLines.value.filter(g => g.orientation === 'v')
  for (const h of hs) {
    for (const v of vs) {
      pts.push({ x: v.position, y: h.position })
    }
  }
  return pts
})
</script>

<template>
  <!-- Horizontal guides -->
  <template v-for="(line, i) in guideLines.filter(g => g.orientation === 'h')" :key="'h' + i">
    <div
      class="guide-line guide-line-h"
      :style="{ top: `${line.position * z}px` }"
    />
    <!-- Position label -->
    <div
      class="guide-label guide-label-h"
      :style="{ top: `${line.position * z - 9}px` }"
    >{{ Math.round(line.position) }}px</div>
  </template>

  <!-- Vertical guides -->
  <template v-for="(line, i) in guideLines.filter(g => g.orientation === 'v')" :key="'v' + i">
    <div
      class="guide-line guide-line-v"
      :class="{ 'guide-line-center': line.isCenter }"
      :style="{ left: `${line.position * z}px` }"
    />
    <!-- Position label -->
    <div
      class="guide-label guide-label-v"
      :class="{ 'guide-label-center': line.isCenter }"
      :style="{ left: `${line.position * z + 4}px` }"
    >{{ line.isCenter ? 'center' : Math.round(line.position) + 'px' }}</div>
  </template>

  <!-- Intersection dots -->
  <div
    v-for="(pt, i) in intersections"
    :key="'dot' + i"
    class="guide-dot"
    :style="{ left: `${pt.x * z - 4}px`, top: `${pt.y * z - 4}px` }"
  />
</template>
