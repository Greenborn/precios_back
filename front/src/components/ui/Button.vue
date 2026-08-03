<template>
  <button
    type="button"
    class="btn"
    :class="classes"
    :disabled="disabled"
    :autofocus="autofocus"
    @click="onClick"
  >
    <Icon v-if="icon && iconPos !== 'right'" :name="icon" class="me-1" />
    <slot>{{ label }}</slot>
    <Icon v-if="icon && iconPos === 'right'" :name="icon" class="ms-1" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  iconPos: { type: String, default: 'left' },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  class: { type: [String, Array, Object], default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const classes = computed(() => {
  const variants = ['p-button-danger', 'p-button-text', 'btn-primary', 'btn-secondary']
  const has = (c) => String(props.class).split(/\s+/).includes(c)
  if (has('p-button-danger')) return ['btn-outline-danger', 'local-btn', props.class]
  if (has('p-button-text')) return ['btn-link', 'local-btn', props.class]
  return ['btn-primary', 'local-btn', props.class]
})

// eslint-disable-next-line no-unused-vars
function onClick(e) {
  if (props.disabled || props.loading) return
  emit('click', e)
}
</script>

<style scoped>
.local-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>