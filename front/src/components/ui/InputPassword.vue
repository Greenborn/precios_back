<template>
  <div class="position-relative">
    <input
      :id="id"
      :type="show ? 'text' : 'password'"
      class="form-control pe-5 w-100"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <button
      v-if="toggleMask"
      type="button"
      class="btn-eye-toggle"
      :aria-label="show ? 'Ocultar' : 'Mostrar'"
      @click="show = !show"
    >
      <Icon :name="show ? 'pi-eye-slash' : 'pi-eye'" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { default: '' },
  id: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  toggleMask: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])
const show = ref(false)

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<style scoped>
.btn-eye-toggle {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #495057;
  padding: 0;
  display: flex;
  align-items: center;
}
.btn-eye-toggle:hover {
  color: #0f054c;
}
</style>