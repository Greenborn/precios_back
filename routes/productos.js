const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

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