require("dotenv").config({ path: '../.env' })
const fs = require('fs');
const { Worker } = require('worker_threads');

const CANT_HILOS = 4
const NOMBRE_ARCHIVO = "unificar_prod.sql"

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
  
const knex = require('knex')({
    client: 'mysql2',
    connection: conn_obj,
    pool: { min: 0, max: 1000, "propagateCreateError": false },
    collation: 'utf8mb4_unicode_ci'
})

let unificaciones = []
const INICIO = 0
let script_sql = ""

setTimeout( async ()=>{
    fs.readFile('productos_unificar.json', async function(err, data) {
        unificaciones = JSON.parse(data);
        cant_total = unificaciones.length

        let c = INICIO
        let prods_diccio = {}

        unificaciones = unificaciones.slice(INICIO, unificaciones.length)

        let products_= await knex("products")
                                    .select()
        
        if (products_){
            fs.writeFileSync(NOMBRE_ARCHIVO, script_sql, (err) => {
                if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
                } else {
                console.log(`Archivo escrito correctamente: unificar_productos.sql`)
                }
            })

            for (let i=0; i < products_.length; i++){
                prods_diccio[products_[i].id] = products_[i]
            }

            console.log('Cantidad total de registros ', unificaciones.length)

            //Se divide el trabajo en workers
            let registros_workers = []
            for (let j=0; j < unificaciones.length; j ++){
                const mod_ = j % CANT_HILOS
                if (!registros_workers[mod_])
                    registros_workers[mod_] = []

                registros_workers[mod_].push(unificaciones[j])
            }

            let workers = []
            for (let i=0; i < registros_workers.length; i++){
                console.log('Iniciando worker ', registros_workers[i].length)
                workers[i] = new Worker('./unificar_prods_worker.mjs')
                
                workers[i].on('message', (msg) => {
                    console.log(`Mensaje recibido del hilo de trabajador: ${msg}`);
                })

                workers[i].postMessage( { "regs": registros_workers[i], "products_": products_, "prods_diccio": prods_diccio } )
            }
              
        }
        
    });

}, 100)