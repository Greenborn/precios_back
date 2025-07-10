<template>
  <div class="row container-topbar align-items-center p-3">
    <div class="col-auto ml-2">
      <Button icon="pi pi-bars" @click="storeApp.toggle_sidebar" />
    </div>
    <div class="col">
      <h2 class="m-0 title">{{storeApp.ruta_actual.title}}</h2>
    </div>
  </div>
</template>

<script setup >
  import { ref }      from "vue"
  import { AppStore } from "../../stores/app"

  const storeApp = AppStore()
</script>

<style lang="scss" scoped>
.container-topbar{
  overflow:           hidden;
  height:             5.4rem;
  background-color: #FFF;
}

@media (max-width: 576px) { 
  
  .container-topbar {
    .title {
      font-size: 1.25rem;
      font-weight: bold;
    }
  }
}
</style>