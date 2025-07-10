<template>
    <PublicTopBar @filtrar_evnt="desplegar_filtros"/>

    <div class="container-fluid" id="ofertas-cnt">
        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8">
                <h2 class="text-center pt-2">Listado de Promociones y Ofertas</h2>
            </div>
        </div>

        <div class="row align-items-center justify-content-center d-none d-sm-flex">
            <div class="col-auto">
                <Button label="Filtrar" iconPos="right" 
                        @click="desplegar_filtros" />
            </div>
        </div>

        
        <div class="row align-items-center justify-content-center">
            <div class="col-12 col-md-10 col-lg-8 ">

                <div class="accordion">

                    <div class="accordion-item" v-for="(comercio, index) in comercios_filtrados" :key="comercio">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                    :data-bs-target="'#collapse'+index" aria-expanded="false" :aria-controls="'collapse' + index"
                                    >
                                <b>{{ comercio?.empresa?.name }} - 
                                    {{ ofertas_filtradas[comercio.id].ofertas?.length == 0 ? 'Sin Resultados' : ofertas_filtradas[comercio.id].ofertas?.length }}</b>
                            </button>
                        </h2>
                        <div :id="'collapse' + index" class="accordion-collapse collapse" :data-bs-parent="'#collapse'+index">
                            <div class="accordion-body">

                                <ul class="list-group">
                                    <li class="list-group-item" 
                                        v-for="(oferta) in ofertas_filtradas[comercio.id].ofertas" :key="oferta">
                                        <div class="row align-items-center justify-content-center">
                                            <div class="col-12 col-sm-4 text-center">
                                                <p class="price-cont mb-0" v-if="oferta?.price != -1">
                                                    $ {{ formatMoney(oferta?.price) }}
                                                </p>
                                                <p class="price-cont mb-0" 
                                                    v-if="oferta?.caracteristicas?.promo_cnt 
                                                            && oferta?.price == -1">
                                                    {{ oferta?.caracteristicas?.promo_cnt }}
                                                </p>
                                            </div>
                                            <div class="col-12 col-sm product-name-cont">
                                                {{ oferta?.products?.name }} 
                                                <small v-if="oferta?.url"><a :href="oferta?.url" target="_blank">IR A WEB</a></small>
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
    </div>
</template>
    
<script setup>
    import { ref, onMounted } from 'vue'
    import { AppStore } from '../stores/app'
    import PublicTopBar from "../components/publico/PublicTopBar.vue";
    
    import { formatMoney, fechaDateToString } from '../helpers/formatter'
    import { busqueda_promociones, comercios_promociones } from '../api/public/publicEndpoints'
    import FormularioFiltroOferta from '../components/publico/FormularioFiltroOferta.vue'
    
    const storeApp = AppStore()
    const props = defineProps(['parametros'])
    
    const listado_promo_obtenido = ref([])
    const listado_por_comercio = ref({})
    const listado_empresas = ref([])

    const listado_comercios = ref([])
    const params_filtro = ref({
        comercio: {}, nombre_prod: ""
    })
    const comercios_filtrados = ref([])
    const ofertas_filtradas = ref([])

    function desplegar_filtros(){
        let modal_form = storeApp.mostrar_modal(FormularioFiltroOferta, 'Filtrar por ',
                            {
                                'params_filtro':     params_filtro.value,
                                'listado_comercios': listado_comercios.value,
                                _callback_ok: ( filtro_ ) => {
                                    filtrar_ofertas( filtro_ )
                                    storeApp.ocultar_modal( modal_form.code )
                                    return
                                }
                            },
                        )
    }

    function filtrar_ofertas( filtro_ ){
        params_filtro.value = filtro_

        //Filtrado por comercio
        let keys = Object.keys( params_filtro.value.comercio )
        let aux = []
        for (let i=0; i < keys.length; i++){
            if (params_filtro.value.comercio[keys[i]]){
                
                for (let j=0; j < listado_empresas.value.length; j++){
                    if (keys[i] == listado_empresas.value[j].id){                        
                        aux.push( {...listado_empresas.value[j]} )
                        break
                    }
                }
            }
            
        }

        if (aux.length == 0){ 
            aux = [...listado_empresas.value]
        }

        //filtrado por nombre de oferta
        for (let i=0; i < aux.length; i++){
            ofertas_filtradas.value[ aux[i].id ].ofertas = []
            let ofertas_comercio = listado_por_comercio.value[ aux[i].id ].ofertas           
            let prd_filtrado = []                     

            for (let k=0; k < ofertas_comercio.length; k++){
                if (
                    encontrado( String(ofertas_comercio[k]?.products?.name).toLowerCase(), 
                                String(params_filtro.value.nombre_prod).toLowerCase() )
                ) {
                    prd_filtrado.push( {...ofertas_comercio[k]} )
                }
            }
            ofertas_filtradas.value[ aux[i].id ].ofertas = prd_filtrado
        }

        comercios_filtrados.value = aux
    }

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

    onMounted(async ()=>{
        storeApp.loading = true
        let res_comercios = await comercios_promociones()
        if (res_comercios){
            storeApp.loading = false
            if (!res_comercios.stat){
                storeApp.mostrar_alerta( "No se pudieron obtener los comercios" )
                return false
            }
            listado_comercios.value = res_comercios?.items
            listado_comercios.value.sort( (a, b) => (a?.name > b?.name) ? 1 : -1 )
        }

        storeApp.loading = true
        let res = await busqueda_promociones("cod_todas_las_ofertas")
        if (res){
            storeApp.loading = false
            if (!res.stat){
                storeApp.mostrar_alerta( "No se pudieron obtener las promociones del día" )
                return false
            }
            listado_promo_obtenido.value = res?.items
            for (let i=0; i < listado_promo_obtenido.value.length; i++){
                const ID_COMERCIO = listado_promo_obtenido.value[i].branch_id
                if (listado_por_comercio.value[ID_COMERCIO] === undefined){
                    listado_por_comercio.value[ID_COMERCIO] = {
                        "ofertas": []
                    }
                    listado_empresas.value.push({
                        "id":      ID_COMERCIO,
                        "empresa": listado_promo_obtenido.value[i].empresa,
                        "locales": listado_promo_obtenido.value[i].locales,
                    })
                    params_filtro.value.comercio[ID_COMERCIO] = true
                }
                listado_por_comercio.value[ID_COMERCIO].ofertas.push(listado_promo_obtenido.value[i])
            }
            listado_empresas.value.sort( (a, b) => (a.empresa?.name > b.empresa?.name) ? 1 : -1 )
            comercios_filtrados.value = listado_empresas.value

            for (let i=0; i < listado_empresas.value.length; i++){
                listado_por_comercio.value[listado_empresas.value[i].id]?.ofertas.sort( (a, b) => (a.price > b.price) ? 1 : -1 )
            }

            ofertas_filtradas.value = JSON.parse(JSON.stringify(listado_por_comercio.value))
        } else
            storeApp.loading = false
    })
</script>

<style scoped>
#ofertas-cnt{
    margin-top: 5rem;
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
</style>