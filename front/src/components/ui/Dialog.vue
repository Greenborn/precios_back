<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click="onMaskClick">
      <div class="dialog-content" :style="dialogStyle">
        <div class="dialog-header">
          <h5 class="dialog-title">{{ header }}</h5>
          <button type="button" class="btn-close" aria-label="Cerrar" @click="close"></button>
        </div>
        <div class="dialog-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  header: { type: String, default: '' },
  modal: { type: Boolean, default: false },
  dismissableMask: { type: Boolean, default: true },
  style: { type: [String, Object], default: '' },
  closable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:visible', 'after-hide', 'hide'])

const dialogStyle = computed(() => {
  if (typeof props.style === 'string') return props.style
  return props.style || {}
})

function close() {
  emit('update:visible', false)
  emit('hide')
  emit('after-hide')
}

function onMaskClick() {
  if (props.dismissableMask) close()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}
.dialog-content {
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  margin: auto;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e9ecef;
}
.dialog-title {
  margin: 0;
  font-weight: 600;
}
.dialog-body {
  padding: 1.25rem;
}
</style>