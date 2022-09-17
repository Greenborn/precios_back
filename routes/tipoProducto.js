const express = require('express')
var router = express.Router()
module.exports = router
const fs = require("fs")

const TipoProductoModel = require('../models/TipoProductoModel')

router.get('/getAll', async function (req, res) {
  console.log("query ", req.query)

  let modelCatComercio = new TipoProductoModel()
  res.status(200).send({ stat: true, data: await modelCatComercio.getAll() })
})

router.put('/put_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new TipoProductoModel()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.isValid()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.update() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})

router.post('/add_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new TipoProductoModel()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.isValid()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.create() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})

router.delete('/delete_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new TipoProductoModel()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.exists()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.delete() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})
