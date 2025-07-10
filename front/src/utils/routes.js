
export async function routerBeforeEach( router, storeApp ){
  router.beforeEach(async (to, from, next) => {
    
    //Se comprueba si la ruta a la que accede existe en el arreglo de rutas, si es así
    //se debe atualizar el valor de la ruta actual
    for (let i in storeApp.rutas){
      
      if (to.path == storeApp.rutas[i].path){
        storeApp.ruta_actual = storeApp.rutas[i]
        storeApp.ruta_actual["title"] = storeApp.rutas[i].meta.title

        //buscamos la ruta entre las opciones de menu para expandir la que corresponda
        for (let i_opcion_l0 in storeApp.opcionesMenu) {
          for ( let i_opcion_l1 in storeApp.opcionesMenu[i_opcion_l0].sub_items){
            if (storeApp.opcionesMenu[i_opcion_l0].sub_items[i_opcion_l1].path == to.path){
              storeApp.opcionesMenu[i_opcion_l0].expanded = true
              break;
            }
          }
        }
        break;
      }
    }
    
    next()
  })
}
