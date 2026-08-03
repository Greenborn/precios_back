const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")
const busqueda_productos = require("../controllers/busqueda_productos")
const utils = require("../helpers/utils")

async function hacer_busqueda( termino, metodo ){
  return new Promise(async (resolve, reject) => {
    try{

      let productos = await busqueda_productos.busqueda(termino, 200)      

      if (productos){
        console.log("Cant encontrados ", productos.length)

        for (let i=0; i < productos.length; i++){
          let result_precio = productos[i]

          result_precio["empresa"]  = global.enterprice_diccio[global.branchs_diccio[result_precio["branch_id"]].enterprise_id]
          result_precio["locales"]  = global.branch_enterprice_diccio[global.branchs_diccio[result_precio["branch_id"]].enterprise_id]
          //result_precio["products"] = diccio_productos[result_precio["product_id"]]
        }

        resolve(productos)
      }

    } catch (error) {
      console.log(error)
      resolve([])
    }
            
  })
}

async function hacer_busqueda_alquiler( termino, metodo ){
  return new Promise(async (resolve, reject) => {
    try{
      let ultimo_registro =  await global.knex('propiedades_alquiler').select().orderBy('ultima_fecha', 'desc').first()

      if (ultimo_registro) {
        let nueva_fecha = new Date( ultimo_registro.ultima_fecha )
        nueva_fecha.setDate( nueva_fecha.getDate() - 1 )

        let PALABRAS = termino.split(" ")

        let SQL = "(titulo LIKE ?) "
        let params = ['%'+PALABRAS[0]+'%']
        for (let i=1; i < PALABRAS.length; i++){
          SQL += " AND (titulo LIKE ?) "
          params.push('%'+PALABRAS[i]+'%')
        }

        let propiedades = await global.knex('propiedades_alquiler')
                      .select()
                      .whereRaw(SQL, params)
                      .andWhere( "ultima_fecha", '>', nueva_fecha )

        if (propiedades){
          let aux = []
          //console.log(propiedades)
          for (let i=0; i < propiedades.length; i++){
            aux.push(
              {
                "id": propiedades[i].id,
                "tipo": "ALQUILER",
                "moneda": propiedades[i].moneda, 
                "product_id": propiedades[i].id,
                "price": propiedades[i].precio,
                "date_time": new Date(propiedades[i].ultima_fecha).getTime(),
                "user_id": null,
                "branch_id": '',
                "es_oferta": 0,
                "porcentage_oferta": null,
                "confiabilidad": 100,
                "url": propiedades[i].url,
                "notas": null,
                "time": propiedades[i].ultima_fecha,
                "empresa": {
                  "id": -1,
                  "name": propiedades[i].locador,
                  "url_website": ""
                },
                "locales": [],
                "caracteristicas": JSON.parse(propiedades[i].especificaciones),
                "products": {
                  "id": propiedades[i].id,
                  "name": propiedades[i].titulo,
                  "vendor_id": -1,
                  "ultimo_precio_conocido": new Date(propiedades[i].ultima_fecha),
                  "last_price": propiedades[i].precio,
                  "alias": ""
                }
              }
            )
          }
          resolve(aux)
        } else 
          resolve([])

      } else
        resolve([])

    } catch (error) {
      console.log(error)
      resolve([])
    }
            
  })
}

const LIMITE_MAX_PALABRAS = 15
const LIMITE_MIN_CARACTERES = 3

function nombre_producto_filtrado( nombre ){
  let palabras = nombre.split(" ")
  let nuevo = []

  for (let i=0; i < palabras.length && i < LIMITE_MAX_PALABRAS; i++){
    nuevo.push( palabras[i] )
  }

  let nuevo_termino = nuevo.join(" ")

  let alias = global.alias_busqueda[nuevo_termino.toLowerCase()]
  console.log(alias)
  return alias != undefined ? alias : nuevo_termino
}

router.get('/precios', async function (req, res) {
  console.log("query ", req.query)

  try {
    let product_name = utils.limpiarTexto(req?.query?.product_name)

    if (product_name.length < LIMITE_MIN_CARACTERES)
      return res.status(200).send({ stat: false, items: [], error: true })

    if (product_name.search("alquiler") > -1){
      let res_busqueda = await hacer_busqueda_alquiler( product_name, 'AND' ) 
      if (res_busqueda){
        await global.knex('search_query_history')
                .insert({ 
                  "query": product_name, 
                  "date": new Date().toISOString().replace('T', ' ').replace('Z', ''), 
                  "cant_results": res_busqueda.length,
                  "ipv4": req.header('x-forwarded-for')
                })
                
        res.status(200).send({ stat: true, items: res_busqueda })
      }
    } else {
      let res_busqueda = await hacer_busqueda( product_name, 'AND' ) 
      if (res_busqueda){
        await global.knex('search_query_history')
                .insert({ 
                  "query": product_name, 
                  "date": new Date().toISOString().replace('T', ' ').replace('Z', ''), 
                  "cant_results": res_busqueda.length,
                  "ipv4": req.header('x-forwarded-for')
                })
                
        res.status(200).send({ stat: true, items: res_busqueda })
      }
    }
      
  } catch {
    res.status(200).send({ stat: false, items: [], error: true })
  }

})

async function hacer_busqueda_promo( termino, metodo ){
  return new Promise(async (resolve, reject) => {
    try{       
        let promos = undefined

        if (termino !== 'cod_todas_las_ofertas'){
          let PALABRAS = termino.toLowerCase().split(" ")
          // comparación insensible a mayúsculas aplicando LOWER sobre la columna
          let SQL = "(LOWER(titulo) LIKE ?) "
          let params = ['%'+PALABRAS[0]+'%']
          for (let i=1; i < PALABRAS.length; i++){
            SQL += " AND (LOWER(titulo) LIKE ?) "
            params.push('%'+PALABRAS[i]+'%')
          }

          promos = await global.knex('promociones_hoy')
                        .select()
                        .distinct('promociones_hoy.titulo')
                        .whereRaw(SQL, params)
        } else 
          promos = await global.knex('promociones_hoy')
                      .select()

        
        if (promos){
          let aux = []
          //console.log(propiedades)
          for (let i=0; i < promos.length; i++){
            aux.push(
              {
                "id": promos[i].id,
                "tipo": "PROMO",
                "product_id": promos[i].id_producto,
                "price": promos[i].precio,
                "date_time": new Date(promos[i].fecha).getTime(),
                "user_id": null,
                "branch_id": promos[i].branch_id,
                "es_oferta": 1,
                "porcentage_oferta": null,
                "confiabilidad": 100,
                "url": promos[i].url,
                "notas": null,
                "time": promos[i].fecha,
                "empresa": {
                  "id": -1,
                  "name": global.enterprice_diccio[global.branchs_diccio[promos[i]["branch_id"]].enterprise_id]?.name,
                  "url_website": ""
                },
                "locales": global.branch_enterprice_diccio[global.branchs_diccio[promos[i]["branch_id"]].enterprise_id],
                "caracteristicas": JSON.parse(promos[i].datos_extra),
                "products": {
                  "id": promos[i].id,
                  "name": promos[i].titulo,
                  "vendor_id": -1,
                  "ultimo_precio_conocido": new Date(promos[i].fecha),
                  "last_price": promos[i].precio,
                  "alias": ""
                }
              }
            )
          }
          resolve(aux)
        } else 
          resolve([])

    } catch (error) {
      console.log(error)
      resolve([])
    }
            
  })
}

router.get('/promociones', async function (req, res) {
  console.log("query ", req.query)

  try {
    let product_name = req?.query?.product_name

    if (product_name.length < LIMITE_MIN_CARACTERES)
      return res.status(200).send({ stat: false, items: [], error: true })

    
      product_name = nombre_producto_filtrado( product_name)
      let res_busqueda = await hacer_busqueda_promo( product_name, 'AND' ) 
      if (res_busqueda){
        await global.knex('search_query_history')
                .insert({ 
                  "query": product_name, 
                  "date": new Date(), 
                  "cant_results": res_busqueda.length,
                  "ipv4": req.header('x-forwarded-for')
                })
                
        res.status(200).send({ stat: true, items: res_busqueda })
      }
  } catch {
    res.status(200).send({ stat: false, items: [], error: true })
  }  
})

router.get('/info_comercio', async function (req, res) {
    console.log("query ", req.query)

    try {
        let website = req?.query?.website
        if (!website) {
            return res.status(200).send({ stat: false, error: "Falta parametro: website" })
        }

        let enterprice = await global.knex('enterprice').where('website', website).first()
        if (!enterprice) {
            return res.status(200).send({ stat: false, error: "No se encontro comercio con esa URL" })
        }

        let branches = await global.knex('branch').where('enterprise_id', enterprice.id)

        res.status(200).send({
            stat: true,
            items: {
                enterprice,
                branches
            }
        })

    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, error: "Error interno" })
    }
})

router.get('/comercios_promociones', async function (req, res) {
  console.log("query ", req.query)

  try {
    let comercios_promos = await global.knex('enterprice')
                            .select(['enterprice.*', 'promociones_hoy.branch_id'])
                            .join('branch', 'branch.enterprise_id', 'enterprice.id')
                            .join('promociones_hoy', 'promociones_hoy.branch_id', 'branch.id')
                            .distinct('enterprice.id')

    res.status(200).send({ stat: true, items: comercios_promos })
      
  } catch (error) {
    console.log(error)
    res.status(200).send({ stat: false, items: [], error: true })
  }  
})

