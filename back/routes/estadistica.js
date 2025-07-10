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
        const LIMIT       = req.query?.limit

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
            
            case "mayor_aumento_diario":
                salida = await global.knex('estadistica_aumento_diario')
                                .orderBy('porcentaje_aumento', "DESC")
                                .limit(LIMIT)
                let media =undefined
                if (salida.length > 2)     
                    media = salida[salida.length/2]
                res.status(200).send({ stat: true, items: salida, media: media })
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

router.post('/precios_usuarios', async function (req, res) {
    console.log("body ", req.body)
    
    try {
        let prom_arr = []
        if (typeof req.body.fecha == "string")
            req.body.fecha = new Date(req.body.fecha)
        for (let i=0; i < req.body.productos.length && i < 100; i++){
            prom_arr.push(
                global.knex('formulario_carga_comunitaria ')
                    .insert({
                        "fecha":req.body.fecha,
                        "nombre":req.body.nombre,
                        "nombre_comercio":req.body.comercio,
                        "nombre_producto": req.body.productos[i].nombre,
                        "marca": req.body.productos[i].marca,
                        "precio": req.body.productos[i].precio,
                        "presentacion": req.body.productos[i].presentacion,
                        "IP": req.header('x-forwarded-for') ? req.header('x-forwarded-for') : "local"
                    })
            )
        }

        await Promise.all(prom_arr)
        res.status(200).send({ stat: true, items: [], error: false })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    } 

})