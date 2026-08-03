<template>
  <div class="toast-container position-fixed top-0 end-0 p-3">
    <div
      v-for="(t, i) in toasts"
      :key="i"
      class="toast show align-items-center text-bg-{{severity}} border-0"
      :class="'text-bg-' + t.severity"
    >
      <div class="d-flex">
        <div class="toast-body">
          <b v-if="t.summary">{{ t.summary }}</b>
          <span v-if="t.detail">{{ t.detail }}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="remove(i)"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])

function add(t) {
  const toast = { severity: t.severity || 'secondary', summary: t.summary, detail: t.detail }
  toasts.value.push(toast)
  if (t.life) setTimeout(() => remove(toasts.value.indexOf(toast)), t.life)
}

function remove(i) {
  toasts.value.splice(i, 1)
}

defineExpose({ add })
</script>