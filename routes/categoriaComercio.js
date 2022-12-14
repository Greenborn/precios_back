const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

const CategoriaComercio = require('../models/CategoriaComercioModel')

router.get('/getAll', async function (req, res) {
  console.log("query ", req.query)

  let modelCatComercio = new CategoriaComercio()
  res.status(200).send({ stat: true, data: await modelCatComercio.getAll() })
})

router.put('/put_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new CategoriaComercio()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.isValid()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.update() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})

router.post('/add_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new CategoriaComercio()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.isValid()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.create() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})

router.delete('/delete_one', async function (req, res) {
  console.log("query ", req.body)
  
  let modelCatComercio = new CategoriaComercio()
  modelCatComercio.complete( req.body )

  if (modelCatComercio.exists()){
    res.status(200).send({ stat: modelCatComercio.status, data: await modelCatComercio.delete() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})
