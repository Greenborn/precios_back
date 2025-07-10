<template>
<PublicTopBar />
    
<div class="container-fluid" id="novedades-cnt">
    <div class="row align-items-center justify-content-center">
        <div class="col-12 col-md-10 col-lg-8 ">
            <div class="card mb-1 p-0">

                <div class="card-header p-4 pb-0">
                    <h4>Novedades</h4>
                </div>

                <div class="card-body p-4">
                    <template v-if="novedades.length != 0">
                        <div class="alert alert-info" v-for="novedad in novedades" :key="novedad">
                            <div class="row">

                                <div class="col-12 col-md-6 col-lg-auto">
                                    <b>{{ novedad.datetime }}:</b>
                                </div>

                                <div class="col-12 col-md-6 col-lg-auto">
                                    {{ novedad.text }}
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
    import { ref, onMounted } from 'vue'
    import { public_news } from '../api/public/publicEndpoints'
    import { AppStore } from "../stores/app"
    import PublicTopBar from '../components/publico/PublicTopBar.vue';

    const storeApp = AppStore()
  
    const novedades = ref([])

    onMounted(async ()=>{
        storeApp.loading = true
        let res = await public_news()
        if (res){
            storeApp.loading = false
            if (res?.error){
                storeApp.mostrar_alerta( "Ocurrio un error al cargar las novedades" )
                return false
            }
            novedades.value = res?.items
        } else
            storeApp.loading = false
    })
</script>
  
<style scoped>
  
#novedades-cnt{
    margin-top: 5rem;
}
</style>