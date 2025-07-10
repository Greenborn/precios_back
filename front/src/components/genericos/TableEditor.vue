<template>
  <div v-if="abm_load" class="row">
    <div class="col">
      <Button v-if="api.create"
              :label="textos['create']" icon="pi pi-plus" iconPos="right" 
              @click="nuevo" />

      <Button v-if="api.edit"
              :label="textos['edit']" icon="pi pi-pencil" iconPos="right" 
              class="ml-2"
              :disabled="habilita_edicion"
              @click="editar" />

      <Button v-if="api.delete"
              :label="textos['delete']" icon="pi pi-trash" iconPos="right" 
              class="p-button-danger ml-2"
              :disabled="habilita_edicion"
              @click="borrar" />

    </div>
  </div>

  <div class="row">
    <div class="col">

      <DataTable 
        :value="registros" 
        stripedRows responsiveLayout="scroll" 
        class="p-datatable-sm w-100"
        filterDisplay="row" v-model:filters="filtros"

        :paginator="true" :rows="cant_registros_show" 
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rowsPerPageOptions="rows_per_page_options"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"

        removableSort
        v-model:selection="filasSeleccionadas" :selectionMode="modo_seleccion"
        @row-select="onRowChange" @row-unselect="onRowChange" @row-dblclick="onDobleClick"
        scrollHeight="80vh" scrollDirection="both"
        :resizableColumns="true" columnResizeMode="expand" showGridlines
        :reorderableColumns="true"
        :globalFilterFields="getFieldsForFilter( listado_columnas )">

        <template #header>
            <div style="text-align:left">
                <MultiSelect :modelValue="selectedColumns" :options="seleccionGlobal" optionLabel="headerName" @update:modelValue="onToggleColumnSelect"
                    placeholder="Columnas" style="width: 20em"/>
            </div>
            <div class="flex justify-content-end">
                <span class="p-input-icon-left " v-if="filtros['global']">
                    <i class="pi pi-search" />
                    <InputText v-model="filtros['global'].value" placeholder="Busqueda" />
                </span>
            </div>
        </template>
        <Column :selectionMode="modo_seleccion" headerStyle="width: 3em"></Column>
        <Column v-for="col of selectedColumns" 
                :sortable="col.sortable" 
                :field="col.field" :header="col.headerName" :key="col.field">
          <template #body="{data}">
            {{data[col.field]}}
          </template>
          <template #filter="{filterModel}">
              <InputText v-if="filterModel != undefined"  type="text" v-model="filterModel.value" class="p-column-filter" placeholder=""/>
          </template>
        </Column>
        
      </DataTable>

    </div>
  </div>
  
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import  DialogConfirm       from '@/components/genericos/DialogConfirm'
  import  FormularioGenerico  from '@/components/genericos/FormularioGenerico'
  import { mapFilaJSONtabla, getCamposJSONyFieldDef, getCamposJson } from '@/helpers/mapCampoJSON'
  import { getProcessFieldDef, getFieldsForFilter, getFiltersFrFields, getFieldDefFFormated } from '@/helpers/procesarFieldDef';
  import { row_formatter } from '@/helpers/formatter';
  import { AppStore } from "@/stores/app";
  const storeApp = AppStore()
  const props = defineProps(['api', 'permisos', 'funcionalidad'])
  const emit  = defineEmits(['abm_cargado', 'fila_selecionada'])
  const registros           = ref([])
  const listado_columnas    = ref({}) 
  const filasSeleccionadas  = ref([])
  const selectedColumns     = ref([])
  const seleccionGlobal     = ref([])
  const abm_load            = ref(false)
  const filtros             = ref({})
  const cant_registros_show = ref(10)
  const rows_per_page_options = ref([10,15,20,50,100,200])
  const habilita_edicion    = ref(true)
    
  const textos = ref({
    'create': 'Nuevo',
    'edit': 'Editar',
    'delete': 'Borrar',
    'article': 'un',
    'deleted': 'eliminado'
  })
  const modo_seleccion = ref('single')
  const modelo = ref({})
  function cargar_config(){
    if (props.funcionalidad.hasOwnProperty('modo_seleccion'))
      modo_seleccion.value = props.funcionalidad.modo_seleccion
    if (props.funcionalidad.nombre_elemento.genero === 'F'){
      textos.value = {
        'create': 'Nueva',
        'edit': 'Editar',
        'delete': 'Borrar',
        'article': 'una',
        'deleted': 'eliminada'
      }
    }

    if (props.funcionalidad.hasOwnProperty('cant_registros_show'))
      cant_registros_show.value = props.funcionalidad.cant_registros_show
    if (props.funcionalidad.hasOwnProperty('rows_per_page_options'))
      rows_per_page_options.value = props.funcionalidad.rows_per_page_options
  }

  function onDobleClick( event ){
    editar()
  }

  function onRowChange(){
    if (
        (filasSeleccionadas.value.length != undefined && filasSeleccionadas.value != undefined && modo_seleccion.value === 'single') ||
        (filasSeleccionadas.value.length != undefined && filasSeleccionadas.value.length != 1 && modo_seleccion.value === 'multiple') 
      ){
      habilita_edicion.value = true
    } else {
      habilita_edicion.value = false
    }
    emit('fila_selecionada', filasSeleccionadas.value)
  }
  function onToggleColumnSelect(value) {
    selectedColumns.value = listado_columnas.value.filter(col => value.includes(col));
  }
  function abm_cargado( status ){
    abm_load.value = status
    emit('abm_cargado', abm_load.value)
  }
  async function nuevo(){
    let campos_form = [... listado_columnas.value]
    let configuracion_form = { 
        "onSubmit": props.api.create, 
        "guardado": actualizar_listado, 
        "modelo": modelo.value,
        "campos": campos_form,
        "quitar_campos": [ 'id' ]   
      }
    //revisamos si es necesario agregar nuevos campos especificos para el endpoint de creación
    if (props.funcionalidad.hasOwnProperty('campos_extras') && props.funcionalidad.campos_extras.hasOwnProperty('create')){
      for (let c=0; c < props.funcionalidad.campos_extras.create.length; c++){
        campos_form.push(props.funcionalidad.campos_extras.create[c])
      }
    }

    //mostramos el formulario de creación
    storeApp.mostrar_modal( FormularioGenerico, textos.value['create']+' '+props.funcionalidad.nombre_elemento.singular, configuracion_form )
  }
  async function editar(){
    if ( props.api.edit == undefined)
      return
    
    if ( filasSeleccionadas.value.length == 0 ){
      storeApp.mostrar_alerta( "Es necesario seleccionar "+ textos.value['article'] + ' ' + props.funcionalidad.nombre_elemento.singular)
      return
    }
    let data_row = filasSeleccionadas.value
    if (modo_seleccion.value == 'multiple'){
      data_row = data_row[0]
    }

    let campos_form = [... listado_columnas.value]

    //revisamos si es necesario agregar nuevos campos especificos para el endpoint de creación
    if (props.funcionalidad.hasOwnProperty('campos_extras') && props.funcionalidad.campos_extras.hasOwnProperty('edit')){
      for (let c=0; c < props.funcionalidad.campos_extras.edit.length; c++){
        campos_form.push(props.funcionalidad.campos_extras.edit[c])
      }
    }

    //se muestra formulario de edicion
    storeApp.mostrar_modal( FormularioGenerico, 'Editar ' + props.funcionalidad.nombre_elemento.singular, 
      { 
        "onSubmit": props.api.edit, 
        "guardado": actualizar_listado, 
        "modelo": data_row,
        "campos": campos_form,
        "quitar_campos": [ 'id' ] 
      } )
  }
  async function borrar(){
    if ( filasSeleccionadas.value.length == 0 ){
      storeApp.mostrar_alerta( "Es necesario seleccionar " + textos.value['article'] + ' ' + props.funcionalidad.nombre_elemento.singular )
      return
    }
    storeApp.mostrar_modal( DialogConfirm, 'Confirmar', { 
        "accion_a_confirmar": confirm_borrar, 
        "texto": "¿Está seguro?"
      })
    
  }
  async function confirm_borrar(){
    storeApp.loading = true
    let res_borrar = await props.api.delete({ id: filasSeleccionadas.value.id })
    if (res_borrar){
      storeApp.loading = false
      filasSeleccionadas.value = []
      habilita_edicion.value = true
      if (res_borrar.stat){
        storeApp.mostrar_alerta( props.funcionalidad.nombre_elemento.singular + " " + textos.value['deleted'] +" correctamente" )
        actualizar_listado()
      } else {
        storeApp.mostrar_alerta( res_borrar.text )
      }
    } else {
      storeApp.loading = false
      filasSeleccionadas.value = []
      storeApp.mostrar_alerta( "Error al realizar petición" )
    }
  }
  async function actualizar_listado(){
    storeApp.loading = true
    let get_all_res = await props.api.get_all()
    if (get_all_res){
      storeApp.loading = false
      registros.value        = get_all_res.data.rows

      if (registros.value.length > 0){
        let camposJSON = getCamposJson(get_all_res.data.fields_def) 
        for (let c=0; c < registros.value.length; c++){
          registros.value[c] = mapFilaJSONtabla(registros.value[c], camposJSON)
          registros.value[c] = row_formatter(registros.value[c], get_all_res.data.fields_def)
        }
        //se procesan campos JSON
        get_all_res.data.fields_def = getCamposJSONyFieldDef(get_all_res.data.fields_def, camposJSON, registros.value[0] )
        //se procesan campos con formateo (por que a los campos formateados se le agrega '_')
        get_all_res.data.fields_def = getFieldDefFFormated( get_all_res.data.fields_def )
      }
      
      listado_columnas.value = [...get_all_res.data.fields_def]
      selectedColumns.value  = getProcessFieldDef( listado_columnas.value )
      filtros.value          = getFiltersFrFields( listado_columnas.value )
      seleccionGlobal.value  = selectedColumns.value

      abm_cargado( true )
    } else {
      storeApp.loading = false
    }
  }
  onMounted(async ()=>{
    cargar_config()
    actualizar_listado()
  })
</script>

<style lang="scss">
.p-filter-column{
    padding: 0.2rem;

    .p-column-filter-menu-button, .p-column-filter-clear-button{
      margin-left: 0rem;
      width: 1rem !important;
      .pi{
        font-size: .7rem;
        color: #000;
      }
    }
}
</style>