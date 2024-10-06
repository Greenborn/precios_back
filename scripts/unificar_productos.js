require("dotenv").config({ path: '../.env' })
const fs = require('fs');
const uuid = require("uuid")

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

async function procesa_unificacion( ALIAS_PRODS ){
    let arr_id_prods = []
    let arr_alias = []
    //Se obtiene todos los ids de productos del alias
    let products_consult = knex("alias_productos")
                    .select()
    
    for (let index = 0; index < ALIAS_PRODS.length; index++) {
        products_consult = products_consult.orWhere('alias', ALIAS_PRODS[index])
    }

    products_consult = await products_consult
    if (products_consult){
        console.log('Cant. prods encontrados: ', products_consult.length)
        if (products_consult.length == 1){
            console.log("saliendo se encontro un solo producto ")
            return
        }
        for (let i=0; i < products_consult.length; i++){
            arr_id_prods.push( products_consult[i].product_id )
            arr_alias.push( products_consult[i].alias )
        }

        const ID_PRINCIPAL = arr_id_prods[0]
        console.log(ALIAS_PRODS, ALIAS_PRODS.length, arr_id_prods, arr_id_prods.length, ID_PRINCIPAL)
        if (!ID_PRINCIPAL){
            console.log("No se encuentran registros 0, saliendo...")
            return
        }

        let product = await knex("products").where("id", ID_PRINCIPAL).first()
        if (!product){
            console.log("No se encuentra el producto 1, saliendo...")
            return
        } else {
            console.log(product)
            let proms = []
            let trx = await knex.transaction()

            console.log(" \n Se actualizan registros de alias referenciandolos solo al primer producto")
            for (let i=0; i < arr_alias.length; i++){
                proms.push( 
                    trx('alias_productos').update( { "product_id": ID_PRINCIPAL } ).where('alias', arr_alias[i]) 
                )
                console.log("al prod ", ID_PRINCIPAL, "Se asigna alias ",  arr_alias[i])
            }
            
            console.log(" \n Se actualizan los registros de precios")
            for (let i=0; i < arr_id_prods.length; i++){
                proms.push( 
                    trx('price').update( { "product_id": ID_PRINCIPAL } ).where('product_id', arr_id_prods[i]) 
                )
                console.log("precios de  ", arr_id_prods[i], " Se asigna a producto ",  ID_PRINCIPAL)
            }

            console.log(" \n Se quitan referencias de producto categoria")
            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                proms.push( 
                    trx('product_category').delete().where('product_id', arr_id_prods[i]) 
                )
                console.log("Se quita relacion producto categoria  ", arr_id_prods[i])
            }

            console.log(" \n Se eliminan registros de productos")
            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                proms.push( 
                    trx('products').delete().where('id', arr_id_prods[i]) 
                )
                console.log("Se quita producto  ", arr_id_prods[i])
            }
            
            let proms_res =  await Promise.all( proms )
            if (proms_res){
                await trx.commit()
                console.log(proms_res)
                return true
            }
        }
        
    } else 
        return false
}

let unificaciones = []
let cant_total = 0
setTimeout( async ()=>{
    fs.readFile('productos_unificar.json', async function(err, data) {
        unificaciones = JSON.parse(data);
        cant_total = unificaciones.length
    });
    let c = 0
    setInterval( async ()=>{  
        let reg = unificaciones.pop()
        console.log("Procesando ", reg, c, ' de ', cant_total)
        c++
        await procesa_unificacion( reg )
    }, 50)
}, 100)

