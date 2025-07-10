<template>
    <PublicTopBar />
    
    <div class="container-fluid" id="calcula-trueque-cnt">
        
        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8 ">
                <div class="row">

                    <div class="col-12 col-sm-6">
                        
                        <div class="card text-bg-secundary">
                            <div class="card-header text-center">
                                <h4><b>Producto 1 - {{elegidos[0]?.price}}</b></h4>
                            </div>
                            
                            <div class="card-body text-center">
                                
                                <div class="row align-items-center justify-content-center">
                                    <div class="col-auto p-0 mr-1">
                                        <input class="form-control me-2" v-model="terminos[0]" type="text"
                                            placeholder="Por ej: Manzana" aria-label="termino1" @keyup.enter="buscar(0)">
                                    </div>
                                    <div class="col-auto p-0">
                                        <button class="btn btn-secondary" type="button" @click="buscar(0)">Buscar</button>
                                    </div>
                                </div>

                                <div class="row" v-if="elegidos[0] !== undefined">
                                    <div class="col">

                                        <ul class="list-group">
                                            <li class="list-group-item bg-elegido">
                                                <div class="row">
                                                    <div class="col">
                                                        <b>$ {{ formatMoney(elegidos[0]?.price) }} - {{ elegidos[0]?.empresa?.name }}</b>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>

                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col cont-results">

                                        <ul class="list-group">
                                            <li class="list-group-item" v-for="precio in resultados[0]" :key="precio">
                                                <div class="row">
                                                    <div class="col-auto">
                                                        <button class="btn btn-success" type="button" @click="selecciona(0, precio)">Elegir</button>
                                                    </div>
                                                    <div class="col">
                                                        <b>$ {{ formatMoney(precio?.price) }}</b>
                                                    </div>
                                                    <div class="col">
                                                        {{ formateaFecha(precio?.date_time) }} - 
                                                        {{ precio?.empresa?.name }}
                                                    </div>

                                                </div>

                                                <div class="row">
                                                    <div class="col">
                                                        {{ precio?.products?.name }}
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>

                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    <div class="col-12 col-sm-6">
                        
                        <div class="card text-bg-secundary">
                            <div class="card-header text-center">
                                <h4><b>Producto 2 - {{elegidos[1]?.price}}</b></h4>
                            </div>
                            
                            <div class="card-body text-center">
                                
                                <div class="row align-items-center justify-content-center">
                                    <div class="col-auto p-0 mr-1">
                                        <input class="form-control me-2" v-model="terminos[1]" type="text"
                                            placeholder="Por ej: Manzana" aria-label="termino1" @keyup.enter="buscar(1)">
                                    </div>
                                    <div class="col-auto p-0">
                                        <button class="btn btn-secondary" type="button" @click="buscar(1)">Buscar</button>
                                    </div>
                                </div>

                                <div class="row" v-if="elegidos[1] !== undefined">
                                    <div class="col">

                                        <ul class="list-group">
                                            <li class="list-group-item bg-elegido">
                                                <div class="row">
                                                    <div class="col">
                                                        <b>$ {{ formatMoney(elegidos[1]?.price) }} - {{ elegidos[1]?.empresa?.name }}</b>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>

                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col cont-results">

                                        <ul class="list-group">
                                            <li class="list-group-item" v-for="precio in resultados[1]" :key="precio">
                                                <div class="row">
                                                    <div class="col-auto">
                                                        <button class="btn btn-success" type="button" @click="selecciona(1, precio)">Elegir</button>
                                                    </div>
                                                    <div class="col">
                                                        <b>$ {{ formatMoney(precio?.price) }}</b>
                                                    </div>
                                                    <div class="col">
                                                        {{ formateaFecha(precio?.date_time) }} - 
                                                        {{ precio?.empresa?.name }}
                                                    </div>

                                                </div>

                                                <div class="row">
                                                    <div class="col">
                                                        {{ precio?.products?.name }}
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>

                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                </div>

                <div class="row">
                    <div class="col">

                        <div class="card text-bg-secundary">
                            <div class="card-header text-center">
                                <h4><b>Resultado</b></h4>
                            </div>
                            
                            <div class="card-body text-center" v-if="elegidos[0] != undefined && elegidos[1] != undefined">

                                <div class="row align-items-center justify-content-center">
                                    <div class="col-auto p-0 mr-1">
                                        <input class="form-control me-2" v-model="cantidad_prod1" type="number" min="1"
                                            placeholder="1" step="1">
                                    </div>
                                </div>

                                <b><strong class="cont-cant">{{ cantidad_prod1 }}</strong></b> <br>
                                 {{ elegidos[0].products?.name }} <b>equivale a</b> <br>
                                <b><strong class="cont-cant">{{(cantidad_prod1*elegidos[0].price) / elegidos[1].price}}</strong></b> <br>
                                 {{ elegidos[1].products?.name }}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import PublicTopBar from "../components/publico/PublicTopBar.vue";
import { AppStore } from "../stores/app"

import { formatMoney, fechaDateToString } from '../helpers/formatter'
import { busqueda } from '../api/public/publicEndpoints'
const storeApp = AppStore()

const terminos = ref(["", ""])
const resultados = ref([ [], [] ])
const elegidos = ref([ undefined, undefined ])
const cantidad_prod1 = ref(1)

function selecciona( indice, item ){
    elegidos.value[indice] = item
}

async function buscar( indice ){
    if (terminos.value[indice] === '') {
        storeApp.mostrar_alerta( "Por favor, ingrese el nombre del producto." )
        return false
    }

    if (terminos.value[indice].length < 3) {
        storeApp.mostrar_alerta( "El nombre del producto debe tener al menos 3 caracteres." )
        return false
    }

    resultados.value[indice] = []
    storeApp.loading = true
    let res = await busqueda(terminos.value[indice]);
    if (res) {
        storeApp.loading = false
        if (res?.error){
            storeApp.mostrar_alerta( "Ocurrio un error, re-intente más tarde." )
            return false
        }

        resultados.value[indice] = res?.items ? res.items: [];
        return true
    } else {
        storeApp.loading = false
        return false
    }
}

function formateaFecha( fecha ){
    fecha = new Date(fecha)
    fecha.setHours(fecha.getHours() - 3)
    
    return fechaDateToString(fecha,"/")
}
</script>

<style scoped>
#calcula-trueque-cnt{
    margin-top: 6rem;
}

.cont-results{
    height: 15rem;
    overflow-x: hidden;
    overflow-y: scroll;
}

.bg-elegido{
    background-color: #4db886;
}

.cont-cant{
    font-size: 2rem;
    font-weight: bold;
    color: #06053f
}
</style>