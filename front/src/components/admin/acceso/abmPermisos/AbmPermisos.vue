<template>
  <TableEditor
        :api="{ 'get_all': getAllPermisos, 'create': crearPermiso, 'edit': editarPermiso, 'delete': borrarPermiso  }"
        :funcionalidad="funcionalidad_config"
        :permisos="{ 'creacion':[], 'edicion': [], 'eliminacion':[] }"
         @fila_selecionada="fila_selecionada"></TableEditor>
</template>

<script setup>
  import TableEditor from '../../../genericos/TableEditor.vue';
  import { ref, onMounted } from 'vue';
  import { getAllPermisos, crearPermiso, borrarPermiso, editarPermiso } from '@/api/admin/gestionRBAC'
  import { AppStore } from '@/stores/app'

  const storeApp = AppStore()

  const filasSeleccionadas = ref([])

  const funcionalidad_config = ref({
    'modo_seleccion': 'single',
    'nombre_elemento':{ singular: 'Permiso', plural: 'Permisos', genero: 'M' },
  })

  function fila_selecionada( seleccionada ){
    filasSeleccionadas.value = seleccionada
  }

  async function borrar_seleccionado(){
    if ( filasSeleccionadas.value.length == 0 ){
      storeApp.mostrar_alerta( "Es necesario seleccionar un permiso" )
      return
    }

    let res_borrar = await borrarPermiso({ id: filasSeleccionadas.value.id })
    if (res_borrar){
      if (res_borrar.stat){
        storeApp.mostrar_alerta( "Permiso eliminado correctamente" )
      } else {
        storeApp.mostrar_alerta( res_borrar.text )
      }
    } else {
      storeApp.mostrar_alerta( "Error al realizar petición" )
    }
  }

  onMounted(async ()=>{
  })
</script>

<style scoped>
</style>