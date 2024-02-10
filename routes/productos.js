const express = require('express')
require("dotenv").config({ path: '../.env' })
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")
const cargador_precios = require("../scripts/importar_productos")

router.get('/all', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        salida = global.products_category_diccio.by_category_id[req?.query?.category_id]
        res.status(200).send({ stat: true, items: salida, error: true })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    }    
})


let diccio_limit = {}

router.put('/cargar_nuevo_precio', async function (req, res) {
    console.log("data ", req.body)
    
    try {
        const AHORA = new Date()
        const PROD_ID = req.body?.product_id
        const BRANCH_ID = req.body?.branch_id
        const PRICE = req.body?.price
        if (!PROD_ID || !BRANCH_ID || !PRICE){
            res.status(200).send({ stat: false, error: "Error interno, reintente luego" })
            return
        }

        let IP = req.header('x-forwarded-for')
        if (IP == undefined)
            IP = 'NO_IP'
        const PB = PROD_ID+'_'+BRANCH_ID
        if (diccio_limit[IP] === undefined){
            diccio_limit[IP] = { cantidad: 1 }
        } else {
            if (Number(AHORA.getTime()) - diccio_limit[IP]['ultimo_intento'] < 3000){
                res.status(200).send({ stat: false,  error: "Pasó muy poco tiempo del último ingreso!" })
                return
            }
        }
        diccio_limit[IP]['ultimo_intento'] = Number(new Date().getTime())
        diccio_limit[IP]['cantidad'] += 1
        if (diccio_limit[IP]['cantidad'] > 100){
            res.status(200).send({ stat: false,  error: "Superó la cantidad máxima de ingresos, reintente mañana" })
            return
        }

        if (diccio_limit[IP][PB] === undefined){
            diccio_limit[IP][PB] = 1
        } else {
            console.log("cuota excedida")
            res.status(200).send({ stat: false,  error: "Solo se permite el ingreso de un precio corregido por cada Producto y Negocio" })
            return
        }
        console.log(diccio_limit)

        const HOY = new Date()

        const insert = {
            "product_id": PROD_ID,
            "price": PRICE,
            "date_time": HOY,
            "branch_id": BRANCH_ID,
            "es_oferta": 0,
            "confiabilidad": 50,
            "url": null,
            "notas": "Precios de la Gente - ingresado por formulario de corrección de precio"
        }
        
        res.status(200).send({ stat: await global.knex('price').insert( insert ) })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }    
})

router.post('/importar', async function (req, res) {
    console.log("data ", req.body)
    const KEY = req.body?.key
    try {
        const KEY_VALID = process.env.KEY_INT
        if (KEY != KEY_VALID){
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
            return
        }

        let HOY = new Date()
        HOY.setHours(0,0,0,1)

        let trx = await knex.transaction()
        let res_procesa = await cargador_precios.procesar_articulo( trx, req.body, HOY )
        if (res_procesa){
            await trx.commit()
            res.status(200).send({ stat: true })
            return
        } else {
            console.log(res_procesa)
            await trx.rollback()
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
            return
        }
        
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }    
})