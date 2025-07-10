<template>
  <div v-if="loading" class="portal-spinner-content">
    <ProgressSpinner class="spinner" style="styleSpinner" />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import ProgressSpinner from "primevue/progressspinner";

const styleSpinner = reactive({
  width: "50px",
  height: "50px",
});

const props = defineProps({
  loading: Boolean,
});
</script>
<style scoped>
.portal-spinner-content {
  position: fixed;
  width: 100vw;
  background-color: rgba(255,255,255,.8);
  height: 100vh;
  z-index: 10000;
  top: 0px;
  left: 0px;
  text-align: center; 
}

.spinner{
  height: 100vh;
}

</style>
