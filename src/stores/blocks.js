import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBlockDefaults } from '../utils/blockDefaults.js'
import { DOCUMENT_PRESETS } from '../constants/presets.js'

export const useBlockStore = defineStore('blocks', () => {
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
    const zIndex = blocks.value.length
    blocks.value.push({ ...block, zIndex })
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
    const block = blocks.value.find(b => b.id === id)
    if (!block) return
    const next = blocks.value.find(b => b.zIndex === (block.zIndex ?? 0) + 1)
    if (next) next.zIndex = (block.zIndex ?? 0)
    block.zIndex = (block.zIndex ?? 0) + 1
  }

  function sendBackward(id) {
    const block = blocks.value.find(b => b.id === id)
    if (!block || (block.zIndex ?? 0) <= 0) return
    const prev = blocks.value.find(b => b.zIndex === (block.zIndex ?? 0) - 1)
    if (prev) prev.zIndex = block.zIndex ?? 0
    block.zIndex = (block.zIndex ?? 0) - 1
  }

  function bringToFront(id) {
    const maxZ = Math.max(...blocks.value.map(b => b.zIndex ?? 0))
    updateBlock(id, { zIndex: maxZ + 1 })
  }

  function sendToBack(id) {
    blocks.value.forEach(b => { b.zIndex = (b.zIndex ?? 0) + 1 })
    updateBlock(id, { zIndex: 0 })
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

  function clearAll() {
    blocks.value = []
    selectedIds.value = []
  }

  function setBlocks(newBlocks) {
    blocks.value = newBlocks
    selectedIds.value = []
  }

  function loadPreset(documentType, width, height) {
    const preset = DOCUMENT_PRESETS[documentType]
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
    clearAll,
    setBlocks,
    loadPreset,
  }
})
