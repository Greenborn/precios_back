const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

async function buscar_precios_producto( id_producto ){
  return new Promise(async (resolve, reject) => {
    try{
      let branch_diccio = {}

      let precios = await global.knex('price')
                    .where('product_id', id_producto)
                    .andWhere('date_time', '>', knex.raw('DATE_SUB(NOW(), INTERVAL 1 MONTH)'))
                    .orderBy('date_time', 'desc')
      
      let salida = []
      if (precios){
        for (let i=0; i < precios.length; i++){
          let branch_id = precios[i].branch_id
          if (!branch_diccio[branch_id]){
            branch_diccio[branch_id] = true
            salida.push(precios[i])
          }
        }
        resolve(salida)  
      } else
        resolve([])

    } catch (error) {
      console.log(error)
      resolve([])
    }       
  })
}

function insertar_ordenado( array_, elemento, campo="price", sentido = "asc" ){
  const ARR_LEN = array_.length

  if (ARR_LEN == 0){
    array_.push(elemento)
    return array_
  }

  for (let i=0; i < ARR_LEN; i++){
    if (sentido == "asc" && array_[i][campo] > elemento[campo]){
      array_.splice(i, 0, elemento)
      return array_
    } else if (sentido == "desc" && array_[i][campo] < elemento[campo]){
      array_.splice(i, 0, elemento)
      return array_
    }
  }

  array_.push(elemento)
  return array_
}

async function hacer_busqueda( termino, metodo ){
  return new Promise(async (resolve, reject) => {
    try{

      let PALABRAS = termino.split(" ")

      let SQL = " (name LIKE ?) "
      params = ['%'+PALABRAS[0]+'%']
      for (let i=1; i < PALABRAS.length; i++){
        SQL += " AND (name LIKE ?) "
        params.push('%'+PALABRAS[i]+'%')
      }

      productos = await global.knex
                    .select()
                    .from('products')
                    .whereRaw(SQL, params)

      let diccio_productos = {}
      let diccio_precios = {}
      let list_precios = []

      if (productos){
        let proms_precios = []
        for (let i=0; i < productos.length; i++){
          proms_precios.push(buscar_precios_producto(productos[i].id))
          diccio_productos[Number(productos[i].id)] = productos[i]
        }

        let res_precios = await Promise.all(proms_precios)
        if (res_precios){
          for (let i=0; i < res_precios.length; i++){
            for (let j=0; j < res_precios[i].length; j++){
              let result_precio = res_precios[i][j]
              if (diccio_precios[Number(result_precio["id"])] != undefined) //si ya existe no seagre a la salida
                continue

              diccio_precios[Number(result_precio["id"])] = result_precio
              result_precio["branch"] = global.branchs_diccio[result_precio["branch_id"]] //quitar
              result_precio["locales"] = global.branch_enterprice_diccio[global.branchs_diccio[result_precio["branch_id"]].enterprise_id]
              result_precio["products"] = diccio_productos[result_precio["product_id"]]

              list_precios = insertar_ordenado(list_precios, result_precio)
            }
          }

          let aux = []
          for (let i=0; i < list_precios.length; i++){
            list_precios[i]['date_time'] = new Date(list_precios[i]['date_time']).getTime()
            aux = insertar_ordenado(aux, list_precios[i], 'date_time', "desc")
          }

          console.log(SQL, params)
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
    let product_name = req?.query?.product_name

    if (product_name.length < LIMITE_MIN_CARACTERES)
      return res.status(200).send({ stat: false, items: [], error: true })

  
    product_name = nombre_producto_filtrado( product_name)
    let res_busqueda = await hacer_busqueda( product_name, 'AND' ) 
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
