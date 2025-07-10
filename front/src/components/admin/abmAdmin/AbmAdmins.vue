<template>
  <TableEditor
        :api="{ 'get_all': get_all, 'create': add_one, 'edit': put_one, 'delete': delete_one }"
        :funcionalidad="funcionalidad_config"
        :permisos="{ 'creacion':[], 'edicion': [], 'eliminacion':[] }"
         @fila_selecionada="fila_selecionada"></TableEditor>
</template>

<script setup>
  import TableEditor from '@/components/genericos/TableEditor.vue'
  import { get_all, add_one, put_one, delete_one } from '@/api/admin/gestionUsuarios'
  import { getAllRoles } from '@/api/admin/gestionRBAC'
  import { ref, onMounted } from 'vue'
  import { AppStore } from "@/stores/app"

  const storeApp = AppStore()

  const listado_roles = ref([])

  const funcionalidad_config = ref({
    'modo_seleccion': 'single',
    'nombre_elemento':{ singular: 'Usuario', plural: 'Usuarios', genero: 'M' },
    'campos_extras':{
      'create': [
        { field: "pass", headerName: 'Contraseña', form_type: 'password'  },
        { field: "pass_repeat", headerName: 'Repetir contraseña', form_type: 'password'  },
      ],
      'edit': [
        { field: "pass", headerName: 'Contraseña', form_type: 'password'  },
        { field: "pass_repeat", headerName: 'Repetir contraseña', form_type: 'password'  },
      ],
    }
  })

  onMounted(async ()=>{
    storeApp.loading = true
    let peticion_roles = await getAllRoles()
    if (peticion_roles){
      listado_roles.value = peticion_roles.data
      //en la configuracion de campos para la creacion de nuevo user, se agrega configuración de roles
      let config_campo_roles = {
        field: 'roles', headerName: 'Roles', form_type: 'multi_select',
        rel_table: {
          'rows': listado_roles.value.rows,
          'descr_field': 'nombre',
          'id_field': 'id',
          'headerName': 'Rol'
        }
      }      
      funcionalidad_config.value.campos_extras.create.push(config_campo_roles)
      funcionalidad_config.value.campos_extras.edit.push(config_campo_roles)
      storeApp.loading = false
    } else {
      storeApp.loading = false
      storeApp.mostrar_alerta( 'No se pudo cargar listado de roles, por favor reintente.' )
    }
  })

  const usuario_seleccionado = ref(null)

  function fila_selecionada( selecionado ){
    usuario_seleccionado.value = selecionado
  }
</script>

<style scoped>
</style>