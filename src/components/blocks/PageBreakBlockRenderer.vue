<script setup>
const props = defineProps({ block: { type: Object, required: true } })
</script>

<template>
  <div
    class="print-hidden"
    style="width: 100%; height: 100%; display: flex; align-items: center; position: relative; pointer-events: none"
  >
    <div style="position: absolute; left: 0; right: 0; border-top: 2px dashed rgba(0, 119, 255, 0.3);" />
    <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: var(--color-panel-bg, #fff); padding: 0 8px; font-size: 9px; color: rgba(0, 119, 255, 0.5); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600">Page Break</span>
  </div>
</template>
