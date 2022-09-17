
let express = require('express')
let _ = require("lodash")
let router = express.Router()
const { check_roles } = require("../helpers/authorization")
module.exports = router

router.use(function (request, response, next) {
  console.log("Precios middleware", request.path)
  check_roles(request, response, next, paths)
})


router.use("/categoria-comercio", require("../routes/categoriaComercio"))

var paths = [
 
  { path: "/categoria-comercio/getAll" },
  { path: "/categoria-comercio/put_one" }
]
