require("dotenv").config({ path: '.env' })

//conexion a base de datos
let conn_obj = {
  host: process.env.mysql_host,
  port: process.env.mysql_port,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
  supportBigNumbers: true,
  bigNumberStrings: true,
  typeCast: function (field, next) {
      if (field.type == "NEWDECIMAL") {
          var value = field.string();
          return (value === null) ? null : Number(value);
      }
      return next();
  }

}

global.knex = require('knex')({
  client: 'mysql2',
  connection: conn_obj,
  pool: { min: 0, max: 7 }
});

//Es de esperar que en 3s ya tenemos conexion disponible
setTimeout(async () => {
  base_de_datos_iniciada()
}, 2000)

function base_de_datos_iniciada(){
  console.log('se establecio conexion DB')

  let app_API = require('express')();
  let server_API = require('http').Server(app_API);

  //CORS
  let cors_origin = process.env.cors_origin.split(' ')
  let cors = require('cors')
  let corsOptions = {
    credentials: true,
    origin: cors_origin
  }
  app_API.use(cors(corsOptions))

  //FORMATEO
  let bodyParser = require("body-parser")
  app_API.use(bodyParser.json())

  //MIDLEWARE
  app_API.use("/precios", require("./middleware/Precios"))
  app_API.use("/admin", require("./middleware/Admin"))

  server_API.listen(process.env.service_port_api)
  console.log('Servidor escuchando en: ',process.env.service_port_api)
}