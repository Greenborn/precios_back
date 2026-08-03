<template>
  <div class="position-relative multiselect-local" :style="style">
    <button type="button" class="form-control ms-trigger text-start d-flex justify-content-between align-items-center" @click="open = !open">
      <span :class="{ 'text-muted': selectedDisplay.length === 0 }">{{ selectedDisplay.length ? selectedDisplay.join(', ') : placeholder }}</span>
      <Icon :name="open ? 'pi-chevron-up' : 'pi-chevron-down'" />
    </button>

    <div v-if="open" class="ms-dropdown">
      <span class="form-check ms-option" v-for="opt in options" :key="optionKey(opt)">
        <input class="form-check-input" type="checkbox" :checked="isSelected(opt)" @change="onToggle(opt)" />
        <label class="form-check-label">{{ optionLabel(opt) }}</label>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
  placeholder: { type: String, default: '' },
  style: { type: [String, Object], default: '' }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)

function optionLabel(opt) {
  return opt && typeof opt === 'object' ? opt[props.optionLabel] : opt
}
function optionValue(opt) {
  return opt && typeof opt === 'object' ? opt[props.optionValue] : opt
}
function optionKey(opt) {
  return optionValue(opt)
}
function isSelected(opt) {
  return props.modelValue.some(v => v == optionValue(opt))
}
function onToggle(opt) {
  const val = optionValue(opt)
  const next = isSelected(opt) ? props.modelValue.filter(v => v != val) : [...props.modelValue, val]
  emit('update:modelValue', next)
}
const selectedDisplay = computed(() =>
  props.options.filter(opt => props.modelValue.some(v => String(v) === String(optionValue(opt)))).map(opt => optionLabel(opt))
)
</script>

<style scoped>
.ms-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 90;
  background: #fff;
  border: 1px solid #ced4da;
  border-top: none;
  max-height: 240px;
  overflow-y: auto;
}
.ms-option {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  margin: 0;
  cursor: pointer;
}
.ms-option:hover {
  background: #f1f3f5;
}
</style>