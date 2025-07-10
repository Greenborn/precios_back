<template>
<nav class="navbar fixed-top navbar-expand-lg navbar-dark bg-primary">
    <div class="container p-0">
      <a class="navbar-brand" href="#/">
        <div class="row align-items-center justify-content-center">
          <div class="col">
            <b class="ml-3">Precios de Tandil</b>
          </div>
        </div>
      </a>

      <div class="d-flex d-md-none" v-if="storeApp.ruta_actual.path == '/carga_precio'">
        <div class="w-100" >
          <div class="row align-items-center justify-content-center">
            <div class="col-auto p-0">
              <button class="btn btn-success" type="button" @click="agregar">Agregar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex d-md-none" v-if="storeApp.ruta_actual.path == '/ofertas'">
        <div class="w-100" >
          <div class="row align-items-center justify-content-center">
            <div class="col-auto p-0">
              <button class="btn btn-success" type="button" @click="filtrar">Filtrar</button>
            </div>
          </div>
        </div>
      </div>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="d-flex" v-if="storeApp.ruta_actual.path == '/'">
        <div class="w-100" id="cont_busca">
          <div class="row align-items-center justify-content-center">
            <div class="col-auto p-0 mr-1">
              <input class="form-control me-2" v-model="termino_busqueda" type="text" placeholder="Por ej: Manzana" aria-label="Buscar" 
              @keyup.enter="buscar" ref="caja_busqueda">
            </div>
            <div class="col-auto p-0">
              <button class="btn btn-success" type="button" @click="buscar">Buscar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex" v-if="storeApp.ruta_actual.path == '/categorias'">
        <div class="w-100" id="cont_busca">
          <div class="row align-items-center justify-content-center">
            <div class="col-auto p-0 mr-1">
              <input class="form-control me-2" v-model="termino_filtro" type="text" placeholder="Filtrar" aria-label="Filtrar" 
              @keyup="filtrar" ref="caja_busqueda">
            </div>
          </div>
        </div>
      </div>

      
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ml-auto p-3 align-items-center justify-content-center">
          <li class="nav-item" v-for="(enlace) in enlaces" :key="enlace">
            <span class="nav-link" @click="click(enlace)"
                :class="{ active: storeApp.ruta_actual.path == enlace.path }">{{ enlace.title }}</span>
          </li>
        </ul>
      </div>  
    </div>
</nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { AppStore } from "../../stores/app"
import { useRouter, useRoute } from 'vue-router'

const emit  = defineEmits(['buscar_evnt', 'agregar_evnt', 'filtrar_evnt'])
const storeApp = AppStore()
const router = useRouter()
const route = useRoute()

const termino_busqueda = ref('')
const termino_filtro = ref('')

const enlaces = ref([
    { path: '/', title: 'Buscador' },
    //{ path: '/categorias', title: 'Navegar por Categorías' },
    { path: '/ofertas', title: 'Ofertas' },
    { path: '/carga_precio', title: 'Carga de Precios' },
    { path: '/estadisticas', title: 'Estadísticas' },
    { path: '/calcula_trueque', title: 'Calcula Trueque' },
    { path: '/aporta', url: "https://cafecito.app/tandil_precios", title: 'Quiero Aportar' }
])

function click( item ){
    if (item?.url){
      window.open(item.url, '_blank')
      return
    }

    storeApp.ruta_actual = item
    router.push(item.path)
}

function filtrar(){
  emit('filtrar_evnt', termino_filtro.value)
}

function buscar(){
  emit('buscar_evnt', termino_busqueda.value)
}

function agregar(){
  emit('agregar_evnt', true)
}

onMounted(()=>{
    storeApp.ruta_actual['path'] = route.path
})
</script>

<style>
#cont_busca{
  padding-left: 4rem;
}

.nav-link{
    cursor: pointer;
}
</style>