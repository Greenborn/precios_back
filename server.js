require("dotenv").config({ path: '.env' })

//conexion a base de datos
let conn_obj = {
  host: process.env.mysql_host,
//  port: process.env.mysql_port,
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
  pool: { min: 0, max: 1000, "propagateCreateError": false }
});
global.branchs_diccio = {}
global.branch_enterprice_diccio = {}
global.alias_busqueda = {}
global.enterprice_diccio = {}
global.category_diccio = {}
global.products = []
global.precios_diccio = {}
global.products_category_diccio = { by_product_id: {}, by_category_id: {} }

//Es de esperar que en 3s ya tenemos conexion disponible
setTimeout(async () => {
  await base_de_datos_iniciada()
}, 2000)

async function asignar_precio( product ){
  let precios_aux = {}

  let precios = await global.knex('price')
                  .where({ product_id: product.id })
                  .orderBy('date_time', 'desc')
  if (precios){
    for (let i=0; i < precios.length; i++){
      let branch_id = precios[i].branch_id
      if (!precios_aux[branch_id]){
        precios_aux[branch_id] = precios[i]
      }
    }

    product['precios'] = []
    let _keys = Object.keys(precios_aux)
    for (let i=0; i < _keys.length; i++){
      const branch_ = global.branchs_diccio[ Number(precios_aux[_keys[i]].branch_id ) ]
      const precio_reg = {... 
        precios_aux[_keys[i]],
        branch: {...
            branch_,
            "enterprise":{
              ... global.enterprice_diccio[ Number(branch_.enterprise_id ) ]
            }
        }
      }
      product['precios'].push( precio_reg )
    }
    return true
  } else
    return false
}

async function generar_diccio_precios(precios_hoy){
  for (let i=0; i < precios_hoy.length; i++){
    if (global.precios_diccio[precios_hoy[i].product_id] == undefined){
      global.precios_diccio[precios_hoy[i].product_id] = []
    }
    
    global.precios_diccio[precios_hoy[i].product_id].push(precios_hoy[i])
  }
}

async function base_de_datos_iniciada(){
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
  app_API.use("/publico", require("./middleware/Publico"))
  app_API.use("/admin", require("./middleware/Admin"))

  server_API.listen(process.env.service_port_api)
  console.log('Servidor escuchando en: ',process.env.service_port_api)

  let locales = await global.knex('branch').select()
  let enterprice = await global.knex('enterprice').select()
  let alias = await global.knex('alias_busqueda').select()
  let category = await global.knex('category').select()
  global.products = await global.knex('products').select()
  let precios_hoy = await global.knex('price_today').select()
   
  let product_category = await global.knex('product_category').select()

  if (precios_hoy)
    await generar_diccio_precios(precios_hoy)

  if (product_category && products && locales && enterprice && global.products ){

    for (let i=0; i < enterprice.length; i++){
      global.enterprice_diccio[Number(enterprice[i].id)] = enterprice[i]
      global.branch_enterprice_diccio[Number(enterprice[i].id)] = []
    }

    for (let i=0; i < locales.length; i++){
      global.branchs_diccio[Number(locales[i].id)] = locales[i]
      global.branch_enterprice_diccio[Number(locales[i].enterprise_id)].push( locales[i] )
    }

    for (let i=0; i < global.products.length; i++){
      global.products[i].name = global.products[i].name.normalize('NFD')
                                .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
                                .normalize().toLowerCase()
    }
    
/*
    let proms_precios = []
    for (let i=0; i < products.length; i++){
      global.products_diccio[Number(products[i].id)] = products[i]
      proms_precios.push(asignar_precio( global.products_diccio[Number(products[i].id)] ))
    }
    await Promise.all( proms_precios )

    for (let i=0; i < product_category.length; i++){
      const ID_PROD = product_category[i].product_id
      const ID_CAT = product_category[i].category_id
      if (global.products_category_diccio.by_product_id[ID_PROD] == undefined)
        global.products_category_diccio.by_product_id[ID_PROD] = []
      global.products_category_diccio.by_product_id[ID_PROD].push( ID_CAT )
      
      if (global.products_category_diccio.by_category_id[ID_CAT] == undefined)
        global.products_category_diccio.by_category_id[ID_CAT] = {}
    
      global.products_category_diccio.by_category_id[ID_CAT][ID_PROD] = global.products_diccio[ID_PROD]
    }*/
  }
  
  if (category)
    for (let i=0; i < category.length; i++)
      global.category_diccio[Number(category[i].id)] = category[i]

  if (alias)
    for (let i=0; i < alias.length; i++)
      global.alias_busqueda[alias[i].alias.toLowerCase()] = alias[i].termino
}
