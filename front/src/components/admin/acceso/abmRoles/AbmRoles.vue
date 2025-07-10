<template>
  <div class="row" v-if="abm_listo">
    <div class="col">
      
      <Button label="Vincular permiso" icon="pi pi-link" iconPos="right" 
              class="ml-2"
              @click="vincular_permiso" />
      <Button label="Vincular usuario" icon="pi pi-link" iconPos="right" 
              class="ml-2"
              @click="vincular_permiso" />
    </div>
  </div>

  <TableEditor
      :api="{ 'get_all': getAllRoles, 'create': crearRol, 'edit': editarRol, 'delete': borrarRol }"
      :funcionalidad="funcionalidad_config"
      :permisos="{ 'creacion':[], 'edicion': [], 'eliminacion':[] }"
      @abm_cargado="abm_listo = true"
      @fila_selecionada="fila_selecionada"></TableEditor>
</template>

<script setup>
  import TableEditor from '../../../genericos/TableEditor.vue';
  import { ref, onMounted } from 'vue';
  import { getAllRoles, crearRol, borrarRol, editarRol, vincularPermiso, getAllPermisos } from '@/api/admin/gestionRBAC'
  import { AppStore } from '@/stores/app'

  import  FormularioGenerico  from '@/components/genericos/FormularioGenerico'

  const storeApp = AppStore()
  const abm_listo = ref(false)

  const filasSeleccionadas = ref([])

  const funcionalidad_config = ref({
    'modo_seleccion': 'single',
    'nombre_elemento':{ singular: 'Rol', plural: 'Roles', genero: 'M' },
  })

  const modelo_vinculo_permiso = ref({
    id_rol: '',
    id_permiso: '',
    nombre_rol: ''
  })

  function fila_selecionada( seleccionada ){
    filasSeleccionadas.value = seleccionada
  }

  async function vincular_permiso(){
    if ( filasSeleccionadas.value.length == 0 ){
      storeApp.mostrar_alerta( "Es necesario seleccionar un rol" )
      return
    }

    storeApp.loading = true
    let permisos_req = await getAllPermisos()
    if (permisos_req){
      storeApp.loading = false
      modelo_vinculo_permiso.value.id_rol     = filasSeleccionadas.value.id
      modelo_vinculo_permiso.value.nombre_rol = filasSeleccionadas.value.nombre

      storeApp.mostrar_modal( FormularioGenerico, 'Vincular Permiso', 
        { 
          "onSubmit": vincularPermiso, 
          "guardado": permiso_vinculado, 
          "modelo": modelo_vinculo_permiso.value,
          "campos": [
            { "field":"id_rol",     "headerName": "ID Rol", "visible_form": false },
            { "field":"nombre_rol", "headerName": "Rol" },
            { "field":"id_permiso", "headerName": "ID Permiso", "form_type": "select" }
          ],
          "selectData": { "id_permiso": { data: permisos_req.data.rows, label:"descripcion", placeholder:"Seleccionar permiso", optionValue:"id" } }
        } )
    } else {
      storeApp.loading = false
    }
  }

  function permiso_vinculado( res_peticion ){
    storeApp.mostrar_alerta( res_peticion.text )
  }

  onMounted(async ()=>{
    abm_listo.value = false
  })
</script>

<style scoped>
</style>