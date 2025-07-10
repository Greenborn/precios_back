<template>
    <PublicTopBar />

    <div class="container-fluid" id="estadisticas-cnt">

        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8 ">

                <div class="accordion" id="acordionEstadisticas">
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3" aria-expanded="true" aria-controls="collapse3">
                                Variación de precios diaria, ordenados por porcentaje de variación de mayor a menor - 
                                Hay que tener en cuenta que algunas variaciones exageradas pueden deberse a artículos que antes estaban en promoción y ahora no lo están
                            </button>
                        </h2>
                        <div id="collapse3" class="accordion-collapse collapse show" data-bs-parent="#acordionEstadisticas">
                            <div class="accordion-body">
                                <p> Para calcular el procentaje de variación se toma la diferencia entre los últimos dos precios registrados y se divide por el precio anterior/100</p>
                                <p> La media del porcentaje de todos los elementos es: <b>{{ media_porcentaje_aumento }}%</b></p>
                                <p> Calculado el: {{ fechaDateToString(new Date(mayor_aumento_diario[0]?.fecha_utlimo_precio), '/') }}</p>
                                <ul class="list-group">
                                    <li class="list-group-item"  v-for="(item) in mayor_aumento_diario" :key="item">
                                        <div class="row">

                                            <div class="col">
                                                <b>%{{ item.porcentaje_aumento }}</b> - 
                                                {{item.nombre_producto}} - 
                                                <b> ayer valía: ${{ item.precio_ayer }} y hoy vale ${{ item.precio_hoy }}</b> -
                                                en comercio <b>{{ item.nombre_comercio }}</b>
                                            </div>
                                            <div class="col-auto">
                                                <button type="button" class="btn btn-primary" @click="mostrar_estadisticas(item)">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                        </div>                                        
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
<!--
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                Términos de Búsqueda más Consultados <small>(Calculadas en la última actualización de precios)</small>
                            </button>
                        </h2>
                        <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#acordionEstadisticas">
                            <div class="accordion-body">
                                <p>
                                    Más búscados de la semana
                                </p>
                                <ul class="list-group">
                                    <li v-for="(item) in mas_buscados" :key="item" class="list-group-item">
                                        <b>{{ item.termino }}</b>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2" aria-expanded="true" aria-controls="collapse2">
                                Cantidad de precios por negocio
                            </button>
                        </h2>
                        <div id="collapse2" class="accordion-collapse collapse show" data-bs-parent="#acordionEstadisticas">
                            <div class="accordion-body">
                                <p>
                                    Aquí se muestra el total de precios histórico registrado por cada comercio.
                                    Cada vez que se agrega un nuevo producto o el precio del mismo varía se suma 1.
                                    Se muestran aquellos que al menos tienen un precio registrado.
                                </p>
                                <ul class="list-group">
                                    <li v-for="(item) in precios_por_negocio" :key="item" class="list-group-item">
                                        <b>{{ item.nombre }}: </b>{{ item.cantidad }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    -->
                </div>

            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AppStore } from "../stores/app"
import { get_estadistica } from '../api/public/publicEndpoints'
import PublicTopBar from "../components/publico/PublicTopBar.vue";
import GraficoEvolucionPrecio from '../components/publico/GraficoEvolucionPrecio.vue'
import { formatMoney, fechaDateToString } from '../helpers/formatter'

const MODAL_STYLE = { width: '100vw', 'min-height': "100vh" }
const storeApp = AppStore()
  
const precios_por_negocio = ref([])
const mas_buscados = ref([])
const mayor_aumento_diario = ref([])
const media_porcentaje_aumento = ref(undefined)

async function mostrar_estadisticas( item ){
    storeApp.loading = true
    let res = await get_estadistica( "variacion_precio&id_producto="+item.id_producto+"&id_local="+item.branch_id );
    if (res){
        storeApp.loading = false
        
        storeApp.mostrar_modal(GraficoEvolucionPrecio, 'Variación del Precio a lo largo del tiempo',
            {
                'item': {...item, products: {"name": item.nombre_producto}},
                'resultados': res,
                
                }, 
                { 'styles': MODAL_STYLE })
        
    } else {
        storeApp.loading = false
    }
}

onMounted(async ()=>{
    storeApp.loading = true
    let res = await get_estadistica('precios_por_negocio')
    if (res){
        storeApp.loading = false
        if (!res.stat){
            storeApp.mostrar_alerta( "Ocurrió un error al cargar las estadísticas de precios por negocio" )
            return false
        }
        precios_por_negocio.value = res?.items
    } else
        storeApp.loading = false

    storeApp.loading = true
    let res2 = await get_estadistica('trending')
    if (res2){
        storeApp.loading = false
        if (!res2.stat){
            storeApp.mostrar_alerta( "Ocurrió un error al cargar las estadísticas de más buscados" )
            return false
        }
        mas_buscados.value = res2?.items
    } else
        storeApp.loading = false

        storeApp.loading = true

    let res3 = await get_estadistica('mayor_aumento_diario&limit=3000')
    if (res3){
        storeApp.loading = false
        if (!res3.stat){
            storeApp.mostrar_alerta( "Ocurrió un error al cargar las estadísticas de los que más aumentaron" )
            return false
        }
        mayor_aumento_diario.value = res3?.items
        const cant = mayor_aumento_diario.value.length
        if (cant > 2){
            media_porcentaje_aumento.value = mayor_aumento_diario.value[Math.floor(cant/2)].porcentaje_aumento
        }
    } else
        storeApp.loading = false
})
</script>

<style scoped>
#estadisticas-cnt{
    margin-top: 5rem;
}

#collapse3 .accordion-body{
    max-height: 100vh; 
    overflow-y: scroll;
}
</style>