<script setup>
import { computed } from 'vue'
import { useBlockStore } from '../../stores/blocks.js'
import { getBorderStyle } from '../../utils/blockDefaults.js'

const props = defineProps({
  block: { type: Object, required: true },
  fillMode: { type: Boolean, default: false },
})

const blockStore = useBlockStore()

const style = computed(() => ({
  width: '100%', height: '100%',
  boxSizing: 'border-box',
  ...getBorderStyle(props.block),
  borderRadius: `${props.block.borderRadius ?? 0}px`,
  backgroundColor: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}))
</script>

<template>
  <div :style="style">
    <input v-if="fillMode"
      type="text"
      :value="block.label ?? 'Stamp'"
      style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: 10px; color: rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; width: 100%;"
      @input="blockStore.updateBlock(block.id, { label: $event.target.value })"
    />
    <span v-else style="font-size: 10px; color: rgba(0,0,0,0.2); text-transform: uppercase; letter-spacing: 0.08em">
      {{ block.label ?? 'Stamp' }}
    </span>
  </div>
</template>
