<template>
  <div class="fluid-container login-container">
    <div class="row h-100 align-items-center">

      <div class="form-cont col col-sm-10 offset-sm-1 col-md-8 offset-md-2 col-xl-6 offset-xl-3 col-xxl-4 offset-xxl-4 p-5 mb-5">
        <div class="row">
          <div class="col mt-5">
            <h3 class="title text-center">Ingreso al sistema</h3>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <label for="email1" class="mb-1">Email</label>
            <InputText id="email1" v-model="login_data.email" type="text" class="el-input w-100 mb-3" placeholder="usuario@usuario.com"/>
          </div>
        </div>

        <div class="row">
          <div class="col"> 
            <label for="password1" class="mb-1">Contraseña</label>
            <InputPassword id="password1" v-model="login_data.password" placeholder="contraseña" :toggleMask="true"
                class="el-input w-100 mb-5" inputClass="w-100" :feedback="false"></InputPassword>
          </div>
        </div>

        <div class="row">
          <div class="col mb-5">
            <Button label="Login" class="w-100" v-on:click="do_login()"></Button>
          </div>
        </div>
      </div>

    </div>
  </div>
  <Spinner :loading="storeApp.loading"></Spinner>
</template>

<script setup >
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { required, email } from '@vuelidate/validators'
import { ref } from 'vue';
import Spinner   from '../components/layout/Spinner.vue'

import { AppStore } from "../stores/app";
import { login } from '../api/admin/userAdmin'
import { setUserInfo } from '../utils/auth'

const storeApp = AppStore();

const login_data = ref({
  'email': '',
  'password': '',
  'remember': false
})

const router = useRouter()

async function do_login() {
  storeApp.loading = true
  let login_req = await login(login_data.value)
  if (login_req.stat) {
    storeApp.loading = false
    setUserInfo( 'admin', storeApp, login_req.data.u_data, router, login_req.data.token)
    router.replace('/admin/dashboard')
  } else {
    storeApp.loading = false
    console.log('login fallido', {
      stat: login_req?.stat,
      texto: login_req?.text,
      error: login_req?.error,
      msg: login_req?.msg,
      origin: window.location.origin,
      email: login_data.value.email,
    })
  }
}
</script>

<style scoped>
</style>