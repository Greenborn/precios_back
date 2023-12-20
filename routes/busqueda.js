const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")

const AlmacenDatos = require('../controllers/almacenDatos')

router.get('/precio', async function (req, res) {
  console.log("query ", req.query)

  res.status(200).send({ stat: true, data: [] })
})
