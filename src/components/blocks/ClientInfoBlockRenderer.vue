<script setup>
import { computed } from "vue";
import { useBlockStore } from "../../stores/blocks.js";
import { getBorderStyle } from "../../utils/blockDefaults.js";

const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const blockStore = useBlockStore();

const style = computed(() => ({
    width: "100%",
    height: "100%",
    padding: `${props.block.paddingTop ?? 4}px ${props.block.paddingRight ?? 8}px ${props.block.paddingBottom ?? 4}px ${props.block.paddingLeft ?? 8}px`,
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 12}px`,
    fontWeight: props.block.fontWeight ?? "normal",
    fontStyle: props.block.fontStyle ?? "normal",
    color: props.block.color ?? "#000000",
    backgroundColor: props.block.backgroundColor ?? "transparent",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: "2px",
    textAlign: props.block.textAlign ?? "left",
    ...getBorderStyle(props.block),
    borderRadius: `${props.block.borderRadius ?? 0}px`,
}));

const defaultOrder = ['name', 'address', 'phone', 'email', 'taxId', 'customFields'];
const fieldOrder = computed(() => props.block.fieldOrder || defaultOrder);

function updateCustomField(index, prop, val) {
    const fields = JSON.parse(JSON.stringify(props.block.customFields || []));
    if (fields[index]) {
        fields[index][prop] = val;
        blockStore.updateBlock(props.block.id, { customFields: fields });
    }
}
</script>

<template>
    <div :style="style">
        <!-- Section Header (label) -->
        <div
            v-if="block.label || fillMode"
            class="client-label text-[10px] uppercase tracking-wider font-semibold opacity-70"
            style="font-size: 0.85em; font-weight: 600; margin-bottom: 2px"
        >
            <input v-if="fillMode"
                type="text"
                :value="block.label ?? 'Bill To'"
                style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; font-weight: inherit; text-transform: uppercase; width: 100%; text-align: inherit;"
                placeholder="Section Header"
                @input="blockStore.updateBlock(block.id, { label: $event.target.value })"
            />
            <span v-else>{{ block.label }}</span>
        </div>
        
        <template v-for="field in fieldOrder" :key="field">
            <!-- Client Name -->
            <div
                v-if="field === 'name' && block.showName !== false && (block.clientName || fillMode)"
                class="client-name font-bold"
                style="font-weight: bold"
            >
                <input v-if="fillMode"
                    type="text"
                    :value="block.clientName ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; font-weight: inherit; color: inherit; width: 100%; text-align: inherit;"
                    placeholder="Client Name"
                    @input="blockStore.updateBlock(block.id, { clientName: $event.target.value })"
                />
                <span v-else>{{ block.clientName }}</span>
            </div>

            <!-- Address -->
            <div
                v-else-if="field === 'address' && block.showAddress !== false && (block.clientAddress || fillMode)"
                class="client-address opacity-90"
                style="white-space: pre-wrap"
            >
                <textarea v-if="fillMode"
                    :value="block.clientAddress ?? ''"
                    style="width: 100%; border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; resize: none; min-height: 36px; text-align: inherit; display: block;"
                    placeholder="Client Address"
                    @input="blockStore.updateBlock(block.id, { clientAddress: $event.target.value })"
                />
                <span v-else>{{ block.clientAddress }}</span>
            </div>

            <!-- Phone -->
            <div
                v-else-if="field === 'phone' && block.showPhone !== false && (block.clientPhone || fillMode)"
                class="client-phone opacity-90"
                style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
            >
                <span class="opacity-70">Tel:</span>
                <input v-if="fillMode"
                    type="text"
                    :value="block.clientPhone ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; flex: 1;"
                    placeholder="Phone"
                    @input="blockStore.updateBlock(block.id, { clientPhone: $event.target.value })"
                />
                <span v-else>{{ block.clientPhone }}</span>
            </div>

            <!-- Email -->
            <div
                v-else-if="field === 'email' && block.showEmail !== false && (block.clientEmail || fillMode)"
                class="client-email opacity-90"
                style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
            >
                <span class="opacity-70">Email:</span>
                <input v-if="fillMode"
                    type="text"
                    :value="block.clientEmail ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; flex: 1;"
                    placeholder="Email"
                    @input="blockStore.updateBlock(block.id, { clientEmail: $event.target.value })"
                />
                <span v-else>{{ block.clientEmail }}</span>
            </div>

            <!-- Tax ID -->
            <div
                v-else-if="field === 'taxId' && block.showTaxId !== false && (block.clientTaxId || fillMode)"
                class="client-tax opacity-90"
                style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
            >
                <span class="opacity-70">Tax ID:</span>
                <input v-if="fillMode"
                    type="text"
                    :value="block.clientTaxId ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; flex: 1;"
                    placeholder="Tax ID"
                    @input="blockStore.updateBlock(block.id, { clientTaxId: $event.target.value })"
                />
                <span v-else>{{ block.clientTaxId }}</span>
            </div>

            <!-- Custom Fields -->
            <template v-else-if="field === 'customFields'">
                <div
                    v-for="(customF, index) in block.customFields ?? []"
                    :key="customF.id"
                    class="client-custom opacity-90"
                    style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
                >
                    <template v-if="fillMode">
                        <input
                            type="text"
                            :value="customF.label ?? ''"
                            style="font-weight: 500; border: none; background: transparent; outline: none; padding: 0; width: 35%; text-align: inherit;"
                            placeholder="Label"
                            @input="updateCustomField(index, 'label', $event.target.value)"
                        />
                        <span>: </span>
                        <input
                            type="text"
                            :value="customF.value ?? ''"
                            style="border: none; background: transparent; outline: none; padding: 0; flex: 1;"
                            placeholder="Value"
                            @input="updateCustomField(index, 'value', $event.target.value)"
                        />
                    </template>
                    <template v-else>
                        <span v-if="customF.label" style="font-weight: 500">{{ customF.label }}: </span>
                        <span>{{ customF.value }}</span>
                    </template>
                </div>
            </template>
        </template>
    </div>
</template>

<style scoped>
.client-label {
    margin-bottom: 2px;
}
</style>
