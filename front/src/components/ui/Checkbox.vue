<template>
  <div class="form-check" @click="toggle">
    <input
      class="form-check-input"
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
    />
    <label class="form-check-label"><slot></slot></label>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  binary: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const checked = computed(() => !!props.modelValue)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>