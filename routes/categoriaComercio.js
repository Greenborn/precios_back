const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt');
const uuid = require("uuid")
const fs = require("fs")

const CategoriaComercio = require('../models/CategoriaComercio')

router.get('/getAll', async function (req, res) {
  console.log("query ", req.query)

  let modelCatComercio = new CategoriaComercio()
  res.status(200).send({ stat: true, data: await modelCatComercio.getAll() })
})

router.put('/put_one', async function (req, res) {
  console.log("query ", req.query)
  
  let modelCatComercio = new CategoriaComercio()
  modelCatComercio.complete( req.query )

  if (modelCatComercio.isValid()){
    res.status(200).send({ stat: true, data: await modelCatComercio.update() })
  } else {
    res.status(200).send({ stat: false, text: 'datos invalidos' })
  }
  
})