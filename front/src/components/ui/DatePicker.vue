<template>
  <input type="date" class="form-control" :value="valueISO" @change="onChange" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { default: null },
  dateFormat: { type: String, default: 'dd.mm.yy' }
})

const emit = defineEmits(['update:modelValue'])

const valueISO = computed(() => {
  if (!props.modelValue) return ''
  const d = new Date(props.modelValue)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
})

function onChange(e) {
  const v = e.target.value // yyyy-mm-dd
  if (!v) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', new Date(v + 'T00:00:00'))
}
</script>