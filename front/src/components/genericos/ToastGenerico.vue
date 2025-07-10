<template>
  <Toast />
</template>

<script setup>
import { useToast } from "primevue/usetoast";
const toast = useToast();

interface IToast {
  severity: string;
  summary: string;
  detail: string;
  life: numeric;
}

const props = defineProps({
  config: Object,
});

onMounted(() => {
  
});

const toastLoad = (toast:IToast) => {
  return toast;
};
</script>
