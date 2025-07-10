<template>
<div class="row align-items-center">
  <div class="col">
    <div class="row">
      <div class="col text-center">
        <p class="text-user">Usuario: {{storeApp.userInfo.name}}</p>
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col-3 mb-5">
        
      </div>
    </div>
  </div>
</div>

</template>

<script setup>
  import { AppStore } from "../../stores/app";
  const storeApp = AppStore()
</script>

<style scoped>
.text-user{
  font-weight: bold;
  font-size: 1.5rem;
}
</style>