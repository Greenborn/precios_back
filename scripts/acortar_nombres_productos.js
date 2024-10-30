require("dotenv").config({ path: '../.env' })
const fs = require('fs');

const NOMBRE_ARCHIVO = "updates_prod_acorta_nombre.sql"

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
    let productos       = await knex('products')
    let diccio_productos = {}
    
    if (productos){
        for (let i=0; i < productos.length; i++)
            diccio_productos[productos[i].name] = productos[i]
        
        let sql = ""

        for (let i=0; i < productos.length; i++){
            const NOMBRE_ = productos[i].name
            let split_ = NOMBRE_.split(" - ")
            if (NOMBRE_.length > 500){
                console.log(split_[0])
                if (diccio_productos[split_[0]]){
                    sql += 'delete from products where id = "'+productos[i].id+'";\n'
                    sql += 'update price set product_id = "'+diccio_productos[split_[0]].id+'" where product_id = "'+productos[i].id+'";\n'
                } else {
                    sql += 'update products set name = "'+split_[0]+'", description = "'+split_[1]+'" where id = "'+productos[i].id+'";\n'
                    sql += 'update alias_productos set alias = "'+split_[0]+'" where alias = "'+NOMBRE_+'";\n'
                }
                
            }
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
