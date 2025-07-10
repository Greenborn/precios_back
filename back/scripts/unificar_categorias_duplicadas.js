require("dotenv").config({ path: '../.env' })
const fs = require('fs');
const uuid = require("uuid")
const utils = require("./utils")

const NOMBRE_ARCHIVO = "unifica_categorias.sql"


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
    let categorias_prod = await knex('product_category')
    let categorias      = await knex('category')

    let diccio_category = {}
    let diccio_cat_id   = {}
    let diccio_cat_name = {}
    let arr_cat_name    = []
   
    let sql = ''
    sql += "DELETE FROM category WHERE 1; \n"
    sql += "DELETE FROM product_category WHERE 1; \n"
    //sql += "DELETE FROM products WHERE 1; \n"
    //sql += "DELETE FROM price WHERE 1; \n"

    if (productos && categorias_prod && categorias){

        for (let i=0; i < categorias.length; i++){
            const NAME = utils.limpiarTexto(categorias[i].name)
            diccio_cat_id[ categorias[i].id ] = categorias[i]
            
            if (!diccio_cat_name[ NAME ])
                arr_cat_name.push(NAME)
            diccio_cat_name[ NAME ] = categorias[i]
            diccio_category[ NAME ] = []
        }

        for (let i=0; i < categorias_prod.length; i++){
            const CAT_NAME = utils.limpiarTexto(diccio_cat_id[categorias_prod[i].category_id].name)
            const PROD_ID  = categorias_prod[i].product_id

            diccio_category[ CAT_NAME ].push(PROD_ID)
        }

         
        for (let i = 0; i < arr_cat_name.length; i++){
            const NAME      = arr_cat_name[i]
            const PRODS_CAT = diccio_category[ NAME ]
            const CATEGORY  = diccio_cat_name[ NAME ]

            //insert category
            sql += `INSERT INTO category (id, root_category_id, name) VALUES('${CATEGORY.id}', '${null}', '${NAME}'); \n`

            //insert product_category
            for (let j = 0; j < PRODS_CAT.length; j++)
                sql += `INSERT INTO product_category (id, product_id, category_id) VALUES('${uuid.v7()}' , '${PRODS_CAT[j]}', '${CATEGORY.id}'); \n`
            
            console.log(NAME, PRODS_CAT, CATEGORY)
        }

        fs.writeFileSync(NOMBRE_ARCHIVO, sql, (err) => {
            if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
            } else {
                console.log(`Archivo escrito correctamente:`, NOMBRE_ARCHIVO)
                
            }
        })
        console.log("categorias nuevas: ",arr_cat_name.length, "categorias actual: ", categorias.length)
    }
}, 1000)