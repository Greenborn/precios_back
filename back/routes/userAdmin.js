const express = require('express')
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt');
const uuid = require("uuid")
const fs = require("fs")

router.get('/info', async function (req, res) {
  let data = {
    rutas: []
  }
  res.status(200).send({ stat: true, data: data })
})

router.post('/login', async function (req, res) {
  let data = {
    rutas: []
  }
  res.status(200).send({ stat: true, data: data })
})