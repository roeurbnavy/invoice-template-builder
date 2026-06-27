<script setup>
import { computed } from 'vue'
import { useBlockStore } from '../../stores/blocks.js'
import { useCanvasStore } from '../../stores/canvas.js'
import { BLOCK_META } from '../../constants/blockMeta.js'
import { Eye, EyeOff, Lock, Trash2, GripVertical } from '@lucide/vue'
import * as icons from '@lucide/vue'

const blockStore = useBlockStore()
const canvasStore = useCanvasStore()

const layers = computed(() => [...blockStore.blocks].reverse()) // top layer first

function isHiddenOnFormat(block) {
  return block.visibleFormats && !block.visibleFormats.includes(canvasStore.formatId)
}

function getIcon(type) {
  const meta = BLOCK_META[type]
  return meta ? (icons[meta.icon] ?? icons.Box) : icons.Box
}

function getName(block) {
  return block.name ?? BLOCK_META[block.type]?.name ?? block.type
}

function toggleVisibility(block) {
  blockStore.updateBlock(block.id, { hidden: !block.hidden })
}

function toggleLock(block) {
  blockStore.updateBlock(block.id, { locked: !block.locked })
}

function deleteBlock(block) {
  blockStore.removeBlock(block.id)
}
</script>

<template>
  <div>
    <div class="panel-header" style="padding: 10px 12px 8px">
      Layers
      <span style="color: var(--color-accent); margin-left: 6px">{{ blockStore.blocks.length }}</span>
    </div>

    <div v-if="layers.length === 0" class="empty-state" style="padding: 24px 12px">
      <span style="font-size: 11px">No blocks on canvas</span>
    </div>

    <div
      v-for="block in layers"
      :key="block.id"
      class="layer-item"
      :class="{ selected: blockStore.selectedIds.includes(block.id) }"
      @click="blockStore.selectBlock(block.id)"
    >
      <!-- Drag handle -->
      <GripVertical :size="12" style="color: var(--color-panel-muted); flex-shrink: 0; cursor: grab" />

      <!-- Icon -->
      <component :is="getIcon(block.type)" :size="12" style="flex-shrink: 0; color: var(--color-panel-muted)" />

      <!-- Name -->
      <span 
        style="flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
        :style="isHiddenOnFormat(block) ? { color: 'var(--color-panel-muted)', opacity: 0.6 } : {}"
      >
        {{ getName(block) }}
        <span v-if="isHiddenOnFormat(block)" style="font-size: 9px; opacity: 0.7; margin-left: 4px">(hidden)</span>
      </span>

      <!-- Controls -->
      <div style="display: flex; gap: 2px; opacity: 0" class="layer-controls">
        <button
          class="btn btn-ghost btn-icon"
          style="width: 20px; height: 20px; border-radius: 4px"
          @click.stop="toggleVisibility(block)"
        >
          <component :is="block.hidden ? EyeOff : Eye" :size="10" />
        </button>
        <button
          class="btn btn-ghost btn-icon"
          style="width: 20px; height: 20px; border-radius: 4px"
          :class="{ 'text-[var(--color-accent)]': block.locked }"
          @click.stop="toggleLock(block)"
        >
          <Lock :size="10" />
        </button>
        <button
          class="btn btn-ghost btn-icon"
          style="width: 20px; height: 20px; border-radius: 4px; color: var(--color-danger)"
          @click.stop="deleteBlock(block)"
        >
          <Trash2 :size="10" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layer-item:hover .layer-controls {
  opacity: 1 !important;
}
</style>
