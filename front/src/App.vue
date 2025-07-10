<template>
  <router-view />

  <ModalsManager></ModalsManager>
  <ChatBot></ChatBot>
  <Spinner :loading="storeApp.loading"></Spinner>
  <ModalsManager></ModalsManager>
</template>

<script setup >
  import { AppStore } from "./stores/app";
  import ModalsManager   from './components/layout/ModalsManager.vue'
  import Spinner   from './components/layout/Spinner.vue'
  import ChatBot from "./components/layout/chatbot/ChatBot.vue"

  const storeApp = AppStore()
</script>
