import { ref } from 'vue'

/**
 * Guide line shape:
 *   { orientation: 'h'|'v', position: number, sectionOffset: number, isCenter?: boolean }
 *
 *  position      — absolute Y (h) or absolute X (v) on the logical paper canvas
 *  sectionOffset — absolute Y offset of the section. Used to convert absolute-Y
 *                  snap back to section-relative-Y for block storage.
 *  isCenter      — true when this is the paper's horizontal-centre guide
 */
export const guideLines = ref([])

// Visual snap distance in screen pixels — divided by zoom at call time
const BASE_SNAP_PX = 8

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Returns the absolute (paper-relative) logical position of a block,
 * plus the section's absolute Y offset.
 */
function getAbsoluteCoords(block, zoom) {
  const paperEl = document.getElementById('canvas-paper')
  if (!paperEl) return { x: block.x, y: block.y, sectionOffsetY: 0 }

  const sectionClass = block.section ? `${block.section}-zone` : null
  if (!sectionClass) return { x: block.x, y: block.y, sectionOffsetY: 0 }

  const sectionEl = paperEl.querySelector('.' + sectionClass)
  if (!sectionEl) return { x: block.x, y: block.y, sectionOffsetY: 0 }

  const paperRect   = paperEl.getBoundingClientRect()
  const sectionRect = sectionEl.getBoundingClientRect()
  const sectionOffsetY = (sectionRect.top - paperRect.top) / zoom

  return { x: block.x, y: sectionOffsetY + block.y, sectionOffsetY }
}

// ─── Compute (called on every mousemove during drag) ─────────────────────────

/**
 * Compute alignment guides for movingBlock against all other blocks.
 * Also adds a paper-centre vertical guide when the block is near centre.
 */
export function computeAlignmentGuides(movingBlock, allBlocks, zoom = 1) {
  const THRESHOLD = BASE_SNAP_PX / zoom
  const guides    = []
  const mb        = movingBlock

  const mbAbs    = getAbsoluteCoords(mb, zoom)
  const mRight   = mbAbs.x + mb.width
  const mBottom  = mbAbs.y + mb.height
  const mCenterX = mbAbs.x + mb.width  / 2
  const mCenterY = mbAbs.y + mb.height / 2

  // ── Paper centre vertical guide ─────────────────────────────────────────
  const paperEl = document.getElementById('canvas-paper')
  if (paperEl) {
    const paperLogicalW = paperEl.getBoundingClientRect().width / zoom
    const centerX = Math.round(paperLogicalW / 2)
    if ([mbAbs.x, mRight, mCenterX].some(e => Math.abs(e - centerX) < THRESHOLD)) {
      guides.push({ orientation: 'v', position: centerX, sectionOffset: 0, isCenter: true })
    }
  }

  // ── Block-to-block guides ────────────────────────────────────────────────
  for (const block of allBlocks) {
    if (block.id === mb.id) continue

    const bAbs    = getAbsoluteCoords(block, zoom)
    const bRight  = bAbs.x + block.width
    const bBottom = bAbs.y + block.height
    const bCenterX = bAbs.x + block.width  / 2
    const bCenterY = bAbs.y + block.height / 2

    // Vertical (X) guides — global
    for (const [mPos, bPos] of [
      [mbAbs.x, bAbs.x], [mbAbs.x, bRight],
      [mRight, bAbs.x],  [mRight, bRight],
      [mCenterX, bCenterX],
    ]) {
      if (Math.abs(mPos - bPos) < THRESHOLD) {
        if (!guides.find(g => g.orientation === 'v' && g.position === bPos))
          guides.push({ orientation: 'v', position: bPos, sectionOffset: 0 })
      }
    }

    // Horizontal (Y) guides — same section only
    if (block.section === mb.section) {
      for (const [mPos, bPos] of [
        [mbAbs.y,  bAbs.y  ],
        [mbAbs.y,  bBottom ],
        [mBottom,  bAbs.y  ],
        [mBottom,  bBottom ],
        [mCenterY, bCenterY],
      ]) {
        if (Math.abs(mPos - bPos) < THRESHOLD) {
          if (!guides.find(g => g.orientation === 'h' && g.position === bPos))
            guides.push({ orientation: 'h', position: bPos, sectionOffset: bAbs.sectionOffsetY })
        }
      }
    }
  }

  guideLines.value = guides
}

// ─── Snap (call immediately after computeAlignmentGuides) ────────────────────

/**
 * Snaps proposedX / proposedY (both section-relative) to the nearest active guide.
 * Guide positions are absolute-paper-relative; conversion uses sectionOffset.
 *
 * @returns {{ x: number, y: number }}
 */
export function applySnap(proposedX, proposedY, block, zoom = 1) {
  const THRESHOLD = BASE_SNAP_PX / zoom
  const abs = getAbsoluteCoords({ ...block, x: proposedX, y: proposedY }, zoom)

  const absRight   = abs.x + block.width
  const absCenterX = abs.x + block.width  / 2
  const absBottom  = abs.y + block.height
  const absCenterY = abs.y + block.height / 2

  let snappedX = proposedX
  let snappedY = proposedY

  for (const guide of guideLines.value) {
    if (guide.orientation === 'v') {
      if      (Math.abs(abs.x     - guide.position) < THRESHOLD) { snappedX = guide.position; break }
      else if (Math.abs(absRight  - guide.position) < THRESHOLD) { snappedX = guide.position - block.width; break }
      else if (Math.abs(absCenterX - guide.position) < THRESHOLD) { snappedX = guide.position - block.width / 2; break }
    }
    if (guide.orientation === 'h') {
      const off = guide.sectionOffset
      if      (Math.abs(abs.y     - guide.position) < THRESHOLD) { snappedY = guide.position - off; break }
      else if (Math.abs(absBottom - guide.position) < THRESHOLD) { snappedY = guide.position - off - block.height; break }
      else if (Math.abs(absCenterY - guide.position) < THRESHOLD) { snappedY = guide.position - off - block.height / 2; break }
    }
  }

  return { x: Math.round(snappedX), y: Math.round(snappedY) }
}

// ─── Clear ───────────────────────────────────────────────────────────────────

export function clearGuides() {
  guideLines.value = []
}
