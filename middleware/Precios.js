
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
router.use("/tipo-producto", require("../routes/tipoProducto"))
router.use("/unidad-medida", require("../routes/unidadMedida"))

var paths = [
 
  { path: "/categoria-comercio/getAll" },
  { path: "/categoria-comercio/put_one" },
  { path: "/categoria-comercio/add_one" },
  { path: "/categoria-comercio/delete_one" },

  { path: "/tipo-producto/getAll" },
  { path: "/tipo-producto/put_one" },
  { path: "/tipo-producto/add_one" },
  { path: "/tipo-producto/delete_one" },

  { path: "/unidad-medida/getAll" },
  { path: "/unidad-medida/put_one" },
  { path: "/unidad-medida/add_one" },
  { path: "/unidad-medida/delete_one" }
]
