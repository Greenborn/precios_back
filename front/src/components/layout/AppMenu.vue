<template>

  <div :class="{ minimized: !storeApp.sidebarVisible}" class="menu-cont" >
    <div class="w-100">
      <div class="row justify-content-center">
        <div class="col-auto mt-3 mb-5">
          <div class="cont-img-header"></div>
        </div>
      </div>

      <div class="row" v-for="(item) in storeApp.opcionesMenu" :key="item" 
           :class="{ active: storeApp.ruta_actual.path == item.path }">
<!-- SI NO TIENE SUB ITEMS -->
        <div class="col menu-item-l0 mt-1"  
              v-if="item.sub_items.length == 0"
              @click="click(item)">
          <div class="row align-items-center">
            <div class="col-auto">
              <i :class="'pi menu-icon ' + item.icon"></i>
            </div>
            <div class="col title-cont">
              <span>{{item.title}}</span>
            </div>
          </div>
        </div>
<!-- SI TIENE SUB ITEMS-->
        <div v-if="item.sub_items.length > 0">
          <div class="row justify-content-cente">
            <div class="col menu-item-l0 mt-1"  
                  @click="click(item)">
              <div class="row align-items-center">
                <div class="col-auto">
                  <i :class="'pi menu-icon ' + item.icon"></i>
                </div>
                <div class="col title-cont">
                  <span>{{item.title}}</span>
                </div>
                <div class="col-auto icon-expand">
                  <i :class="'pi menu-icon ' + (item.expanded ? storeApp.sidebarVisible ? 'pi-chevron-up' : 'pi-chevron-left': storeApp.sidebarVisible ? 'pi-chevron-down' : 'pi-chevron-right')"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="row sub-item-cont align-items-center" 
                :class="{ item_minimized: !item.expanded,  item_expanded: item.expanded }"
                :style="{ 'height': get_sub_items_height(item) }">
            <div class="col">

              <div class="row align-items-center menu-item-l1" v-for="(subitem) in item.sub_items" :key="subitem"
                    :class="{ active: storeApp.ruta_actual.path == subitem.path }"
                    @click="click(subitem)">
                <div class="col-auto">
                  <i :class="'pi menu-icon ' + subitem.icon"></i>
                </div>
                <div class="col title-cont">
                  <span>{{subitem.title}}</span>
                </div>
              </div>

            </div>
          </div>
          
        </div>

      </div>
    </div>
  </div>
  
</template>

<script setup>
  import { ref }      from "vue"
  import { AppStore } from "../../stores/app";
  import { useRouter } from 'vue-router'

  const storeApp = AppStore();
  const router = useRouter()

  function get_sub_items_height( item ){
    return (item.sub_items.length * 2.5) + 1 + 'rem'
  }

  function get_sub_items_width(){
    if (storeApp.sidebarVisible){
      return 20 + 'rem'
    }
    return 5 + 'rem'
  }

  function click( item ){
    let exp_aux = item.expanded
    for (let key in storeApp.opcionesMenu){
      storeApp.opcionesMenu[key].expanded = false
    }
    item.expanded = !exp_aux
    
    if (item.component != undefined && item.component != ""){
      storeApp.ruta_actual = item
      router.push(item.path)
    }
      
    if (item.hasOwnProperty('onClick'))
      item.onClick( item )
  }


</script>

<style  lang="scss" scoped>
@import "../../assets/styles/_variables";

.menu-cont{
  width:      20rem;
  transition: .33s;
  min-height: 100vh;
  height:     100%;
  overflow:   hidden;
  overflow-y: scroll;

  background-color: #0f054c;

  z-index: 1000;

  .cont-img-header{
    background: #fff;
    border-radius: 100%;
    width: 5rem;
    height: 5rem;

    img {
      width: 100%;
      height: auto;
    }
  }
  
  .sub-item-cont{
    transition: .33s;
    background: #2f2f2f;
  }

  .menu-item-l1{
    padding-left: 1rem;
    font-size:    1rem;
    height:       2.5rem;
  }
  .menu-item-l0 {
    background-color: #0f054c;
    height: 3rem;
  }

  .menu-item-l0, .menu-item-l1{
    cursor:             pointer;
    font-weight:        bold;
    user-select:        none;
    color:            #FFF;
  }

  .menu-item-l0:hover, .menu-item-l1:hover {
    background-color: #4ca3e6;
  }

  .menu-icon{
    font-weight: bold;
    font-size: 1.5rem;
    padding: .5rem;
  }
  .active, .active .menu-item-l0 {
    background-color: #4ca3e6;
  }

  .expanded {
    .menu-item-l0 {
      background-color: #2f2f2f;
    }
  }

}

.minimized{
  width: 5rem;

  .icon-expand{
    display: none;
  }

  .title-cont{
    display: none;
  }

  .item_expanded{
    z-index: 2000;
    position: absolute;
    width: 20rem;
    left: 5.5rem;
    margin-top: -5rem;

    .title-cont{
      display: block;
    }
  }

  .menu-item-l1{
    padding-left: 0rem;
  }

  .menu-icon {
    padding-left: 1.5rem;
  }

  .cont-img-header{
    width: 3rem;
    height: 3rem;
  }
}

.item_minimized{
  height: 0px !important;
  overflow: hidden;
}

@media (max-width: 576px) { 
  .minimized {
    min-height: 5.4rem;
    height:     5.4rem;

    overflow: hidden;
  }
}

</style>