require("dotenv").config({ path: '../.env' })
const fs = require('fs');

const NOMBRE_ARCHIVO = "updates_prod_quita_cat.sql"

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
    let categorias      = await knex('category')
    
    if (productos && categorias){
        let diccio_cats = {}
        for (let i=0; i < categorias.length; i++){
            diccio_cats[categorias[i].name.trim().toLowerCase()] = categorias[i]
        }
        //console.log(diccio_cats)
        //return
        let sql = ""

        for (let i=0; i < productos.length; i++){
            let split_ = productos[i].name.split(" - ")
            let text_cat = String(split_[0]).trim().toLowerCase()
            if (!diccio_cats[split_[0]]){
                console.log("no tiene categoria en nombre", "|",text_cat,"|")
                continue
            }

            let nuevo_name = split_.slice(1).join(" - ")
            if (nuevo_name == '') continue
            console.log('nuevo_name',nuevo_name)

            sql += `UPDATE products SET name = '${nuevo_name}' WHERE id = "${productos[i].id}";\n`
            sql += `UPDATE alias_productos SET alias = '${nuevo_name}' WHERE product_id = "${productos[i].id}";\n`           
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
