<script setup>
const props = defineProps({ block: { type: Object, required: true } })
</script>

<template>
  <div style="width: 100%; height: 100%; display: flex; align-items: center">
    <div
      :style="{
        width: '100%',
        height: (!block.lineStyle || block.lineStyle === 'solid') ? `${block.lineWidth ?? 1}px` : '0px',
        backgroundColor: (!block.lineStyle || block.lineStyle === 'solid') ? (block.lineColor ?? '#cccccc') : 'transparent',
        borderTop: (block.lineStyle && block.lineStyle !== 'solid') ? `${block.lineWidth ?? 1}px ${block.lineStyle} ${block.lineColor ?? '#cccccc'}` : 'none'
      }"
    />
  </div>
</template>
