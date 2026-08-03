<template>
  <div class="editor-local">
    <textarea
      class="form-control"
      :value="modelValue"
      :style="styleObject"
      @input="onInput"
    ></textarea>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { default: '' },
  editorStyle: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

const styleObject = computed(() => {
  const s = {}
  const m = /height:\s*([^;\s]+)/.exec(props.editorStyle)
  if (m) s.height = m[1]
  return s
})
</script>