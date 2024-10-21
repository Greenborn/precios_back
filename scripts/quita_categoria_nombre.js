require("dotenv").config({ path: '../.env' })

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
    let categorias      = await knex('product_category')
    
    if (productos && categorias){
        for (let i=0; i < productos.length; i++){
            let nuevo_name = productos[i].name.split(" - ").slice(1).join(" - ")
            
            await knex('products').where({id: productos[i].id}).update({name: nuevo_name})
            await knex('alias_productos').where({product_id: productos[i].id}).update({alias: nuevo_name})
            console.log(nuevo_name)
        }
    }
}, 1000)
