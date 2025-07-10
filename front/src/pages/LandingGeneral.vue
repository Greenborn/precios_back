<template>
  <PublicTopBar @buscar_evnt="buscar" />
  
  <BusquedaPrincipal ref="busqueda_y_carga" />
  
</template>

<script setup>
import { ref } from 'vue'
import PublicTopBar from "../components/publico/PublicTopBar.vue";
import BusquedaPrincipal from "../components/publico/BusquedaPrincipal.vue";

const busqueda_y_carga = ref()

async function buscar( termino_busqueda ){
  await busqueda_y_carga.value.buscar(termino_busqueda)
}
</script>

<style scoped>

</style>