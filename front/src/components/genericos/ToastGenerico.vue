<template>
  <Toast ref="toastRef" />
</template>

<script setup>
import { ref } from 'vue';
import Toast from "../ui/Toast.vue";

const toastRef = ref(null);

defineExpose({
  toast: (config) => toastRef.value && toastRef.value.add(config),
});
</script>