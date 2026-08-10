<template>
<nav class="navbar fixed-top navbar-expand-lg navbar-dark bg-primary">
    <div class="container p-0">
      <a class="navbar-brand" href="#/">
        <div class="row align-items-center justify-content-center">
          <div class="col">
            <b class="ms-3">Precios de Tandil</b>
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
            <div class="col-auto p-0 me-1">
              <div class="input-group">
                <input class="form-control" v-model="termino_busqueda" type="text" placeholder="Por ej: Manzana" aria-label="Buscar" 
                  @keyup.enter="buscar" ref="caja_busqueda">
                <button class="btn btn-success" type="button" @click="buscar" aria-label="Buscar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zm-5.442 1.398a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex" v-if="storeApp.ruta_actual.path == '/categorias'">
        <div class="w-100" id="cont_busca">
          <div class="row align-items-center justify-content-center">
            <div class="col-auto p-0 me-1">
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
          <li class="nav-item" v-if="!isLogged">
            <button class="btn btn-success" type="button" @click="irIngresar">Ingresar</button>
          </li>
          <li class="nav-item" v-else>
            <button class="btn btn-success" type="button" @click="irDashboard">
              <i class="bi bi-person-circle me-1"></i>{{ storeApp.userInfo?.name || 'Mi cuenta' }}
            </button>
          </li>
        </ul>
      </div>  
    </div>
</nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { AppStore } from "../../stores/app"
import { useRoute } from 'vue-router'
import { router } from "../../router"
import { getToken, getUserInfo, setUserInfo } from "../../utils/auth"

const emit  = defineEmits(['buscar_evnt', 'agregar_evnt', 'filtrar_evnt'])
const storeApp = AppStore()
const route = useRoute()

const isLogged = !!getToken()

const termino_busqueda = ref('')
const termino_filtro = ref('')

const enlaces = ref([
    { path: '/', title: 'Buscador' },
    //{ path: '/categorias', title: 'Navegar por Categorías' },
    { path: '/ofertas', title: 'Ofertas' },
    //{ path: '/carga_precio', title: 'Carga de Precios' },
    //{ path: '/estadisticas', title: 'Estadísticas' }, // <--- ENLACE COMENTADO TEMPORALMENTE
    //{ path: '/calcula_trueque', title: 'Calcula Trueque' },
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

function irIngresar(){
  router.push('/admin/login')
}

async function irDashboard(){
  const token = getToken()
  if (!token) return router.push('/admin/login')

  const userInfo = await getUserInfo('admin')
  if (userInfo && userInfo.stat) {
    setUserInfo('admin', storeApp, userInfo.data, router, token)
    router.push('/admin/dashboard')
  } else {
    router.push('/admin/login')
  }
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

.input-group .form-control {
    border-bottom: 2px solid #ced4da;
    transition: box-shadow 0.2s, border-color 0.2s;
}
.input-group .form-control:focus {
    box-shadow: 0 0 0 0.2rem rgba(32, 201, 151, 0.25);
    border-color: #20c997;
}
</style>