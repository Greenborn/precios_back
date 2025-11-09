require("dotenv").config({ path: '.env' })
const busqueda_productos = require("./controllers/busqueda_productos")

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
global.products_diccio = {}
global.products_diccio_id = {}
global.products_category_diccio = { by_product_id: {}, by_category_id: {} }

// Configurar zona horaria del proceso para Argentina (UTC-3)
process.env.TZ = 'America/Argentina/Buenos_Aires';

//Es de esperar que en 3s ya tenemos conexion disponible
setTimeout(async () => {
  await base_de_datos_iniciada()
}, 2000)

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
  app_API.use(bodyParser.json({limit: '50mb'}))

  //MIDLEWARE
  app_API.use("/publico", require("./middleware/Publico"))
  app_API.use("/admin", require("./middleware/Admin"))

  server_API.listen(process.env.service_port_api)
  console.log('Servidor escuchando en: ',process.env.service_port_api)

  let locales = await global.knex('branch').select()
  let enterprice = await global.knex('enterprice').select()
  let alias = await global.knex('alias_busqueda').select()
  let category = await global.knex('category').select()
  global.alias_productos = await global.knex('alias_productos').select()
                              .join('products', 'products.id', 'alias_productos.product_id')
  let precios_hoy = await global.knex('price_today').select()
  global.diccio_name_category = {}
   
  let product_category = await global.knex('product_category').select()

  if (precios_hoy)
    await generar_diccio_precios(precios_hoy)

  if (category){
    for (let i=0; i < category.length; i++)
      global.diccio_name_category[category[i].name] = category[i]
  }

  if (product_category && products && locales && enterprice && global.alias_productos ){

    for (let i=0; i < enterprice.length; i++){
      global.enterprice_diccio[Number(enterprice[i].id)] = enterprice[i]
      global.branch_enterprice_diccio[Number(enterprice[i].id)] = []
    }

    for (let i=0; i < locales.length; i++){
      global.branchs_diccio[Number(locales[i].id)] = locales[i]
      global.branch_enterprice_diccio[Number(locales[i].enterprise_id)].push( locales[i] )
    }

    for (let i=0; i < global.alias_productos.length; i++){
      global.alias_productos[i].name = global.alias_productos[i].name.normalize('NFD')
                                .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
                                .normalize().toLowerCase()
      global.products_diccio[global.alias_productos[i].name] = global.alias_productos[i]
      global.products_diccio_id[global.alias_productos[i].id] = global.alias_productos[i]
    }
    
    await busqueda_productos.inicializa_buscador()

  }
  
  if (category)
    for (let i=0; i < category.length; i++)
      global.category_diccio[Number(category[i].id)] = category[i]

  if (alias)
    for (let i=0; i < alias.length; i++)
      global.alias_busqueda[alias[i].alias.toLowerCase()] = alias[i].termino

  // Programar actualización de price_today al inicio y cada 24 horas en proceso separado
  programarActualizacionPriceToday()
}

// Scheduler no bloqueante: corre el script en un proceso hijo para evitar bloquear el event loop
let priceTodayJobRunning = false
function programarActualizacionPriceToday(){
  const { fork } = require('child_process')
  const path = require('path')
  const run = () => {
    if (priceTodayJobRunning){
      console.log('[price_today] Job en ejecución, se omite')
      return
    }
    priceTodayJobRunning = true
    const child = fork(path.join(__dirname, 'scripts', 'actualizar_price_today.js'))
    child.on('exit', async (code) => {
      priceTodayJobRunning = false
      console.log('[price_today] Job finalizado con código', code)
      // Actualizar la estructura de búsqueda después de actualizar price_today
      try {
        await busqueda_productos.inicializa_buscador();
        console.log('[busqueda_productos] Estructura de búsqueda actualizada tras price_today.');
      } catch (err) {
        console.error('[busqueda_productos] Error al actualizar estructura de búsqueda:', err);
      }
    })
    child.on('error', (err) => {
      priceTodayJobRunning = false
      console.error('[price_today] Error en job:', err)
    })
  }
  // Ejecutar una vez al inicio
  run()
  // Repetir cada 24 horas
  setInterval(run, 24 * 60 * 60 * 1000)
}
