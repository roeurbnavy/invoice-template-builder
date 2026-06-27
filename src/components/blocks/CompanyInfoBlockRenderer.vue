<script setup>
import { computed } from "vue";
import { useSettingsStore } from "../../stores/settings.js";
import { useBlockStore } from "../../stores/blocks.js";
import { getBorderStyle } from "../../utils/blockDefaults.js";

const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const settingsStore = useSettingsStore();
const blockStore = useBlockStore();

const companyName = computed(() => props.block.name || settingsStore.company);

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

const defaultOrder = ['name', 'address', 'phone', 'email', 'website', 'customFields'];
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
        <template v-for="field in fieldOrder" :key="field">
            <!-- Name -->
            <div
                v-if="field === 'name' && block.showName !== false"
                class="company-name font-bold text-base"
                style="font-size: 1.15em; font-weight: 750"
            >
                <input v-if="fillMode"
                    type="text"
                    :value="props.block.name || settingsStore.company"
                    style="font-family: inherit; font-size: inherit; font-weight: inherit; color: inherit; width: 100%; border: none; background: transparent; outline: none; padding: 0; text-align: inherit;"
                    placeholder="Company Name"
                    @input="blockStore.updateBlock(block.id, { name: $event.target.value })"
                />
                <span v-else>{{ companyName }}</span>
            </div>

            <!-- Address -->
            <div
                v-else-if="field === 'address' && block.showAddress !== false && (block.address || fillMode)"
                class="company-address opacity-90"
                style="white-space: pre-wrap"
            >
                <textarea v-if="fillMode"
                    :value="block.address ?? ''"
                    style="width: 100%; border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; resize: none; min-height: 36px; text-align: inherit; display: block;"
                    placeholder="Address"
                    @input="blockStore.updateBlock(block.id, { address: $event.target.value })"
                />
                <span v-else>{{ block.address }}</span>
            </div>

            <!-- Phone -->
            <div
                v-else-if="field === 'phone' && block.showPhone !== false && (block.phone || fillMode)"
                class="company-phone opacity-90"
                style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
            >
                <span class="opacity-70">Tel:</span>
                <input v-if="fillMode"
                    type="text"
                    :value="block.phone ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; flex: 1;"
                    placeholder="Phone"
                    @input="blockStore.updateBlock(block.id, { phone: $event.target.value })"
                />
                <span v-else>{{ block.phone }}</span>
            </div>

            <!-- Email -->
            <div
                v-else-if="field === 'email' && block.showEmail !== false && (block.email || fillMode)"
                class="company-email opacity-90"
                style="display: flex; gap: 4px; align-items: center; justify-content: inherit;"
            >
                <span class="opacity-70">Email:</span>
                <input v-if="fillMode"
                    type="text"
                    :value="block.email ?? ''"
                    style="border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; flex: 1;"
                    placeholder="Email"
                    @input="blockStore.updateBlock(block.id, { email: $event.target.value })"
                />
                <span v-else>{{ block.email }}</span>
            </div>

            <!-- Website -->
            <div
                v-else-if="field === 'website' && block.showWebsite !== false && (block.website || fillMode)"
                class="company-website opacity-90"
            >
                <input v-if="fillMode"
                    type="text"
                    :value="block.website ?? ''"
                    style="width: 100%; border: none; background: transparent; outline: none; padding: 0; font-family: inherit; font-size: inherit; color: inherit; text-align: inherit;"
                    placeholder="Website"
                    @input="blockStore.updateBlock(block.id, { website: $event.target.value })"
                />
                <span v-else>{{ block.website }}</span>
            </div>

            <!-- Custom Fields -->
            <template v-else-if="field === 'customFields'">
                <div
                    v-for="(customF, index) in block.customFields ?? []"
                    :key="customF.id"
                    class="company-custom opacity-90"
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
.company-name {
    margin-bottom: 2px;
}
</style>
