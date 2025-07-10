<template>
    <PublicTopBar @filtrar_evnt="filtrar" />

    <div class="container-fluid" id="categorias-cnt">
        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8 ">
                
                <div class="row align-items-center justify-content-center">
                    <div class="col-auto">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item" v-for="bc in bread_crumbs" :key="bc">
                                    <a href="#/categorias" v-if="bc.visible < fase" @click="breadcrumb_click(bc)">{{ bc.label }}</a>
                                    <span v-if = "bc.visible == fase">{{ bc.label }}</span>
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 col-sm-6 col-lg-4" v-for="cat in menu_lst" :key="cat">
                        
                        <div v-if="fase < 2"
                            class="card text-bg-success mb-3 category_btn" style="height: 10rem;" 
                            @click="categoria_click(cat)">
                            <div class="card-body text-center">
                                <div class="row align-items-center justify-content-center">
                                    <div class="col">
                                        <h3><b>{{ cat.nombre }}</b></h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="fase == 2" 
                            class="card text-bg-secundary mb-3" style="height: 20rem; overflow-y: scroll;" 
                        >
                            <div class="card-header text-center">
                                <b>{{ cat.name }}</b>
                            </div>
                            
                            <div class="card-body text-center">
                                <div class="row align-items-center justify-content-center">
                                    <div class="col" >

                                        <ul class="list-group">
                                            <li class="list-group-item" v-for="precio in cat.precios" :key="precio">
                                                <div class="row">

                                                    <div class="col">
                                                        <b>${{ formatMoney(precio?.price) }}</b> <br>
                                                        <small>{{ formateaFecha(precio?.date_time) }}</small>
                                                    </div>

                                                    <div class="col">
                                                        {{ precio?.branch?.enterprise?.name }}
                                                    </div>

                                                </div>
                                            </li>
                                        </ul>

                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="alert alert-info mt-3" v-if="menu_lst.length == 0">
                        No hay resultados.
                    </div>
                </div>
                
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AppStore } from "../stores/app"
import PublicTopBar from "../components/publico/PublicTopBar.vue";

import { get_categorias, get_empresas_categoria, get_sub_categorias, get_categorias_empresa, get_productos } from '../api/public/publicEndpoints'
import { formatMoney, fechaDateToString } from '../helpers/formatter'
const storeApp = AppStore()

const bread_crumbs = ref([
    { label: 'Tipos de Comercios', label_bk: 'Tipos de Comercios', visible:0, tipo_cat: "category" },
    //{ label: 'Comercios', label_bk: 'Tipos de Comercios', visible:1, tipo_cat: "enterprice" },
    { label: 'Categorías', label_bk: 'Categorías',  visible:1, tipo_cat: "category_prod" },
    { label: 'Productos', label_bk: 'Productos',  visible:2, tipo_cat: "product" },
])
const fase = ref(0)

const listados = ref({
    "category": [],
    //"enterprice": [],
    "category_prod": [],
    "product": []
})
const tipo_categoria = ref("category")
const menu_lst = ref([])

const filtro = ref("")


function encontrado( string1, string2 ){
    if (string2=='') return true

    for (let i=0; i < string1.length; i++){
        if (string1[i] == string2[0]){
            let encontrado = true
            for (let j=0; j < string2.length; j++){
                if (string1[i+j] != string2[j]){
                    encontrado = false
                    break;
                }
            }
            if (encontrado) return true
        }
    }
    
    return false
}

function filtrar( termino_filtro ){
    filtro.value = termino_filtro
    filtrador()
}

function filtrador(){
    let aux = []

    for (let c=0; c < listados.value[tipo_categoria.value].length; c++){
        let producto = listados.value[tipo_categoria.value][c]
        let insertar    = false

        insertar = encontrado( String(producto.nombre).toLowerCase(), String(filtro.value).toLowerCase() )
        if (insertar) aux.push(producto)
    }
    
    menu_lst.value = aux
}

onMounted(async ()=>{
    storeApp.loading = true
    let res = await get_categorias()
    if (res){
        storeApp.loading = false
        if (!res.stat){
            storeApp.mostrar_alerta( "Ocurrió un error al cargar el listado de categorías" )
            return false
        }
        listados.value[tipo_categoria.value] = res?.items
        menu_lst.value = res?.items
    } else
        storeApp.loading = false
})

function breadcrumb_click( bc ){
    menu_lst.value       = listados.value[ bc.tipo_cat ]
    tipo_categoria.value = bc.tipo_cat
    fase.value           = bc.visible
    bc.label             = bc.label_bk
}

function formateaFecha( fecha ){
    fecha = new Date(fecha)
    fecha.setHours(fecha.getHours() - 3)
    
    return fechaDateToString(fecha,"/")
}


async function categoria_click( cat ){
    filtro.value = ""
    if (tipo_categoria.value == "category"){
        storeApp.loading = true
        let res = await get_sub_categorias( cat.id )
        if (res){
            storeApp.loading = false
            if (!res.stat){
                storeApp.mostrar_alerta( "Ocurrió un error al cargar el listado de comercios" )
                return false
            }
            let enterprise_lst = res?.items
            for ( let i = 0; i < enterprise_lst.length; i++ )
                enterprise_lst[i]['nombre'] = enterprise_lst[i]['category']['name']
            
            tipo_categoria.value = "category_prod"
            fase.value = 1
            
            bread_crumbs.value[fase.value-1].label = cat.nombre
            listados.value[tipo_categoria.value] = enterprise_lst
            menu_lst.value = enterprise_lst
        } else
            storeApp.loading = false
    } 
    /*
    else if (tipo_categoria.value == "enterprice"){
        storeApp.loading = true
        let res = await get_categorias_empresa( cat?.enterprice?.id )
        if (res){
            storeApp.loading = false
            if (!res.stat){
                storeApp.mostrar_alerta( "Ocurrió un error al cargar el listado de comercios" )
                return false
            }
            let enter_cat_lst = res?.items
            for ( let i = 0; i < enter_cat_lst.length; i++ )
                enter_cat_lst[i]['nombre'] = enter_cat_lst[i]['category']['name']
            
            tipo_categoria.value = "category_prod"
            fase.value = 2
            menu_lst.value = enter_cat_lst
            bread_crumbs.value[fase.value-1].label = cat.nombre
            listados.value[tipo_categoria.value] = enter_cat_lst
        } else
            storeApp.loading = false
    } */

    else if (tipo_categoria.value == "category_prod"){
        storeApp.loading = true
        let res = await get_productos( cat?.category?.id )
        if (res){
            storeApp.loading = false
            if (!res.stat){
                storeApp.mostrar_alerta( "Ocurrió un error al cargar el listado de comercios" )
                return false
            }
            let products_lst = []
            
            let keys = Object.keys(res?.items)
            for (let i=0; i < keys.length; i++){
                let item = res?.items[keys[i]]
                item["nombre"] = item["name"]
                products_lst.push(item)
            }

            tipo_categoria.value = "product"
            fase.value = 2
            menu_lst.value = products_lst
            bread_crumbs.value[fase.value-1].label = cat.nombre
            listados.value[tipo_categoria.value] = products_lst
        } else
            storeApp.loading = false
    }
}

</script>

<style scoped>
#categorias-cnt{
    margin-top: 6rem;
}

.category_btn{
    cursor: pointer;
    user-select:none;
}

.category_btn:hover{
    background-color: #4db886 !important;
}
</style>