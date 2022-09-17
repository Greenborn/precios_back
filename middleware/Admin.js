
let express = require('express')
let _ = require("lodash")
let router = express.Router()
const { check_roles } = require("../helpers/authorization")
module.exports = router

router.use(function (request, response, next) {
  console.log("Admin middleware", request.path)
  check_roles(request, response, next, paths)
})


router.use("/user", require("../routes/userAdmin"))

var paths = [
  { path: "/user/info" },
  { path: "/user/login" }
]