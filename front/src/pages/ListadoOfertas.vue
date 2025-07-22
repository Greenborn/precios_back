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

        <div class="row align-items-stretch justify-content-center g-3 mt-2">
            <div class="col-12 col-md-6 col-lg-4" v-for="(comercio, index) in comercios_filtrados" :key="comercio">
                <div class="card h-100 shadow-sm card-ofertas">
                    <div class="card-header bg-primary text-white">
                        <b>{{ comercio?.empresa?.name }}</b>
                        <span class="badge bg-light text-dark ms-2">{{ ofertas_filtradas[String(comercio.id)] && ofertas_filtradas[String(comercio.id)].ofertas?.length }} ofertas</span>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush position-relative">
                            <li class="list-group-item oferta-item" 
                                v-for="(oferta, idx) in (ofertas_filtradas[String(comercio.id)] && ofertas_filtradas[String(comercio.id)].ofertas ? ofertas_filtradas[String(comercio.id)].ofertas.slice(0,5) : [])" :key="oferta">
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
                                        <span v-html="resaltarBusqueda(oferta?.products?.name, params_filtro.nombre_prod)"></span>
                                        <small v-if="oferta?.url"><a :href="oferta?.url" target="_blank">&nbsp;IR A WEB</a></small>
                                    </div>
                                </div>
                            </li>
                            <li v-if="ofertas_filtradas[String(comercio.id)] && ofertas_filtradas[String(comercio.id)].ofertas && ofertas_filtradas[String(comercio.id)].ofertas.length === 0" class="list-group-item text-center text-muted">
                                <em>Sin ofertas para este comercio</em>
                            </li>
                        </ul>
                    </div>

                    <div class="card-footer bg-transparent border-0 text-center mt-2">
                        <button class="btn btn-link expand-btn" @click="mostrarModalOfertas(comercio, ofertas_filtradas[String(comercio.id)].ofertas)">
                            Ver todas las ofertas <svg width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L12.293 8 6.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Modal de detalle de ofertas -->
        <div v-if="modalOfertas.visible" class="modal-ofertas-backdrop">
            <div class="modal-ofertas-content">
                <div class="modal-ofertas-header">
                    <b>{{ modalOfertas.comercio?.empresa?.name }}</b>
                    <button class="btn-close" @click="cerrarModalOfertas" aria-label="Cerrar"></button>
                </div>
                <div class="modal-ofertas-body">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item oferta-item" v-for="oferta in modalOfertas.ofertas" :key="oferta">
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
                                    <span v-html="resaltarBusqueda(oferta?.products?.name, params_filtro.nombre_prod)"></span>
                                    <small v-if="oferta?.url"><a :href="oferta?.url" target="_blank">&nbsp;IR A WEB</a></small>
                                </div>
                            </div>
                        </li>
                    </ul>
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

    const modalOfertas = ref({ visible: false, comercio: null, ofertas: [] })

    function mostrarModalOfertas(comercio, ofertas) {
        modalOfertas.value = { visible: true, comercio, ofertas }
    }
    function cerrarModalOfertas() {
        modalOfertas.value.visible = false
    }

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

    function resaltarBusqueda(texto, termino) {
        if (!termino || typeof texto !== 'string') return texto;
        const regex = new RegExp(`(${termino})`, 'ig');
        return texto.replace(regex, '<mark>$1</mark>');
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
    min-width: 120px;
    font-size: 1.3rem;
}
.product-name-cont{
  font-weight: bolder;
  font-size: 1rem;
  color: #1e3c82;
}
.card-header {
  font-size: 1.1rem;
}
.card {
  border-radius: 1rem;
  transition: box-shadow 0.2s;
  min-height: 22rem;
  max-height: 22rem;
  display: flex;
  flex-direction: column;
}
.card-body {
  flex: 1 1 auto;
  overflow: hidden;
  padding-bottom: 0.5rem;
}
.oferta-item:focus {
  outline: 2px solid #20c997;
  outline-offset: 2px;
  box-shadow: 0 0 0 0.2rem rgba(32, 201, 151, 0.25);
}
.oferta-item:hover {
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}
.expand-btn {
  font-weight: bold;
  color: #198754;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.5rem 0;
  transition: color 0.2s;
}
.expand-btn:focus {
  outline: 2px solid #20c997;
  outline-offset: 2px;
}
/* Modal estilos */
.modal-ofertas-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-ofertas-content {
  background: #fff;
  border-radius: 1rem;
  max-width: 600px;
  width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 32px 0 rgba(32, 201, 151, 0.15);
  display: flex;
  flex-direction: column;
}
@media (max-width: 600px) {
  .modal-ofertas-content {
    max-width: 98vw;
    width: 98vw;
    border-radius: 0.5rem;
  }
}
.modal-ofertas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem 0.5rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.modal-ofertas-body {
  padding: 1rem 1.5rem;
}
.card-footer {
  background: transparent;
  border: none;
  text-align: center;
  margin-top: 0.5rem;
}
</style>