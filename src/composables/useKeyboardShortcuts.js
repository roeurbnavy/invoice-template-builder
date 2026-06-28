import { onMounted, onUnmounted } from 'vue'
import { useBlockStore } from '../stores/blocks.js'
import { useHistoryStore } from '../stores/history.js'
import { useCanvasStore } from '../stores/canvas.js'

export function useKeyboardShortcuts() {
  const blockStore = useBlockStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()

  function getSnapshot() {
    return JSON.parse(JSON.stringify(blockStore.blocks))
  }

  function handleKeyDown(e) {
    const tag = document.activeElement?.tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    const isEditing = document.activeElement?.contentEditable === 'true'
    if (isInput || isEditing) return

    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey

    const key = (e.key || '').toLowerCase()
    const code = e.code || ''

    const isZ = code === 'KeyZ' || key === 'z'
    const isY = code === 'KeyY' || key === 'y'
    const isS = code === 'KeyS' || key === 's'
    const isD = code === 'KeyD' || key === 'd'
    const isC = code === 'KeyC' || key === 'c'
    const isV = code === 'KeyV' || key === 'v'
    const isA = code === 'KeyA' || key === 'a'
    const isL = code === 'KeyL' || key === 'l'

    switch (true) {
      // Undo
      case ctrl && !shift && isZ: {
        e.preventDefault()
        const snapshot = historyStore.undo()
        if (snapshot) blockStore.setBlocks(snapshot)
        break
      }
      // Redo
      case ctrl && shift && isZ:
      case ctrl && isY: {
        e.preventDefault()
        const snapshot = historyStore.redo()
        if (snapshot) blockStore.setBlocks(snapshot)
        break
      }
      // Save
      case ctrl && isS: {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('app:save'))
        break
      }
      // Copy
      case ctrl && isC: {
        e.preventDefault()
        if (blockStore.selectedBlock) {
          blockStore.copyBlock(blockStore.selectedBlock.id)
        }
        break
      }
      // Paste
      case ctrl && isV: {
        e.preventDefault()
        if (blockStore.copiedBlock) {
          historyStore.push(getSnapshot())
          blockStore.pasteBlock()
        }
        break
      }
      // Duplicate
      case ctrl && isD: {
        e.preventDefault()
        if (blockStore.selectedBlock) {
          historyStore.push(getSnapshot())
          blockStore.duplicateBlock(blockStore.selectedBlock.id)
        }
        break
      }
      // Select all
      case ctrl && isA: {
        e.preventDefault()
        blockStore.selectBlocks(blockStore.blocks.map(b => b.id))
        break
      }
      // Delete
      case e.key === 'Delete' || e.key === 'Backspace': {
        if (blockStore.selectedIds.length > 0) {
          e.preventDefault()
          historyStore.push(getSnapshot())
          blockStore.removeSelected()
        }
        break
      }
      // Deselect
      case e.key === 'Escape': {
        blockStore.clearSelection()
        break
      }
      // Bring forward
      case e.key === ']' && !ctrl: {
        if (blockStore.selectedBlock) {
          blockStore.bringForward(blockStore.selectedBlock.id)
        }
        break
      }
      // Send backward
      case e.key === '[' && !ctrl: {
        if (blockStore.selectedBlock) {
          blockStore.sendBackward(blockStore.selectedBlock.id)
        }
        break
      }
      // Lock
      case ctrl && isL: {
        e.preventDefault()
        if (blockStore.selectedBlock) {
          const b = blockStore.selectedBlock
          blockStore.updateBlock(b.id, { locked: !b.locked })
        }
        break
      }
      // Zoom
      case ctrl && e.key === '=':
      case ctrl && e.key === '+': {
        e.preventDefault()
        canvasStore.zoomIn()
        break
      }
      case ctrl && e.key === '-': {
        e.preventDefault()
        canvasStore.zoomOut()
        break
      }
      case ctrl && e.key === '0': {
        e.preventDefault()
        canvasStore.resetZoom()
        break
      }
      // Nudge selected blocks
      case e.key === 'ArrowLeft': {
        e.preventDefault()
        nudgeSelected(shift ? -10 : -1, 0)
        break
      }
      case e.key === 'ArrowRight': {
        e.preventDefault()
        nudgeSelected(shift ? 10 : 1, 0)
        break
      }
      case e.key === 'ArrowUp': {
        e.preventDefault()
        nudgeSelected(0, shift ? -10 : -1)
        break
      }
      case e.key === 'ArrowDown': {
        e.preventDefault()
        nudgeSelected(0, shift ? 10 : 1)
        break
      }
    }
  }

  function nudgeSelected(dx, dy) {
    blockStore.selectedIds.forEach(id => {
      const block = blockStore.blocks.find(b => b.id === id)
      if (!block || block.locked) return
      blockStore.updateBlock(id, { x: (block.x ?? 0) + dx, y: (block.y ?? 0) + dy })
    })
  }

  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
}
