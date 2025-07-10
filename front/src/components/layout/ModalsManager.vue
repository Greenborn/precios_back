<template>
    <div v-for="_modal of storeApp.modals_" :key="_modal">
      <Dialog 
              :dismissableMask="false" :style="{ width: styles.width, 'max-width': '100vw'}" :modal="true" :header="_modal.titulo" 
              v-model:visible="_modal.activo" @after-hide="_modal.after_hide(_modal)">
        <component :is="_modal.componente" :parametros="_modal.parametros"></component>
      </Dialog>
    </div>
  </template>
  
  <script setup>
    import { ref, onMounted, onBeforeMount } from 'vue';
  
    import { AppStore } from "../../stores/app";
    
    const storeApp = AppStore()
  
    const styles = ref({}) 
  
    const styles_default = {
      width: 'auto'
    }
    const parametros = ref({})
  
    onBeforeMount(() => {
      storeApp.inic_modals()
    })
  
    onMounted(async ()=>{
      styles.value = {...styles_default}
      
      for (let i=0; i < storeApp.modals_.length; i++){
        storeApp.modals_[i].refresh = (config_modal={})=>{
          let k = Object.keys(styles.value)
          for (let c=0; c < k.length; c++){
            if (config_modal.hasOwnProperty('styles') && config_modal.styles.hasOwnProperty(k[c])){
              styles.value[k[c]] = config_modal.styles[k[c]]
            } else {
              styles.value[k[c]] = styles_default[k[c]]
            }
          }
        }
      }
      
    })
  </script>