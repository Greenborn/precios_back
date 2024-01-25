require("dotenv").config({ path: '../.env' })
const fs = require('fs')

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
    pool: { min: 0, max: 7 }
})

const HOY = new Date()
const rutaPrecios = './tmp/productos'+HOY.getFullYear()+Number((HOY.getMonth()+1)).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 0
  })+Number(HOY.getDate()).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 0
  })+".json"

let cant_recategoriza = 0

async function procesar_articulo(trx, articulo ){
    try {
        
        let producto = await knex('products').select().where('name', articulo.name).first()
        if (producto){
            console.log(articulo, producto)
            await trx('product_category').delete().where( {
                'product_id': producto.id
            })
            await trx('product_category').insert({
                'product_id': producto.id,
                'category_id': articulo.category
            })
            cant_recategoriza ++
            console.log("recategorizado", articulo.name, " - ", articulo.category)
            return true
        } else {
            return false
        }

    } catch( error ){
        console.log(error)
        return false
    }
}


setTimeout( async ()=>{

    const archivo_importacion = await fs.promises.readFile(rutaPrecios, 'utf8')
    const array_importacion   = JSON.parse(archivo_importacion)

    if (array_importacion){
        const proms_procesar = []
        let trx = await knex.transaction()
        for (let i=0; i < array_importacion.length; i++){
            const articulo = array_importacion[i]
            proms_procesar.push(procesar_articulo(trx, articulo))
        }
        
        let procesada = await Promise.all(proms_procesar)
        if (procesada){
            
            await trx.commit()
            console.log("cant recatogoriza:",cant_recategoriza)
        }
    }
}, 100)

