
let express = require('express')
let _ = require("lodash")
let router = express.Router()
const { check_roles } = require("../helpers/authorization")

module.exports = router

router.use(function (request, response, next) {
  console.log("Precios middleware", request.path)
  check_roles(request, response, next, paths)
})


router.use("/busqueda", require("../routes/busqueda"))
router.use("/estadistica", require("../routes/estadistica"))
router.use("/categorias", require("../routes/categorias"))
router.use("/productos", require("../routes/productos"))

var paths = [
 
  { path: "/busqueda/precios" },
  { path: "/estadistica/data" },
  { path: "/estadistica/precios_usuarios" },
  { path: "/categorias/all" },
  { path: "/categorias/get_empresas_categoria" },
  { path: "/categorias/get_categoria_empresa" },
  { path: "/productos/all" },
  { path: "/productos/importar" },
  { path: "/productos/importar_alquiler" },
]
