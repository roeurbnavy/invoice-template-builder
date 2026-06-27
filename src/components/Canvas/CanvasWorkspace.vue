<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCanvasStore } from '../../stores/canvas.js'
import { useBlockStore } from '../../stores/blocks.js'
import { useHistoryStore } from '../../stores/history.js'
import { useDragAndDrop } from '../../composables/useDragAndDrop.js'
import ZoomControls from './ZoomControls.vue'
import AlignmentGuides from './AlignmentGuides.vue'
import CanvasBlock from './CanvasBlock.vue'
import ContextMenu from './ContextMenu.vue'
import CanvasRuler from './CanvasRuler.vue'

const canvasStore = useCanvasStore()
const blockStore = useBlockStore()
const historyStore = useHistoryStore()
const { onCanvasDrop, onCanvasDragOver } = useDragAndDrop()

const workspaceEl = ref(null)
const paperEl = ref(null)
const isDraggingOver = ref(false)

// Pan state
const isPanning = ref(false)
const spaceHeld = ref(false)
const panStart = ref({ x: 0, y: 0 })
const panOffset = ref({ x: 0, y: 0 })

// Context menu
const contextMenu = ref({ visible: false, x: 0, y: 0, blockId: null })

// Drag-select state
const dragSelect = ref({ active: false, startX: 0, startY: 0, endX: 0, endY: 0 })

const paperStyle = computed(() => {
  const { width, height } = canvasStore.paperDimensions
  const z = canvasStore.zoom
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(${z})`,
    transformOrigin: 'top left',
    position: 'relative',
    background: 'var(--color-paper)',
    boxShadow: 'var(--shadow-paper)',
    overflow: 'hidden',
    flexShrink: 0,
  }
})

const workspaceContentStyle = computed(() => {
  const { width, height } = canvasStore.paperDimensions
  const z = canvasStore.zoom
  return {
    width: `${width * z}px`,
    height: `${height * z}px`,
    minWidth: `${width * z}px`,
    minHeight: `${height * z}px`,
  }
})

// ─── Drop handling ───────────────────────────────────────────
function handleDrop(e) {
  isDraggingOver.value = false
  onCanvasDrop(e, paperEl.value)
}

function handleDragOver(e) {
  onCanvasDragOver(e)
  isDraggingOver.value = true
}

function handleDragLeave() {
  isDraggingOver.value = false
}

// ─── Pan (Space + drag) ───────────────────────────────────────
function onKeyDown(e) {
  if (e.code === 'Space' && !spaceHeld.value) {
    const el = document.activeElement
    const tag = el?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return
    e.preventDefault()
    spaceHeld.value = true
    if (workspaceEl.value) workspaceEl.value.style.cursor = 'grab'
  }
}

function onKeyUp(e) {
  if (e.code === 'Space') {
    spaceHeld.value = false
    if (workspaceEl.value) workspaceEl.value.style.cursor = ''
    isPanning.value = false
  }
}

function onMouseDown(e) {
  if (spaceHeld.value) {
    // Pan mode
    isPanning.value = true
    panStart.value = { x: e.clientX - panOffset.value.x, y: e.clientY - panOffset.value.y }
    if (workspaceEl.value) workspaceEl.value.style.cursor = 'grabbing'
    e.preventDefault()
    return
  }

  // Drag-select on paper background
  if (e.target === paperEl.value) {
    const rect = paperEl.value.getBoundingClientRect()
    const z = canvasStore.zoom
    dragSelect.value = {
      active: true,
      startX: (e.clientX - rect.left) / z,
      startY: (e.clientY - rect.top) / z,
      endX: (e.clientX - rect.left) / z,
      endY: (e.clientY - rect.top) / z,
    }
    blockStore.clearSelection()
    e.preventDefault()
  }
}

function onMouseMove(e) {
  if (isPanning.value) {
    panOffset.value = {
      x: e.clientX - panStart.value.x,
      y: e.clientY - panStart.value.y,
    }
    return
  }

  if (dragSelect.value.active) {
    const rect = paperEl.value.getBoundingClientRect()
    const z = canvasStore.zoom
    dragSelect.value.endX = (e.clientX - rect.left) / z
    dragSelect.value.endY = (e.clientY - rect.top) / z
  }
}

function onMouseUp(e) {
  if (isPanning.value) {
    isPanning.value = false
    if (workspaceEl.value) workspaceEl.value.style.cursor = spaceHeld.value ? 'grab' : ''
    return
  }

  if (dragSelect.value.active) {
    finalizeDragSelect()
    dragSelect.value.active = false
  }
}

function finalizeDragSelect() {
  const { startX, startY, endX, endY } = dragSelect.value
  const selX = Math.min(startX, endX)
  const selY = Math.min(startY, endY)
  const selW = Math.abs(endX - startX)
  const selH = Math.abs(endY - startY)
  if (selW < 4 || selH < 4) return

  const selected = blockStore.blocks.filter(b => {
    return (
      b.x < selX + selW &&
      b.x + b.width > selX &&
      b.y < selY + selH &&
      b.y + b.height > selY
    )
  }).map(b => b.id)

  blockStore.selectBlocks(selected)
}

// ─── Scroll to zoom ───────────────────────────────────────────
function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    canvasStore.setZoom(canvasStore.zoom + delta)
  }
}

// ─── Context menu ─────────────────────────────────────────────
function showContextMenu(e, blockId) {
  e.preventDefault()
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, blockId }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

// ─── Click outside to deselect ───────────────────────────────
function onWorkspaceClick(e) {
  if (e.target === workspaceEl.value || e.target === paperEl.value) {
    blockStore.clearSelection()
    canvasStore.editingBlockId = null
    hideContextMenu()
  }
}

// Drag-select rect style
const dragSelectStyle = computed(() => {
  if (!dragSelect.value.active) return null
  const { startX, startY, endX, endY } = dragSelect.value
  const z = canvasStore.zoom
  return {
    left: `${Math.min(startX, endX) * z}px`,
    top: `${Math.min(startY, endY) * z}px`,
    width: `${Math.abs(endX - startX) * z}px`,
    height: `${Math.abs(endY - startY) * z}px`,
    position: 'absolute',
    border: '1px solid var(--color-selection)',
    background: 'var(--color-accent-dim)',
    pointerEvents: 'none',
    zIndex: 9998,
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <main
    ref="workspaceEl"
    class="workspace"
    style="
      flex: 1;
      background: var(--color-workspace);
      overflow: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px;
    "
    @click="onWorkspaceClick"
    @mousedown="onMouseDown"
    @wheel.passive="false"
    @wheel="onWheel"
    @contextmenu.prevent
  >
    <!-- Scrollable inner area that shifts with pan offset -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        transition: isPanning ? 'none' : 'transform 0.1s ease',
      }"
    >
      <!-- Ruler + Paper layout -->
      <div style="display: flex; flex-direction: column; align-items: flex-start;">
        <div v-if="canvasStore.showRulers" style="display: flex;">
          <CanvasRuler :ruler-size="24" />
        </div>
        <div style="display: flex;">
          <div v-if="canvasStore.showRulers">
            <CanvasRuler :ruler-size="24" vertical />
          </div>
          <div
            ref="paperEl"
            id="canvas-paper"
            :style="paperStyle"
            :class="{ 'drop-active': isDraggingOver }"
            @drop.prevent="handleDrop"
            @dragover.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            @contextmenu.prevent
          >
            <!-- Grid overlay -->
            <div v-if="canvasStore.showGrid" class="grid-overlay" />

            <!-- Margin indicator -->
            <div class="margin-indicator" style="
              position: absolute;
              inset: 20px;
              border: 1px dashed rgba(0,180,216,0.15);
              pointer-events: none;
              z-index: 0;
            " />

            <!-- Alignment Guides (rendered inside paper) -->
            <AlignmentGuides />

            <!-- Drag-select rect -->
            <div v-if="dragSelect.active" :style="dragSelectStyle" />

            <!-- Blocks -->
            <CanvasBlock
              v-for="block in blockStore.orderedBlocks"
              :key="block.id"
              :block="block"
              @contextmenu.stop="(e) => showContextMenu(e, block.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom controls (bottom center) -->
    <div class="print-hidden" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 50">
      <ZoomControls />
    </div>

    <!-- Context menu -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :block-id="contextMenu.blockId"
      @close="hideContextMenu"
    />
  </main>
</template>

<style scoped>
.workspace::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.drop-active {
  outline: 2px dashed var(--color-accent) !important;
  outline-offset: -4px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image:
    linear-gradient(rgba(128,128,128,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(128,128,128,0.08) 1px, transparent 1px);
  background-size: v-bind('canvasStore.gridSize + "px"') v-bind('canvasStore.gridSize + "px"');
}
</style>
