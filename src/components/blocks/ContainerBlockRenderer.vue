<script setup>
import { computed } from 'vue'
import { getBorderStyle } from '../../utils/blockDefaults.js'
const props = defineProps({ block: { type: Object, required: true } })

const containerStyle = computed(() => {
  const b = props.block
  const hasBorder = (b.borderWidth ?? 0) > 0
    || (b.borderTopWidth ?? 0) > 0
    || (b.borderRightWidth ?? 0) > 0
    || (b.borderBottomWidth ?? 0) > 0
    || (b.borderLeftWidth ?? 0) > 0
  return {
    width: '100%',
    height: '100%',
    backgroundColor: b.backgroundColor ?? 'transparent',
    ...(hasBorder ? getBorderStyle(b) : { border: '1px dashed rgba(0,180,216,0.3)' }),
    borderRadius: `${b.borderRadius ?? 0}px`,
    padding: `${b.paddingTop ?? 0}px ${b.paddingRight ?? 0}px ${b.paddingBottom ?? 0}px ${b.paddingLeft ?? 0}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    pointerEvents: 'none',
  }
})
</script>

<template>
  <div :style="containerStyle">
    <span style="position: absolute; top: 4px; left: 6px; font-size: 9px; opacity: 0.3; text-transform: uppercase; letter-spacing: 0.05em; color: #000">
      Container
    </span>
  </div>
</template>
