<script setup>
import { computed, ref, watch, nextTick } from "vue";
import { useCanvasStore } from "../../stores/canvas.js";
import { useBlockStore } from "../../stores/blocks.js";
import { useHistoryStore } from "../../stores/history.js";
import { getBorderStyle } from "../../utils/blockDefaults.js";

const props = defineProps({
    block: { type: Object, required: true },
    fillMode: { type: Boolean, default: false },
});

const canvasStore = useCanvasStore();
const blockStore = useBlockStore();
const historyStore = useHistoryStore();

const editingField = ref(null);

const subtotalLabel = computed(() => props.block.subtotalLabel ?? "Subtotal:");
const subtotalValue = computed(() => props.block.subtotalValue ?? "$0.00");
const discountLabel = computed(() => props.block.discountLabel ?? "Discount:");
const discountValue = computed(() => props.block.discountValue ?? "$0.00");
const taxLabel = computed(() => props.block.taxLabel ?? "Tax (10%):");
const taxValue = computed(() => props.block.taxValue ?? "$0.00");
const totalLabel = computed(() => props.block.totalLabel ?? "Grand Total:");
const totalValue = computed(() => props.block.totalValue ?? "$0.00");
const balanceLabel = computed(() => props.block.balanceLabel ?? "Balance Due:");
const balanceValue = computed(() => props.block.balanceValue ?? "$0.00");

function updateProp(field, val) {
    blockStore.updateBlock(props.block.id, { [field]: val });
}

function commitHistory() {
    historyStore.push(JSON.parse(JSON.stringify(blockStore.blocks)));
}

watch(editingField, (newField) => {
    if (newField) {
        nextTick(() => {
            const input = document.querySelector(".totals-edit-input");
            if (input) {
                input.focus();
                input.select();
            }
        });
    }
});

const style = computed(() => ({
    width: "100%",
    height: "100%",
    padding: `${props.block.paddingTop ?? 4}px ${props.block.paddingRight ?? 8}px ${props.block.paddingBottom ?? 4}px ${props.block.paddingLeft ?? 8}px`,
    fontFamily: props.block.fontFamily ?? "inherit",
    fontSize: `${props.block.fontSize ?? 13}px`,
    fontWeight: props.block.fontWeight ?? "normal",
    fontStyle: props.block.fontStyle ?? "normal",
    color: props.block.color ?? "#000000",
    backgroundColor: props.block.backgroundColor ?? "transparent",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "4px",
    ...getBorderStyle(props.block),
    borderRadius: `${props.block.borderRadius ?? 0}px`,
}));
</script>

<template>
    <div :style="style">
        <div v-if="block.showSubtotal !== false" class="total-row">
            <span class="total-label" @click="editingField = 'subtotalLabel'">
                <input v-if="fillMode && editingField === 'subtotalLabel'" :value="subtotalLabel" class="totals-edit-input" @input="updateProp('subtotalLabel', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ subtotalLabel }}</span>
            </span>
            <span class="total-value" @click="editingField = 'subtotalValue'">
                <input v-if="fillMode && editingField === 'subtotalValue'" :value="subtotalValue" class="totals-edit-input text-right" @input="updateProp('subtotalValue', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ subtotalValue }}</span>
            </span>
        </div>
        <div v-if="block.showDiscount !== false" class="total-row">
            <span class="total-label" @click="editingField = 'discountLabel'">
                <input v-if="fillMode && editingField === 'discountLabel'" :value="discountLabel" class="totals-edit-input" @input="updateProp('discountLabel', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ discountLabel }}</span>
            </span>
            <span class="total-value" @click="editingField = 'discountValue'">
                <input v-if="fillMode && editingField === 'discountValue'" :value="discountValue" class="totals-edit-input text-right" @input="updateProp('discountValue', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ discountValue }}</span>
            </span>
        </div>
        <div v-if="block.showTax !== false" class="total-row">
            <span class="total-label" @click="editingField = 'taxLabel'">
                <input v-if="fillMode && editingField === 'taxLabel'" :value="taxLabel" class="totals-edit-input" @input="updateProp('taxLabel', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ taxLabel }}</span>
            </span>
            <span class="total-value" @click="editingField = 'taxValue'">
                <input v-if="fillMode && editingField === 'taxValue'" :value="taxValue" class="totals-edit-input text-right" @input="updateProp('taxValue', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ taxValue }}</span>
            </span>
        </div>
        <div v-if="block.showTotal !== false" class="total-row total-grand">
            <span class="total-label font-bold" @click="editingField = 'totalLabel'">
                <input v-if="fillMode && editingField === 'totalLabel'" :value="totalLabel" class="totals-edit-input font-bold" @input="updateProp('totalLabel', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ totalLabel }}</span>
            </span>
            <span class="total-value font-bold" @click="editingField = 'totalValue'">
                <input v-if="fillMode && editingField === 'totalValue'" :value="totalValue" class="totals-edit-input text-right font-bold" @input="updateProp('totalValue', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ totalValue }}</span>
            </span>
        </div>
        <div v-if="block.showBalance" class="total-row total-balance">
            <span class="total-label" @click="editingField = 'balanceLabel'">
                <input v-if="fillMode && editingField === 'balanceLabel'" :value="balanceLabel" class="totals-edit-input" @input="updateProp('balanceLabel', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ balanceLabel }}</span>
            </span>
            <span class="total-value font-bold text-danger" @click="editingField = 'balanceValue'">
                <input v-if="fillMode && editingField === 'balanceValue'" :value="balanceValue" class="totals-edit-input text-right font-bold text-danger" @input="updateProp('balanceValue', $event.target.value)" @blur="editingField = null; commitHistory()" @keydown.enter="editingField = null; commitHistory()" @keydown.esc="editingField = null" />
                <span v-else>{{ balanceValue }}</span>
            </span>
        </div>
    </div>
</template>

<style scoped>
.total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.total-grand {
    border-top: 1px solid rgba(0, 0, 0, 0.15);
    padding-top: 4px;
    margin-top: 2px;
}
.total-balance {
    background: rgba(230, 57, 70, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
}
.totals-edit-input {
    background: white;
    color: black;
    border: 1px solid #00b4d8;
    outline: none;
    font-size: inherit;
    font-family: inherit;
    font-weight: inherit;
    padding: 0 2px;
    width: 100px;
    box-sizing: border-box;
    border-radius: 3px;
}
.totals-edit-input.text-right {
    text-align: right;
}
</style>
