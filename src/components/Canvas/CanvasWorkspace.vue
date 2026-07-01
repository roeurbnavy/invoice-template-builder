<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCanvasStore } from '../../stores/canvas.js'
import { useBlockStore } from '../../stores/blocks.js'
import { useHistoryStore } from '../../stores/history.js'
import { useSettingsStore } from '../../stores/settings.js'
import { useDragAndDrop } from '../../composables/useDragAndDrop.js'
import { getBlockDefaults } from '../../utils/blockDefaults.js'
import ZoomControls from './ZoomControls.vue'
import AlignmentGuides from './AlignmentGuides.vue'
import CanvasBlock from './CanvasBlock.vue'
import ContextMenu from './ContextMenu.vue'
import CanvasRuler from './CanvasRuler.vue'
import { notify } from '../../composables/useNotification.js'

const canvasStore = useCanvasStore()
const blockStore = useBlockStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()
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

const visibleBlocks = computed(() => {
  return blockStore.orderedBlocks.filter(b => {
    if (b.visibleFormats && !b.visibleFormats.includes(canvasStore.formatId)) {
      return false;
    }
    return true;
  });
})

// Section classification computed properties
const headerBlocks = computed(() => visibleBlocks.value.filter(b => b.section === 'header'));
const tableBlocks = computed(() => visibleBlocks.value.filter(b => b.type === 'item_table'));
const footerBlocks = computed(() => visibleBlocks.value.filter(b => b.section === 'footer'));

// Drag zone tracking
const activeDragZone = ref(null);

function onSectionDragOver(e, zone) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  activeDragZone.value = zone;
}

function onSectionDragLeave(zone) {
  if (activeDragZone.value === zone) {
    activeDragZone.value = null;
  }
}

function onSectionDrop(e, zone) {
  activeDragZone.value = null;
  const blockType = e.dataTransfer.getData('blockType');
  if (!blockType) return;

  // Strict check: table zone only accepts item_table block
  if (zone === 'table' && blockType !== 'item_table') {
    notify('Table section only accepts Table blocks. Please place this block in Header or Footer section instead.', 'warning');
    return;
  }

  // Cross check: table block can only go to table zone in sections mode
  if (blockType === 'item_table' && zone !== 'table') {
    zone = 'table';
  }

  const sectionRect = e.currentTarget.getBoundingClientRect();
  const zoom = canvasStore.zoom;

  const x = Math.round((e.clientX - sectionRect.left) / zoom);
  const y = Math.round((e.clientY - sectionRect.top) / zoom);

  const defaults = getBlockDefaults(blockType);
  const block = {
    ...defaults,
    section: zone,
    x: Math.max(0, x - defaults.width / 2),
    y: Math.max(0, y - defaults.height / 2),
  };

  historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
  const added = blockStore.addBlock(block);
  if (added !== false) {
    blockStore.selectBlock(block.id);
  }
}

const headerHeight = computed(() => {
  return headerBlocks.value.reduce((max, b) => Math.max(max, b.y + b.height), 120);
});
const tableHeight = computed(() => {
  const tBlock = tableBlocks.value[0];
  return tBlock ? tBlock.height : 200;
});
const footerHeight = computed(() => {
  return footerBlocks.value.reduce((max, b) => Math.max(max, b.y + b.height), 120);
});

const pageBreaks = computed(() => {
  const isSections = settingsStore.layoutMode === 'sections';
  if (!isSections) return [];

  const pageH = canvasStore.paperDimensions.height || 1123;
  const totalH = headerHeight.value + tableHeight.value + footerHeight.value;
  const breaks = [];

  let currentY = pageH;
  while (currentY < totalH) {
    breaks.push(currentY);
    currentY += pageH;
  }
  return breaks;
});

function getSectionStyle(type) {
  const isSections = settingsStore.layoutMode === 'sections';
  if (!isSections) return {};
  
  const base = {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
  };

  switch (type) {
    case 'header':
      return {
        ...base,
        height: `${headerHeight.value}px`,
      };
    case 'table':
      return {
        ...base,
        height: `${tableHeight.value}px`,
      };
    case 'footer':
      return {
        ...base,
        height: `${footerHeight.value}px`,
      };
    default:
      return base;
  }
}

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
    if (b.visibleFormats && !b.visibleFormats.includes(canvasStore.formatId)) return false;
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
            :style="[
              paperStyle,
              settingsStore.layoutMode === 'sections'
                ? { display: 'flex', flexDirection: 'column', height: 'auto', minHeight: paperStyle.height, overflow: 'visible' }
                : {}
            ]"
            :class="{ 'drop-active': isDraggingOver && settingsStore.layoutMode === 'freeform' }"
            @drop.prevent="settingsStore.layoutMode === 'freeform' ? handleDrop($event) : null"
            @dragover.prevent="settingsStore.layoutMode === 'freeform' ? handleDragOver($event) : null"
            @dragleave="settingsStore.layoutMode === 'freeform' ? handleDragLeave($event) : null"
            @contextmenu.prevent
          >
            <!-- Grid overlay -->
            <div v-if="canvasStore.showGrid" class="grid-overlay" />

            <!-- Alignment Guides (rendered inside paper) -->
            <AlignmentGuides />

            <!-- Visual Page Break Indicators (Sections Mode) -->
            <div
              v-for="(y, index) in pageBreaks"
              :key="y"
              class="canvas-page-break"
              :style="{
                position: 'absolute',
                top: `${y * canvasStore.zoom}px`,
                left: 0,
                right: 0,
                height: 0,
                borderTop: '2px dashed rgba(0, 180, 216, 0.45)',
                zIndex: 20,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }"
            >
              <span style="
                font-size: 10px;
                font-weight: 700;
                color: var(--color-accent);
                background: var(--color-panel-bg, #1e1e2f);
                padding: 2.5px 8px;
                border-radius: 4px;
                border: 1px solid rgba(0, 180, 216, 0.3);
                transform: translateY(-50%) translateX(-12px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                user-select: none;
              ">
                Page {{ index + 1 }} Break
              </span>
            </div>

            <!-- IF FREEFORM MODE -->
            <template v-if="settingsStore.layoutMode === 'freeform'">
              <!-- Margin indicator -->
              <div class="margin-indicator" style="
                position: absolute;
                inset: 20px;
                border: 1px dashed rgba(0,180,216,0.15);
                pointer-events: none;
                z-index: 0;
              " />

              <CanvasBlock
                v-for="block in visibleBlocks"
                :key="block.id"
                :block="block"
                @contextmenu.stop="(e) => showContextMenu(e, block.id)"
              />
            </template>

            <!-- IF SECTIONS MODE -->
            <template v-else>
              <!-- 1. Header Section Dropzone -->
              <div
                class="editor-section-container header-zone"
                :class="{
                  'zone-dragover': activeDragZone === 'header',
                  'zone-drag-target': canvasStore.draggingToZone === 'header'
                }"
                :style="getSectionStyle('header')"
                @dragover.prevent="onSectionDragOver($event, 'header')"
                @dragleave="onSectionDragLeave('header')"
                @drop.prevent="onSectionDrop($event, 'header')"
              >
                <div class="zone-label zone-label--header">
                  <span class="zone-label__icon">▣</span>
                  <span class="zone-label__text">Header</span>
                </div>
                <CanvasBlock
                  v-for="block in headerBlocks"
                  :key="block.id"
                  :block="block"
                  @contextmenu.stop="(e) => showContextMenu(e, block.id)"
                />
              </div>

              <!-- 2. Table Section (accepts drops for table blocks) -->
              <div
                class="editor-section-container table-zone"
                :class="{
                  'zone-dragover': activeDragZone === 'table',
                  'zone-drag-target': canvasStore.draggingToZone === 'table'
                }"
                :style="getSectionStyle('table')"
                @dragover.prevent="onSectionDragOver($event, 'table')"
                @dragleave="onSectionDragLeave('table')"
                @drop.prevent="onSectionDrop($event, 'table')"
              >
                <div class="zone-label zone-label--table">
                  <span class="zone-label__icon">⊞</span>
                  <span class="zone-label__text">Table</span>
                </div>
                <div v-if="tableBlocks.length === 0" class="zone-placeholder">Drag a Table block here to insert a table</div>
                <CanvasBlock
                  v-for="block in tableBlocks"
                  :key="block.id"
                  :block="block"
                  @contextmenu.stop="(e) => showContextMenu(e, block.id)"
                />
              </div>

              <!-- 3. Footer Section Dropzone (flows after table) -->
              <div
                class="editor-section-container footer-zone"
                :class="{
                  'zone-dragover': activeDragZone === 'footer',
                  'zone-drag-target': canvasStore.draggingToZone === 'footer'
                }"
                :style="getSectionStyle('footer')"
                @dragover.prevent="onSectionDragOver($event, 'footer')"
                @dragleave="onSectionDragLeave('footer')"
                @drop.prevent="onSectionDrop($event, 'footer')"
              >
                <div class="zone-label zone-label--footer">
                  <span class="zone-label__icon">▤</span>
                  <span class="zone-label__text">Footer</span>
                </div>
                <div v-if="footerBlocks.length === 0" class="zone-placeholder">Drag totals, notes, bank details, or signature blocks here</div>
                <CanvasBlock
                  v-for="block in footerBlocks"
                  :key="block.id"
                  :block="block"
                  @contextmenu.stop="(e) => showContextMenu(e, block.id)"
                />
              </div>
            </template>
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

.editor-section-container {
  border: 1.5px dashed rgba(0, 180, 216, 0.18);
  margin-bottom: 0;
  background-color: transparent;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  position: relative;
  min-height: 40px;
}
/* Per-zone left accent border */
.header-zone {
  border-left: 3px solid rgba(96, 165, 250, 0.55);
}
.table-zone {
  border-left: 3px solid rgba(251, 191, 36, 0.55);
  border-style: solid;
  background-color: rgba(255, 255, 255, 0.012);
}
.footer-zone {
  border-left: 3px solid rgba(52, 211, 153, 0.55);
}

/* Hover state */
.editor-section-container:not(.table-zone):hover {
  background-color: rgba(0, 180, 216, 0.025);
  border-color: rgba(0, 180, 216, 0.45);
}

/* Sidebar drop highlight */
.zone-dragover {
  background-color: rgba(0, 180, 216, 0.07) !important;
  border-color: var(--color-accent) !important;
  box-shadow: inset 0 0 0 1px rgba(0, 180, 216, 0.3);
}

/* Block-drag cross-section highlight */
.zone-drag-target {
  background-color: rgba(52, 211, 153, 0.08) !important;
  border-left-color: #34d399 !important;
  border-color: rgba(52, 211, 153, 0.5) !important;
  box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.25);
  animation: zone-pulse 0.7s ease-in-out infinite alternate;
}
@keyframes zone-pulse {
  from { background-color: rgba(52, 211, 153, 0.04); }
  to   { background-color: rgba(52, 211, 153, 0.12); }
}

/* ── Zone labels ────────────────────────────────────── */
.zone-label {
  position: absolute;
  /* Float to the LEFT of the paper (paper has overflow:visible in sections mode) */
  right: calc(100% + 10px);
  top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 4px 9px 4px 7px;
  border-radius: 5px;
  pointer-events: none;
  z-index: 50;
  opacity: 0.72;
  transition: opacity 0.18s ease, transform 0.18s ease;
  backdrop-filter: blur(4px);
}
.zone-label__icon {
  font-size: 11px;
  line-height: 1;
  opacity: 0.85;
}
.zone-label__text {
  font-size: 9.5px;
}
/* Color per zone */
.zone-label--header {
  background: rgba(30, 64, 120, 0.92);
  border: 1px solid rgba(96, 165, 250, 0.6);
  color: #93c5fd;
}
.zone-label--table {
  background: rgba(92, 60, 15, 0.92);
  border: 1px solid rgba(251, 191, 36, 0.6);
  color: #fcd34d;
}
.zone-label--footer {
  background: rgba(6, 60, 45, 0.92);
  border: 1px solid rgba(52, 211, 153, 0.6);
  color: #6ee7b7;
}
/* Show labels more prominently on hover or drag-target */
.editor-section-container:hover .zone-label,
.zone-drag-target .zone-label,
.zone-dragover .zone-label {
  opacity: 1;
  transform: translateX(-2px);
}

.zone-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.18);
  font-style: italic;
  pointer-events: none;
  border: 1px dashed rgba(255, 255, 255, 0.06);
  margin: 10px 10px 10px 14px;
  border-radius: 4px;
}
</style>
