<script setup>
import { computed } from 'vue'
import { getBorderStyle } from '../../utils/blockDefaults.js'

const props = defineProps({ block: { type: Object, required: true } })

const style = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden',
  fontSize: `${props.block.fontSize ?? 11}px`,
  ...getBorderStyle(props.block),
}))

const columns = computed(() => props.block.columns || [])
</script>

<template>
  <div :style="style">
    <table style="width: 100%; border-collapse: collapse; font-size: inherit">
      <thead v-if="block.showHeader !== false">
        <tr>
          <th
            v-for="col in columns"
            :key="col.id"
            :style="{
              padding: '4px 6px',
              textAlign: 'left',
              fontWeight: 'bold',
              fontSize: 'inherit',
              borderBottom: block.showBorders !== false ? '1px solid ' + (block.borderColor || '#ccc') : 'none',
              width: (col.width || 50) + '%',
            }"
          >{{ col.label || col.id }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            v-for="col in columns"
            :key="col.id"
            style="padding: 4px 6px; font-size: inherit; color: #999"
          >—</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
