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
  width: '100%',
  height: '100%',
  padding: `${props.block.paddingTop ?? 4}px ${props.block.paddingRight ?? 8}px ${props.block.paddingBottom ?? 4}px ${props.block.paddingLeft ?? 8}px`,
  fontFamily: props.block.fontFamily ?? 'inherit',
  fontSize: `${props.block.fontSize ?? 11}px`,
  fontWeight: props.block.fontWeight ?? 'normal',
  fontStyle: props.block.fontStyle ?? 'normal',
  color: props.block.color ?? '#555555',
  backgroundColor: props.block.backgroundColor ?? 'transparent',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: props.block.textAlign === 'center' ? 'center' : (props.block.textAlign === 'right' ? 'flex-end' : 'flex-start'),
  ...getBorderStyle(props.block),
  borderRadius: `${props.block.borderRadius ?? 0}px`,
}))

const label = computed(() => props.block.label ?? 'Authorized Signature')

const sigContentJustify = computed(() => {
  const align = props.block.textAlign || 'left';
  return align === 'center' ? 'center' : (align === 'right' ? 'flex-end' : 'flex-start');
})
</script>

<template>
  <div :style="style">
    <!-- Signature Container -->
    <div class="sig-line-container w-full" style="display: flex; flex-direction: column; gap: 4px; width: 100%">
      
      <!-- Signature / Image above the line -->
      <div 
        class="sig-content-area" 
        :style="{ 
          height: '50px', 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: sigContentJustify, 
          width: '100%', 
          position: 'relative' 
        }"
      >
        <!-- Uploaded Image Signature -->
        <template v-if="block.signatureType === 'image' && block.signatureImage">
          <img 
            :src="block.signatureImage" 
            alt="Signature" 
            :style="{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              transform: `scale(${block.signatureScale ?? 1}) rotate(${block.signatureRotation ?? -2}deg)`,
              transformOrigin: 'bottom center',
              opacity: block.signatureOpacity ?? 1
            }" 
            draggable="false"
          />
        </template>
        
        <!-- Script font typed Signature -->
        <template v-else-if="block.signatureType === 'text'">
          <span 
            :style="{
              fontFamily: `${block.signatureFont ?? 'Dancing Script'}, cursive`,
              fontSize: `${block.signatureFontSize ?? 24}px`,
              color: block.signatureColor ?? '#0f2c59',
              transform: `rotate(${block.signatureRotation ?? -3}deg)`,
              transformOrigin: 'bottom center',
              display: 'inline-block',
              userSelect: 'none',
              lineHeight: 1,
              paddingBottom: '2px'
            }"
          >
            {{ block.signatureText || block.signerName || 'Signature' }}
          </span>
        </template>
        
        <!-- Editable / Physical placeholder in fillMode -->
        <template v-else-if="fillMode && (!block.signatureType || block.signatureType === 'none')">
          <div style="font-size: 9px; opacity: 0.4; width: 100%; text-align: center; border: 1px dashed rgba(0,0,0,0.15); padding: 8px 0; border-radius: 4px;">
            Physical Signature Line
          </div>
        </template>
      </div>

      <!-- Signature Line -->
      <div 
        class="sig-line" 
        :style="{ 
          borderColor: block.color ?? '#555555',
          borderTopWidth: `${block.lineWidth ?? 1}px`
        }" 
      />
      
      <!-- Label / Signer Name -->
      <template v-if="fillMode">
        <input
          type="text"
          :value="block.label ?? 'Authorized Signature'"
          style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; font-weight: 500; text-align: inherit; width: 100%;"
          placeholder="Signature Label"
          @input="blockStore.updateBlock(block.id, { label: $event.target.value })"
        />
        <input
          type="text"
          :value="block.signerName ?? ''"
          style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; text-align: inherit; width: 100%; margin-top: 1px;"
          placeholder="Signer Name (e.g. John Doe)"
          @input="blockStore.updateBlock(block.id, { signerName: $event.target.value })"
        />
      </template>
      <template v-else>
        <span class="sig-label" :style="{ textAlign: block.textAlign ?? 'left' }">{{ label }}</span>
        <span v-if="block.signerName" class="sig-signer" :style="{ textAlign: block.textAlign ?? 'left', display: 'block', opacity: 0.9 }">{{ block.signerName }}</span>
      </template>

      <!-- Date line -->
      <div v-if="block.showDate !== false" class="date-line" :style="{ textAlign: block.textAlign ?? 'left', marginTop: '4px' }">
        <span style="opacity: 0.8">Date: </span>
        <input v-if="fillMode"
          type="text"
          :value="block.dateText ?? ''"
          style="border: none; border-bottom: 1px dashed rgba(0,0,0,0.3); background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; width: 120px;"
          placeholder="DD/MM/YYYY"
          @input="blockStore.updateBlock(block.id, { dateText: $event.target.value })"
        />
        <span v-else>{{ block.dateText || '________________________' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Yellowtail&family=Mrs+Saint+Delafield&family=Reenie+Beanie&display=swap');

.sig-line {
  border-top: 1px solid;
  width: 100%;
}
.sig-label {
  font-weight: 500;
  display: block;
}
.date-line {
  opacity: 0.8;
}
</style>
