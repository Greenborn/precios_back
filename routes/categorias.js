const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

router.get('/all', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        salida = await global.knex('categorias_menu')
                        .orderBy('nombre', "ASC")
        res.status(200).send({ stat: true, items: salida, error: true })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    }    
})

router.get('/get_empresas_categoria', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        salida = await global.knex('enterprice_categorias_menu')
                        .where('menu_category_id', req.query.menu_category_id)
        if (salida){
            for (let i=0; i < salida.length; i++){
                salida[i]['enterprice'] = global.enterprice_diccio[salida[i]['enterprice_id']]
            }
            res.status(200).send({ stat: true, items: salida, error: true })
        }
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    }    
})

router.get('/get_categoria_empresa', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        salida = await global.knex('enterprise_category')
                        .where('enterprise_id', req.query.enterprise_id)
        if (salida){
            for (let i=0; i < salida.length; i++){
                salida[i]['category'] = global.category_diccio[salida[i]['category_id']]
            }
            res.status(200).send({ stat: true, items: salida, error: true })
        }
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    }    
})