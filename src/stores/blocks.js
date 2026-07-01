import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBlockDefaults } from '../utils/blockDefaults.js'
import { DOCUMENT_PRESETS } from '../constants/presets.js'
import { useHistoryStore } from './history.js'
import { useSettingsStore } from './settings.js'
import { notify } from '../composables/useNotification.js'

export const useBlockStore = defineStore('blocks', () => {
  const historyStore = useHistoryStore()
  // All blocks on canvas — keyed by their fabric object id (block.id)
  const blocks = ref([])
  const selectedIds = ref([])

  const selectedBlock = computed(() =>
    selectedIds.value.length === 1
      ? blocks.value.find(b => b.id === selectedIds.value[0]) ?? null
      : null
  )

  const selectedBlocks = computed(() =>
    blocks.value.filter(b => selectedIds.value.includes(b.id))
  )

  const orderedBlocks = computed(() =>
    [...blocks.value].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  )

  // Actions
  function addBlock(block) {
    // ── Phase-1 multi-table guard ─────────────────────────────────────────
    // Sections mode only supports one item_table (see analysis_alignment_multitable.md).
    // Freeform mode allows multiple tables (freeform pagination is unrestricted,
    // though only the FIRST table is paginated — Phase 2 will lift that limit).
    const settingsStore = useSettingsStore()
    if (block.type === 'item_table' && settingsStore.layoutMode === 'sections') {
      const existing = blocks.value.find(b => b.type === 'item_table')
      if (existing) {
        notify(
          'Sections mode supports only one Table block. Switch to Freeform mode to use multiple tables.',
          'warning',
        )
        return false
      }
    }
    const zIndex = blocks.value.length
    const section = block.section || 'header'
    blocks.value.push({ ...block, section, zIndex })
    return true
  }

  function removeBlock(id) {
    blocks.value = blocks.value.filter(b => b.id !== id)
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
  }

  function removeSelected() {
    selectedIds.value.forEach(id => removeBlock(id))
  }

  function updateBlock(id, props) {
    const idx = blocks.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      blocks.value[idx] = { ...blocks.value[idx], ...props }
    }
  }

  function selectBlock(id) {
    selectedIds.value = id ? [id] : []
  }

  function selectBlocks(ids) {
    selectedIds.value = ids
  }

  function addToSelection(id) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id]
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function bringForward(id) {
    const sorted = [...blocks.value].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(b => b.id === id);
    if (idx === -1 || idx === sorted.length - 1) return;
    
    const temp = sorted[idx];
    sorted[idx] = sorted[idx + 1];
    sorted[idx + 1] = temp;
    
    sorted.forEach((b, i) => {
      b.zIndex = i;
    });
    historyStore.push(JSON.parse(JSON.stringify(blocks.value)));
  }

  function sendBackward(id) {
    const sorted = [...blocks.value].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(b => b.id === id);
    if (idx === -1 || idx === 0) return;
    
    const temp = sorted[idx];
    sorted[idx] = sorted[idx - 1];
    sorted[idx - 1] = temp;
    
    sorted.forEach((b, i) => {
      b.zIndex = i;
    });
    historyStore.push(JSON.parse(JSON.stringify(blocks.value)));
  }

  function bringToFront(id) {
    const sorted = [...blocks.value].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(b => b.id === id);
    if (idx === -1) return;
    
    const [block] = sorted.splice(idx, 1);
    sorted.push(block);
    
    sorted.forEach((b, i) => {
      b.zIndex = i;
    });
    historyStore.push(JSON.parse(JSON.stringify(blocks.value)));
  }

  function sendToBack(id) {
    const sorted = [...blocks.value].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(b => b.id === id);
    if (idx === -1) return;
    
    const [block] = sorted.splice(idx, 1);
    sorted.unshift(block);
    
    sorted.forEach((b, i) => {
      b.zIndex = i;
    });
    historyStore.push(JSON.parse(JSON.stringify(blocks.value)));
  }

  function duplicateBlock(id) {
    const block = blocks.value.find(b => b.id === id)
    if (!block) return null
    const newBlock = {
      ...block,
      id: crypto.randomUUID(),
      x: (block.x ?? 0) + 20,
      y: (block.y ?? 0) + 20,
      zIndex: Math.max(...blocks.value.map(b => b.zIndex ?? 0)) + 1,
    }
    blocks.value.push(newBlock)
    return newBlock
  }

  const copiedBlock = ref(null)

  function copyBlock(id) {
    const block = blocks.value.find(b => b.id === id)
    if (!block) return
    copiedBlock.value = JSON.parse(JSON.stringify(block))
  }

  function pasteBlock() {
    if (!copiedBlock.value) return null
    const newBlock = {
      ...JSON.parse(JSON.stringify(copiedBlock.value)),
      id: crypto.randomUUID(),
      x: (copiedBlock.value.x ?? 0) + 20,
      y: (copiedBlock.value.y ?? 0) + 20,
      zIndex: Math.max(...blocks.value.map(b => b.zIndex ?? 0), 0) + 1,
    }
    blocks.value.push(newBlock)
    selectBlock(newBlock.id)
    return newBlock
  }

  function groupSelected() {
    const selected = blocks.value.filter(b => selectedIds.value.includes(b.id))
    if (selected.length < 2) return
    const childIds = selected.map(b => b.id)
    const minX = Math.min(...selected.map(b => b.x ?? 0))
    const minY = Math.min(...selected.map(b => b.y ?? 0))
    const maxX = Math.max(...selected.map(b => (b.x ?? 0) + (b.width ?? 100)))
    const maxY = Math.max(...selected.map(b => (b.y ?? 0) + (b.height ?? 50)))
    const container = getBlockDefaults('container', {
      x: minX, y: minY,
      width: maxX - minX, height: maxY - minY,
      backgroundColor: 'transparent',
      borderWidth: 1, borderColor: '#00b4d8', borderStyle: 'dashed',
      zIndex: Math.max(...selected.map(b => b.zIndex ?? 0)) + 1,
      childIds,
      section: selected[0]?.section || 'header'
    })
    blocks.value.push(container)
    selectBlock(container.id)
  }

  function ungroupSelected() {
    const container = blocks.value.find(b => b.id === selectedIds.value[0])
    if (!container || !container.childIds?.length) return
    const ids = [...(container.childIds ?? [])]
    selectBlocks(ids)
    removeBlock(container.id)
  }

  function alignSelected(direction) {
    if (selectedIds.value.length < 2) return
    const selected = blocks.value.filter(b => selectedIds.value.includes(b.id) && !b.locked)
    if (selected.length < 2) return

    historyStore.push(JSON.parse(JSON.stringify(blocks.value)))

    const lefts = selected.map(b => b.x ?? 0)
    const rights = selected.map(b => (b.x ?? 0) + (b.width ?? 0))
    const tops = selected.map(b => b.y ?? 0)
    const bottoms = selected.map(b => (b.y ?? 0) + (b.height ?? 0))

    const minX = Math.min(...lefts)
    const maxX = Math.max(...rights)
    const minY = Math.min(...tops)
    const maxY = Math.max(...bottoms)

    selected.forEach(b => {
      const idx = blocks.value.findIndex(bl => bl.id === b.id)
      if (idx === -1) return
      
      const block = { ...blocks.value[idx] }

      switch (direction) {
        case 'left':
          block.x = minX
          break
        case 'center':
          block.x = Math.round(minX + (maxX - minX) / 2 - (b.width ?? 0) / 2)
          break
        case 'right':
          block.x = maxX - (b.width ?? 0)
          break
        case 'top':
          // For sections mode, make sure we don't accidentally move it out of its section
          block.y = minY
          break
        case 'middle':
          block.y = Math.round(minY + (maxY - minY) / 2 - (b.height ?? 0) / 2)
          break
        case 'bottom':
          block.y = maxY - (b.height ?? 0)
          break
      }
      blocks.value[idx] = block
    })
  }

  function distributeSelected(axis) {
    if (selectedIds.value.length < 3) return
    const selected = blocks.value.filter(b => selectedIds.value.includes(b.id) && !b.locked)
    if (selected.length < 3) return

    historyStore.push(JSON.parse(JSON.stringify(blocks.value)))

    if (axis === 'horizontal') {
      const sorted = [...selected].sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      
      const totalWidths = sorted.reduce((sum, b) => sum + (b.width ?? 0), 0)
      const firstLeft = first.x ?? 0
      const lastRight = (last.x ?? 0) + (last.width ?? 0)
      
      const totalDist = lastRight - firstLeft
      const availableSpace = totalDist - totalWidths
      const gap = availableSpace / (sorted.length - 1)
      
      let currentX = firstLeft
      sorted.forEach((b) => {
        const idx = blocks.value.findIndex(bl => bl.id === b.id)
        if (idx !== -1) {
          const block = { ...blocks.value[idx] }
          block.x = Math.round(currentX)
          blocks.value[idx] = block
        }
        currentX += (b.width ?? 0) + gap
      })
    } else if (axis === 'vertical') {
      const sorted = [...selected].sort((a, b) => (a.y ?? 0) - (b.y ?? 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      
      const totalHeights = sorted.reduce((sum, b) => sum + (b.height ?? 0), 0)
      const firstTop = first.y ?? 0
      const lastBottom = (last.y ?? 0) + (last.height ?? 0)
      
      const totalDist = lastBottom - firstTop
      const availableSpace = totalDist - totalHeights
      const gap = availableSpace / (sorted.length - 1)
      
      let currentY = firstTop
      sorted.forEach((b) => {
        const idx = blocks.value.findIndex(bl => bl.id === b.id)
        if (idx !== -1) {
          const block = { ...blocks.value[idx] }
          block.y = Math.round(currentY)
          blocks.value[idx] = block
        }
        currentY += (b.height ?? 0) + gap
      })
    }
  }

  const documentPresets = ref(DOCUMENT_PRESETS)

  function clearAll() {
    blocks.value = []
    selectedIds.value = []
  }

  function setBlocks(newBlocks) {
    let settingsStore = null;
    try {
      settingsStore = useSettingsStore();
    } catch(e) {}
    const layoutMode = settingsStore?.layoutMode || 'freeform';

    const tableBlock = newBlocks.find(b => b.type === 'item_table')
    const pageH = 1123;
    const tableBottom = tableBlock ? tableBlock.y + tableBlock.height : 532;

    const migrated = newBlocks.map(block => {
      // --- Transparent migration: legacy 'summary' → 'footer' ---
      // Old schemas stored totals/notes as section:'summary'. The section no
      // longer exists; footer now covers that role (flows after the table).
      if (block.section === 'summary') {
        return { ...block, section: 'footer' };
      }

      if (block.section) return block;
      if (layoutMode === 'sections') {
        if (block.type === 'item_table') {
          return { ...block, section: 'table' };
        }
        if (tableBlock) {
          if (block.y < tableBlock.y) {
            return { ...block, section: 'header' };
          } else {
            // Everything after the table = footer (Y relative to table bottom)
            return { ...block, section: 'footer', y: block.y - tableBottom };
          }
        }
      } else {
        // freeform
        if (block.type === 'item_table') {
          return { ...block, section: 'table' };
        }
        if (tableBlock) {
          return {
            ...block,
            section: block.y < tableBlock.y ? 'header' : 'footer',
          };
        }
      }
      return { ...block, section: 'header' };
    });
    blocks.value = migrated;
    selectedIds.value = [];
  }

  function setDocumentPresets(presets) {
    documentPresets.value = presets
  }

  function loadPreset(documentType, width, height) {
    const preset = documentPresets.value[documentType]
    if (!preset) return
    const newBlocks = preset
      .map(pb => {
        const x = Math.round(pb.xPercent * width)
        const y = Math.round(pb.yPercent * height)
        const w = Math.round(pb.widthPercent * width)
        const h = Math.round(pb.heightPercent * height)
        return getBlockDefaults(pb.type, {
          x,
          y,
          width: w,
          height: h,
          ...pb.defaultProps
        })
      })
      .filter(Boolean)
    setBlocks(newBlocks)
  }

  return {
    blocks,
    selectedIds,
    selectedBlock,
    selectedBlocks,
    orderedBlocks,
    addBlock,
    removeBlock,
    removeSelected,
    updateBlock,
    selectBlock,
    selectBlocks,
    addToSelection,
    clearSelection,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    duplicateBlock,
    copiedBlock,
    copyBlock,
    pasteBlock,
    clearAll,
    setBlocks,
    loadPreset,
    groupSelected,
    ungroupSelected,
    alignSelected,
    distributeSelected,
    documentPresets,
    setDocumentPresets,
  }
})
