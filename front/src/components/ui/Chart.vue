<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart as ChartJS } from 'chart.js/auto'

const props = defineProps({
  type: { type: String, default: 'line' },
  data: { type: Object, default: () => ({}) },
  options: { type: Object, default: () => ({}) }
})

const canvas = ref(null)
let chart = null

function render() {
  const el = canvas.value
  if (!el) return
  if (chart) chart.destroy()
  chart = new ChartJS(el, { type: props.type, data: props.data, options: props.options })
}

onMounted(render)
onBeforeUnmount(() => { if (chart) chart.destroy() })
watch(() => [props.data, props.options, props.type], () => render(), { deep: true })
</script>