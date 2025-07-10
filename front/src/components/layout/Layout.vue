<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-auto p-0"><AppMenu></AppMenu></div>
      <div class="col component-container pt-0" :class="{ 'sidebar_minimized': !storeApp.sidebarVisible }" @click="deexpand_options_menu">
        <AppTopbar></AppTopbar>
        
        <router-view v-if="(storeApp.sidebarVisible && innerWidth() < 576) || innerWidth() > 576"></router-view>
      </div>
    </div>

    <div class="row" v-if="(!storeApp.sidebarVisible && innerWidth() < 576) || innerWidth() < 576" @click="deexpand_options_menu">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import AppTopbar from './AppTopbar.vue'
import AppMenu   from './AppMenu.vue'

import { AppStore } from "../../stores/app";

const storeApp = AppStore()

function innerWidth(){
  return window.innerWidth
}

function deexpand_options_menu(){
  for (let key in storeApp.opcionesMenu){
    storeApp.opcionesMenu[key].expanded = false
  }
}
</script>

<style lang="scss" scoped>

.component-container{
  max-width: calc( 100vw - 20rem);
}

.sidebar_minimized{
  max-width: calc( 100vw - 5rem);
}
</style>