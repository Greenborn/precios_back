<template>
<div class="container-fluid" id="buscador-cnt">
    <div  class="row align-items-center justify-content-center d-none d-sm-flex">
        <div class="col-12 col-md-10 col-lg-8">
            <div class="card mb-1 p-0">
                <div class="card-header p-4">
                    <h4>Buscá tu precio </h4>
                    <small>Ingrese el nombre del producto que desea consultar:</small>
                </div>
                <div class="card-body p-4">
                    <div class="row align-items-center justify-content-center">

                        <div class="col-12 col-md-8">
                            <div class="input-group">
                                <input v-model="termino_busqueda" type="text" class="form-control"
                                    placeholder="Nombre del producto" @keyup.enter="hacer_busqueda">
                                <div class="input-group-append">
                                    <button @click="buscar" class="btn btn-primary" type="button">Buscar</button>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" @change="ofertas_check_change" v-model="solo_ofertas" type="checkbox" value="" id="promoCheck">
                                <label class="form-check-label" for="promoCheck">
                                    Buscar Promociones y Ofertas
                                </label>
                            </div>
                        </div>

                    </div>                    
                </div>
            </div>
        </div>
    </div>

    <div class="row align-items-center justify-content-center">
        <div class="col-12 col-md-10 col-lg-8 ">
            <div class="card mb-1 p-0">

                <div class="card-header p-4 pb-0">
                    <div class="row align-items-center justify-content-center">
                        <div class="col p-0 pl-2">
                            <h4>
                                Resultados
                                <small v-if="resultados?.length"> - {{ resultados.length }}</small>
                            </h4>
                        </div>
                    </div>
                </div>

                <div class="card-body p-4">
                    <div class="row align-items-center justify-content-center d-sm-none">
                        <div class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" @change="ofertas_check_change" v-model="solo_ofertas" type="checkbox" value="" id="promoCheck">
                                <label class="form-check-label" for="promoCheck">
                                    Buscar Promociones y Ofertas
                                </label>
                            </div>
                        </div>
                    </div>

                    <template v-if="resultados.length == 0">
                        <div class="alert alert-info">
                            No hay resultados, pruebe con otro término de búsqueda.
                        </div>
                    </template>
                    <template v-if="resultados.length != 0">
                        
                        <div v-for="resultado in resultados" :key="resultado.producto" class="card mb-1 p-0">
                            <div class="card-header p-4 pt-0 pb-0">
                                <div class="row align-items-center justify-content-center">
                                    <div class="col-12 col-sm-4">
                                        <p class="price-cont mb-0" v-if="resultado?.price != -1">
                                            {{ resultado?.tipo == "ALQUILER" ? resultado.moneda : "$" }} {{ formatMoney(resultado?.price) }}
                                        </p>
                                        <p class="price-cont mb-0" 
                                            v-if="resultado?.caracteristicas?.promo_cnt 
                                                    && resultado?.price == -1">
                                            {{ resultado?.caracteristicas?.promo_cnt }}
                                        </p>
                                        <b v-if='resultado?.tipo != "PROMO"'>
                                            <small>{{ formateaFecha(resultado?.date_time, resultado?.time) }}</small>
                                        </b>
                                    </div>
                                    <div class="col-12 col-sm product-name-cont">
                                        {{ resultado?.products?.name }}
                                        <small v-if="resultado?.url"><a :href="resultado?.url" target="_blank">IR A WEB</a></small>
                                        &nbsp;
                                        <small v-if="resultado?.tipo != 'ALQUILER' && resultado?.tipo != 'PROMO'" class="btn-corregir" @click="corregir_precio(resultado)">CLICK para CORREGIR</small>
                                    </div>
                                </div>
                                
                            </div>
                            <div class="card-body pl-4 pr-4">
                                <div class="row align-items-center justify-content-center">

                                    <div class="col">
                                        <div class="row" 
                                            v-if="resultado?.notas != '' && resultado?.notas != null
                                                    || resultado?.caracteristicas?.desde || resultado?.caracteristicas?.hasta">
                                            <div class="col">
                                                <span class="text-success">
                                                    <b>{{ resultado?.notas }}</b>
                                                    <b v-if="resultado?.caracteristicas?.desde">Desde: {{ resultado?.caracteristicas?.desde }}</b>
                                                    <b v-if="resultado?.caracteristicas?.hasta"> - Hasta: {{ resultado?.caracteristicas?.hasta }}</b>
                                                </span>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col cnt-negocios">
                                                <div v-if="resultado?.tipo != 'ALQUILER'">
                                                    <b>Comercio: &nbsp;</b> {{ resultado?.empresa?.name }} &nbsp; -
                                                    <span v-for="comercio in resultado?.locales" :key="comercio">
                                                        {{ comercio?.address_road }} &nbsp;
                                                        {{ comercio?.address_number }}  &nbsp; |
                                                    </span>
                                                </div>
                                                <div v-if="resultado?.tipo == 'ALQUILER'">
                                                    <b>Locador: &nbsp;</b> {{ resultado?.empresa?.name }} &nbsp; -
                                                    <span v-for="_data in get_especificaciones(resultado?.caracteristicas)" :key="_data">
                                                        {{ _data?.name }} &nbsp;
                                                        {{ _data?.value }}  &nbsp; |
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-auto">
                                        <button v-if="resultado?.tipo != 'ALQUILER' && resultado?.tipo != 'PROMO'" type="button" class="btn btn-primary" @click="mostrar_estadisticas(resultado)">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
                                            </svg>
                                        </button>
                                    </div>

                                </div>
                                
                            </div>
                        </div>
                    </template>
                </div>
            </div>

        </div>
    </div>

    <div class="row align-items-center justify-content-center">
        <div class="col-12 col-md-10 col-lg-8">

            <div class="alert alert-success">
                <p><b>Disclaimer:</b></p>
                <p>
                    Si <b>NO</b> queres que tu negocio figure en el listado escribí por MP a 
                    <a href="https://www.facebook.com/TandilPreciosBaratos">TandilPreciosBaratos</a>
                    proporcionando medios de contacto oficiales.
                </p>
                <p>
                    La información proporcionada es obtenida a partir de canales de acceso público y datos 
                    proporcionados por usuarios y puede no ser del todo consistente con la realidad pero da una 
                    idea general de los valores.
                </p>
            </div>

        </div>
    </div>

    <div class="row align-items-center justify-content-center">
        <div class="col-12 col-md-10 col-lg-8 ">
            <div class="card mb-1 p-0">

                <div class="card-header p-4 pb-0">
                    <h4>Estadísticas Generales</h4>
                </div>

                <div class="card-body p-4">
                    <template v-if="estadisticas_inc.length != 0">
                        <div class="row">
                            <div class="col-12 col-md-6" v-for="estadistica in estadisticas_inc" :key="estadistica">
                                <div class="row">

                                    <div class="col-12 col-md-6 col-lg-auto">
                                        <b>{{ estadistica.description }}:</b>
                                    </div>

                                    <div class="col-12 col-md-6 col-lg-auto">
                                        {{ estadistica.value }}
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </template>
                </div>
            </div>

        </div>
    </div>
</div>
    
</template>

<script setup>
import { ref, onMounted  } from 'vue'
import { busqueda, busqueda_promociones, get_estadistica } from '../../api/public/publicEndpoints'

import { formatMoney, fechaDateToString } from '../../helpers/formatter'
import { AppStore } from "../../stores/app"

import GraficoEvolucionPrecio from './GraficoEvolucionPrecio.vue'
import FormularioAddPrecio from './FormularioAddPrecio.vue'

defineExpose({ buscar })
const storeApp = AppStore()

const termino_busqueda = ref('')
const solo_ofertas = ref(false)
const resultados = ref([]);
const estadisticas_inc = ref([])
const MODAL_STYLE = { width: '100vw', 'min-height': "100vh" }

async function ofertas_check_change(){
    if (termino_busqueda.value != '' && termino_busqueda.value?.length >= 3){
        await buscar(termino_busqueda.value)
    }
}

function get_especificaciones( data ){
    let aux = []
    
    if (data['direccion'] != "")
        aux.push( { name: "Direccion:", value: data['direccion'] } )

    if (data['ambientes'] != "")
        aux.push( { name: "Ambientes:", value: data['ambientes'] } )

    return aux
}
    
async function mostrar_estadisticas( item ){
    storeApp.loading = true
    let res = await get_estadistica( "variacion_precio&id_producto="+item.product_id+"&id_local="+item.branch_id );
    if (res){
        storeApp.loading = false
        
        storeApp.mostrar_modal(GraficoEvolucionPrecio, 'Variación del Precio a lo largo del tiempo',
            {
                'item': item,
                'resultados': res,
                
                }, 
                { 'styles': MODAL_STYLE })
        
    } else {
        storeApp.loading = false
    }
}

const FUNCION_BUSQUEDA = {
    'promociones': busqueda_promociones,
    'general': busqueda
}

async function buscar ( termino = undefined ) {
    if (termino != undefined && typeof termino == 'string')
        termino_busqueda.value = termino

    if (termino_busqueda.value === '') {
        storeApp.mostrar_alerta( "Por favor, ingrese el nombre del producto." )
        return false
    }

    if (termino_busqueda.value.length < 3) {
        storeApp.mostrar_alerta( "El nombre del producto debe tener al menos 3 caracteres." )
        return false
    }

    resultados.value = []
    storeApp.loading = true
    let res = await FUNCION_BUSQUEDA[ solo_ofertas.value ? 'promociones' : 'general' ](termino_busqueda.value);
    if (res) {
        storeApp.loading = false
        if (res?.error){
            storeApp.mostrar_alerta( "Ocurrio un error, re-intente más tarde." )
            return false
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })

        resultados.value = res?.items ? res.items: [];

        //agrupando por confiabilidad y fecha
        let diccio_ = {}
        for (let i = 0; i < resultados.value.length; i++){
            const item = resultados.value[i]
            const fecha = new Date( item.date_time ).getTime()

            if (diccio_[ item.confiabilidad ] == undefined)
                diccio_[ item.confiabilidad ] = {}

            if (diccio_[ item.confiabilidad ][ fecha ] == undefined)
                diccio_[ item.confiabilidad ][ fecha ] = []
            
            diccio_[ item.confiabilidad ][ fecha ].push( item )
        }
        
        //Se ordenan las claves de los diccionarios
        let confia_keys = Object.keys( diccio_ )
        confia_keys.sort( (a, b) => (a > b) ? 1 : -1 )

        let diccio_date_k = {}
        for (let i = 0; i < confia_keys.length; i++){
            diccio_date_k[ confia_keys[i] ] = Object.keys( diccio_[ confia_keys[i] ] )
            diccio_date_k[ confia_keys[i] ].sort( (a, b) => (a < b) ? 1 : -1 )
        }

        //Se genera nuevo arreglo de resultados ordenado
        let aux = []
        for (let i = 0; i < confia_keys.length; i++)
            for (let j=0; j < diccio_date_k[ confia_keys[i] ].length; j ++) {
                let aux_1 = diccio_[ confia_keys[i] ][ diccio_date_k[ confia_keys[i] ][j] ]
                aux_1.sort( (a, b) => (a.price > b.price) ? 1 : -1 )

                for (let k = 0; k < aux_1.length; k++ )
                    aux.push( aux_1[ k ] )
            }

        resultados.value = aux
        return true
    } else {
        storeApp.loading = false
        return false
    }
}

function formateaFecha( fecha, time ){
    let hora = new Date(time)
    fecha = new Date(fecha)
    fecha.setHours(hora.getHours(), hora.getMinutes(), hora.getSeconds())
    
    return fechaDateToString(new Date(fecha),"/", "dd-mm-YYYY H:M" )
}

async function hacer_busqueda(){
    await buscar(termino_busqueda.value)
}

async function cargar_estadisticas(){
    storeApp.loading = true
    let res = await get_estadistica("incremental_stats")
    if (res){
        storeApp.loading = false
        if (res?.error){
            storeApp.mostrar_alerta( "Ocurrio un error al cargar las estadísticas" )
            return false
        }
        estadisticas_inc.value = res?.items
    } else
        storeApp.loading = false
}

function corregir_precio(resultado){
    let modal_form = storeApp.mostrar_modal(FormularioAddPrecio, 'Corregir precio - '+resultado?.products?.name,
        {
            'item': resultado,
            _callback_ok: async () => {
                storeApp.ocultar_modal( modal_form.code )
            }
        },
    )
}


onMounted(async ()=>{
    await cargar_estadisticas()
})

</script>

<style>
.btn-corregir{
    font-weight: bolder;
    color: #82321e;
    cursor: pointer;
}

.price-cont{
    color:rgb(70, 116, 0);
    font-weight: bolder;
    min-width: 226px;
    font-size: 2rem;
}

.product-name-cont{
  font-weight: bolder;
  font-size: 1rem;
  color: #1e3c82;
}

.cnt-negocios{
    overflow-x: scroll;
    max-height: 3rem;
    overflow-y: hidden;
}

#buscador-cnt{
    margin-top: 5rem;
}
</style>