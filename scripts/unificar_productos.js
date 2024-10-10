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
    pool: { min: 0, max: 1000, "propagateCreateError": false },
    collation: 'utf8mb4_unicode_ci'
})



function procesa_unificacion(/*trx,*/ ALIAS_PRODS, products_, prods_diccio ){
    let arr_id_prods = []
    let arr_alias = []
    //Se obtiene todos los ids de productos del alias
    let products_consult = []
    let diccio_sql_no_rep = {}
    
    let script_sql = ""

    for (let i=0; i < products_.length; i++){
        if (products_[i].name.toLowerCase().includes(ALIAS_PRODS[0].toLowerCase())){
            products_consult.push(products_[i])
            products_.splice(i, 1)
        }
    }

    if (products_consult){
        console.log('Cant. prods encontrados: ', products_consult.length, ' total restante  ', products_.length)
        if (products_consult.length == 1){
            return ''
        }

        for (let i=0; i < products_consult.length; i++){
            arr_id_prods.push( products_consult[i].id )
            arr_alias.push( products_consult[i].name )
        }

        const ID_PRINCIPAL = arr_id_prods[0]
        console.log(ALIAS_PRODS, ALIAS_PRODS.length, arr_id_prods, arr_id_prods.length, ID_PRINCIPAL)
        if (!ID_PRINCIPAL){
            console.log(ID_PRINCIPAL, products_consult)
            return ''
        }

        let product = prods_diccio[ID_PRINCIPAL]
        if (!product){
            return ''
        } else {
            console.log(product)

            console.log(" \n Se actualizan registros de alias referenciandolos solo al primer producto")
            for (let i=0; i < arr_alias.length; i++){
                let aux = "update alias_productos set product_id = '"+ID_PRINCIPAL+"' where alias = '"+arr_alias[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                }
                console.log("al prod ", ID_PRINCIPAL, "Se asigna alias ",  arr_alias[i])
                if (arr_alias[i].includes("'"))
                    return ''
            }
            
            console.log(" \n Se actualizan los registros de precios")
            for (let i=0; i < arr_id_prods.length; i++){
                let aux = "update price set product_id = '"+ID_PRINCIPAL+"' where product_id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                }
                console.log("precios de  ", arr_id_prods[i], " Se asigna a producto ",  ID_PRINCIPAL)
            }

            console.log(" \n Se quitan referencias de producto categoria")
            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                let aux = "delete from product_category where product_id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                }
                console.log("Se quita relacion producto categoria  ", arr_id_prods[i])
            }

            console.log(" \n Se eliminan registros de productos")
            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                let aux = "delete from products where id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                }
                console.log("Se quita producto  ", arr_id_prods[i], " con alias ",  arr_alias[i])
                if (arr_alias[i].includes("'"))
                    return ''
            }
            
           
            return script_sql
            
        }
        
    } else 
        return ''
}

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
            fs.writeFileSync("unificar_productos.sql", script_sql, (err) => {
                if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
                } else {
                console.log(`Archivo escrito correctamente: unificar_productos.sql`)
                }
            })

            for (let i=0; i < products_.length; i++){
                prods_diccio[products_[i].id] = products_[i]
            }

            for (let j=0; j < unificaciones.length; j ++){
                let reg = unificaciones[j]
                //console.log("Procesando ", reg, c, ' de ', cant_total)
                script_sql += procesa_unificacion( reg, products_, prods_diccio ) 
                c++ 

                if (c % 100 == 0){
                    fs.writeFileSync("unificar_productos.sql", script_sql, { flag: 'a' }, (err) => {
                        if (err) {
                            console.error(`Error al escribir el archivo: ${err.message}`)
                        } else {
                            console.log(`Archivo escrito correctamente: unificar_productos.sql`)
                            
                        }
                    })
                    script_sql = ''
                }
            }

            
            
        }
        
    });

}, 100)