<template>
  <input
    :id="id"
:type="type"
    class="form-control"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { default: '' },
  type: { type: String, default: 'text' },
  id: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
</script>