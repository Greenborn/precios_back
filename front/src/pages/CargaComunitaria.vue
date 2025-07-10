<template>
    <PublicTopBar @agregar_evnt="agregar"/>

    <div class="container-fluid" id="form_carga-cnt">

        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8 ">

                <div class="card mt-1 mb-1 p-0">
                    <div class="card-header p-4">
                        <h4>Carga Colaborativa de Precios</h4>
                        <p>Este formulario está pensado para que cualquier persona pueda cargar sus propios precios <br>
                        Cada producto que carge internamente se guardará como un registro en una tabla que luego de ser validado se cargará en el sistema</p>
                    </div>
                    
                    <div class="card-body p-4">
                        <div class="row justify-content-center">

                            <div class="col-12 col-md-4 col-lg-4">
                                <div class="form-group">
                                    <label for="name">Su Nombre</label>
                                    <input type="text" v-model="datos_formulario.nombre" class="form-control" id="name" aria-describedby="nombre" placeholder="">
                                    <small id="nameHelp" class="form-text text-muted">Campo opcional</small>
                                </div>
                            </div>
                            
                            <div class="col-12 col-md-4 col-lg-4">
                                <div class="form-group">
                                    <label for="name_enterprise">Nombre del Comercio</label>
                                    <input type="text" class="form-control"  v-model="datos_formulario.comercio" id="name_enterprise" aria-describedby="name_enterprise" placeholder="Supermercado ...">
                                </div>
                            </div>

                            <div class="col-12 col-md-4 col-lg-4">
                                <div class="form-group">
                                    <label for="name_enterprise">Fecha</label>
                                    <input type="date" class="form-control"  v-model="datos_formulario.fecha" id="name_enterprise" aria-describedby="name_enterprise" placeholder="Supermercado ...">
                                </div>
                            </div>

                        </div>

                        <div class="row border-top">
                            <div class="col"></div>
                            <div class="col-auto m-2 mt-2">
                                <button type="button" class="btn btn-success" @click="agregar()">Agregar producto</button>
                            </div>
                            <div class="col"></div>
                        </div>

                        <div class="row border-top align-items-center border-top border-bottom" v-for="(product, index) in datos_formulario.productos" :key="product">
                            <div class="col">
                                <div class="row">
                                    <div class="col-12 col-md-3">
                                        <div class="form-group">
                                            <label for="product_name">Nombre del Producto</label>
                                            <input type="text" class="form-control" id="product_name" v-model="product.nombre" aria-describedby="product_name" placeholder="Arroz">
                                        </div>
                                    </div>

                                    <div class="col-12 col-md-3">
                                        <div class="form-group">
                                            <label for="product_vendor">Marca</label>
                                            <input type="text" class="form-control" id="product_vendor" v-model="product.marca" aria-describedby="product_vendor" placeholder="Marolio">
                                        </div>
                                    </div>

                                    <div class="col-12 col-md-3">
                                        <div class="form-group">
                                            <label for="product_size">Presentación</label>
                                            <input type="text" class="form-control" id="product_size" v-model="product.presentacion" aria-describedby="product_size" placeholder="1Kg">
                                        </div>
                                    </div>

                                    <div class="col-12 col-md-3">
                                        <div class="form-group">
                                            <label for="product_price">Precio</label>
                                            <input type="text" class="form-control" id="product_price" v-model="product.precio" aria-describedby="product_price" placeholder="1000">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-auto">
                                <button type="button" class="btn btn-danger" @click="quitar(index)">Quitar</button>
                            </div>
                        </div>

                        <div class="row border-top">
                            <div class="col"></div>
                            <div class="col-auto m-2 mt-2">
                                <button type="button" class="btn btn-primary" @click="enviar()">Enviar</button>
                            </div>
                            <div class="col"></div>
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
import { enviar_datos } from '../api/public/publicEndpoints'

import { AppStore } from "../stores/app"
const storeApp = AppStore()


const datos_formulario = ref({
    "nombre": "",
    "comercio":"",
    "fecha": new Date(),
    "productos": [
        { nombre: "", marca: "", presentacion: "", precio: "" }
    ]
})

function agregar(){
    datos_formulario.value.productos.push({
        nombre: "", marca: "", presentacion: "", precio: ""
    })
}

function quitar(index){
    datos_formulario.value.productos.splice(index, 1)
}

async function enviar(){
    storeApp.loading = true
    let res = await enviar_datos(datos_formulario.value)
    if (res){
        storeApp.loading = false
        if (!res.stat){
            storeApp.mostrar_alerta( "Ocurrio un error al guardar los datos" )
            return false
        } else {
            datos_formulario.value = {
                "nombre": "",
                "fecha": new Date(),
                "productos": [
                    { nombre: "", marca: "", presentacion: "", precio: "" }
                ]
            }
            storeApp.mostrar_alerta( "¡Gracias por colaborar!" )
        }
    } else
        storeApp.loading = false
}
</script>

<style>
#form_carga-cnt{
    margin-top: 5rem;
}
</style>