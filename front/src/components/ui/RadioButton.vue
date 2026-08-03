<template>
  <div class="form-check form-check-inline" @click="select">
    <input
      class="form-check-input"
      type="radio"
      :name="name"
      :id="id"
      :checked="isChecked"
      :disabled="disabled"
    />
    <label class="form-check-label" :for="id"><slot></slot></label>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { default: null },
  value: { default: null },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => props.modelValue == props.value)

function select() {
  if (props.disabled) return
  emit('update:modelValue', props.value)
}
</script>