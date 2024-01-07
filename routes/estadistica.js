const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

router.get('/data', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        const ESTADISTICA = req.query?.id_estadistica
        const ID_PRODUCTO = req.query?.id_producto
        const ID_LOCAL    = req.query?.id_local

        let salida = []
        switch (ESTADISTICA) {
            case "incremental_stats":
                salida = await global.knex('incremental_stats')
                res.status(200).send({ stat: true, items: salida })
                break;
            
            case "precios_por_negocio":
                salida = await global.knex('sumatoria_cant_precios_negocio')
                                .where( 'cantidad', '>', 0)
                                .orderBy('cantidad', "DESC")
                res.status(200).send({ stat: true, items: salida })
                break;
                
            case "trending":
                salida = await global.knex('estadistica_trending_terminos')
                                .orderBy('cantidad', "DESC")
                res.status(200).send({ stat: true, items: salida })
                break;

            case "variacion_precio":
                let precios = await global.knex('price')
                                .where({ product_id: ID_PRODUCTO, branch_id: ID_LOCAL })
                res.status(200).send({ stat: true, items: precios })           
                break;

            default:
                res.status(200).send({ stat: false, items: [], error: true })
                break;
        }
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    } 
  
    
  })