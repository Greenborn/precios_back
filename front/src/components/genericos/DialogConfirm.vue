<template>
  <div class="row">
    <div class="col">
      <p>{{parametros.texto}}</p>
    </div>
  </div>

  <div class="row justify-content-center">
    <div class="col-auto">
        <Button v-for="(btn) in botones" :key="btn"
          :label="btn.label" :icon="btn.icon" @click="btn.onClick" :class="btn.class" :autofocus="btn.autofocus" />
    </div>
  </div>
  
</template>

<script setup>
  import { AppStore } from "../../stores/app";
  import { ref, onMounted } from 'vue';

  const props = defineProps(['parametros'])
  const storeApp = AppStore()

  const botones = ref([
    { label: 'No', icon: 'pi pi-times', class: 'p-button-text', autofocus:false, onClick: cerrar_dialog_confirmar },
    { label: 'Si', icon: 'pi pi-check', class: 'p-button-text', autofocus:true,  onClick: confirmar_accion }
  ])

  function cerrar_dialog_confirmar(){
    storeApp.modal_generico.activo = false
  }

  function confirmar_accion(){
    storeApp.modal_generico.activo = false
    props.parametros.accion_a_confirmar()
  }

  onMounted(async ()=>{
    if (props.parametros.hasOwnProperty('botones') ){
      botones.value = props.parametros.botones
    }
  })
</script>

<style scoped>
</style>