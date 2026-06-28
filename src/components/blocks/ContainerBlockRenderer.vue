<script setup>
import { computed } from 'vue'
import { getBorderStyle } from '../../utils/blockDefaults.js'
const props = defineProps({ block: { type: Object, required: true } })

const hasCustomBorder = computed(() => {
  const b = props.block
  return (b.borderWidth ?? 0) > 0
    || (b.borderTopWidth ?? 0) > 0
    || (b.borderRightWidth ?? 0) > 0
    || (b.borderBottomWidth ?? 0) > 0
    || (b.borderLeftWidth ?? 0) > 0
})

const containerStyle = computed(() => {
  const b = props.block
  return {
    width: '100%',
    height: '100%',
    backgroundColor: b.backgroundColor ?? 'transparent',
    ...(hasCustomBorder.value ? getBorderStyle(b) : {}),
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
  <div
    :style="containerStyle"
    class="container-block-renderer"
    :class="{ 'has-custom-border': hasCustomBorder }"
  >
    <span class="container-label">
      Container
    </span>
  </div>
</template>

