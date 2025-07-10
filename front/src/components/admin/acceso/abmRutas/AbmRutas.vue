<template>
  <TableEditor
        :api="{ 'get_all': getAllRutas, 'create': crearRuta, 'edit': editarRuta, 'delete': borrarRuta }"
        :funcionalidad="funcionalidad_config"
        :permisos="{ 'creacion':[], 'edicion': [], 'eliminacion':[] }"
        @abm_cargado="abm_listo = true"
        ref="table_editor"></TableEditor>

</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { getAllRutas, crearRuta, borrarRuta, editarRuta } from '@/api/admin/gestionRBAC'
  import { AppStore } from '@/stores/app'
  import TableEditor from '../../../genericos/TableEditor.vue';

  const storeApp = AppStore()
  const abm_listo = ref(false)

  const table_editor       = ref()
  const funcionalidad_config = ref({
    'modo_seleccion': 'single',
    'nombre_elemento':{ singular: 'Ruta', plural: 'Rutas', genero: 'F' },
  })


  onMounted(async ()=>{
    abm_listo.value = false
  })
</script>

<style scoped>
</style>