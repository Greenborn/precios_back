require("dotenv").config({ path: '../.env' })
const fs = require('fs');
const uuid = require("uuid")
const utils = require("./utils")

const NOMBRE_ARCHIVO = "set_product_name_price_today.sql"


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

setTimeout(async () => { 
    let productos   = await knex('products')
    let prices      = await knex('price_today')
    let diccio_prods = {}

    let sql = ""

    if (productos && prices){

        for (let i=0; i < productos.length; i++)
            diccio_prods[ productos[i].id ] = productos[i]
         
        for (let i = 0; i < prices.length; i++){
            let name = diccio_prods[ productos[i].id ].name.replaceAll("'", " ")
            sql += "update price_today set product_name = '"+name+"' where product_id = '"+prices[i].product_id+"';\n"
            console.log(productos[i].id)
        }  

        fs.writeFileSync(NOMBRE_ARCHIVO, sql, (err) => {
            if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
            } else {
                console.log(`Archivo escrito correctamente:`, NOMBRE_ARCHIVO)
                
            }
        })
    }
}, 1000)