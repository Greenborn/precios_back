require("dotenv").config({ path: '../.env' })
const fs = require('fs');
const { Worker } = require('worker_threads');
const uuid = require("uuid")

const CANT_HILOS = 4
const NOMBRE_ARCHIVO = "importacion_prod.sql"

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

function buscar_similares(products_, nombre){
    let res = []
    for (let i=0; i < products_.length; i++){
        if (products_[i].name.toLowerCase().includes(nombre.toLowerCase())){
            res.push(products_[i])
            products_.splice(i, 1)
        }
    }
    return res
}

function limpiarTexto(texto) {
    texto = texto.replace(/[;{}()\*/\\`'"]/g, '');
    texto = texto.replace(/[\r\n]/g, '');
    texto = texto.replace(/\s+/g, ' ');
    texto = texto.toLowerCase();
    return texto;
}

setTimeout(async () => { 
    let productos       = await knex('products')
    let categorias      = await knex('product_category')
    //let alias_productos = await knex('alias_productos')
    let precios         = await knex('price')

    let diccio_precios = {}
    let diccio_cat_prod = {}

    let _alias = []
    let _prods = []
    let _precios = []
    let _prod_cat = []
    let _ignorados = []

    let sql = ''
    sql += "DELETE FROM alias_productos WHERE 1; \n"
    sql += "DELETE FROM product_category WHERE 1; \n"
    sql += "DELETE FROM products WHERE 1; \n"
    sql += "DELETE FROM price WHERE 1; \n"

    if (productos && categorias /*&& alias_productos*/ && precios){
        console.log('Se han encontrado ', productos.length, ' productos')
        console.log('Se han encontrado ', categorias.length, ' categorias asociadas a productos')
        //console.log('Se han encontrado ', alias_productos.length, ' alias de productos')
        console.log('Se han encontrado ', precios.length, ' precios de productos')

        for (let i=0; i < precios.length; i++){
            let product_id = precios[i].product_id
            if (!diccio_precios[product_id])
                diccio_precios[product_id] = []
            
            diccio_precios[product_id].push(precios[i])
        }
        console.log("diccionario de precios creado ", Object.keys(diccio_precios).length)

        for (let i = 0; i < categorias.length; i++){
            if (!diccio_cat_prod[categorias[i].product_id])
                diccio_cat_prod[categorias[i].product_id] = []

            diccio_cat_prod[categorias[i].product_id].push(categorias[i])
        }
        console.log("diccionario de categorias creado")

        console.log("recorriendo listado de productos")
        for (let i=0; i < productos.length; i++){ //productos.length
            let similares = buscar_similares(productos, productos[i].name)
            console.log(i,"-", productos.length," buscado ", limpiarTexto(productos[i].name), " encontrados ", similares.length )
            
            if (similares.length > 0){
                let primero = similares[0]
                primero.name = limpiarTexto(primero.name)
                _prods.push(primero)

                

                let cates = diccio_cat_prod[primero.id]
                if (!cates){
                    _ignorados.push(primero.id)
                    continue
                }
                
                for (let k=0; k < cates.length; k++){
                    _prod_cat.push({
                        "id": uuid.v7(),
                        "product_id": primero.id,
                        "category_id": cates[k].category_id
                    })
                }

                let diccio_a_r = {}

                for (let j=0; j < similares.length; j++) {
                    let similar = similares[j]
                    console.log(similar.id)
                    let nam_l = limpiarTexto(similar.name)
                    if (!diccio_a_r[nam_l]){
                        diccio_a_r[nam_l] = true
                        let alias_n = {
                            "alias": nam_l,
                            "product_id": primero.id
                        }
                        _alias.push(alias_n)
                    }
                    
                    for (let k=0; k < diccio_precios[similar.id]?.length; k++){
                        let precio = diccio_precios[similar.id][k]
                        let precio_n = {...precio}
                        precio_n.product_id = primero.id
                        _precios.push(precio_n)
                    }

                }

                console.log("productos actuales ",_prods.length)
                console.log("alias actuales ",_alias.length)
                console.log("ignorados actuales ",_ignorados.length)
                console.log("prod cat actuales ",_prod_cat.length)
                console.log("precios actuales ",_precios.length)
            }
        }

        console.log("generando script importación ")

        for (let i=0; i < _alias.length; i++){ 
            sql += `INSERT INTO alias_productos (product_id, alias) VALUES('${_alias[i].product_id}', 
            '${limpiarTexto(_alias[i].alias)}'); \n`
        }
        console.log("insers alias echo")

        for (let i=0; i < _prod_cat.length; i++){
            sql += `INSERT INTO product_category (id, product_id, category_id) VALUES('${_prod_cat[i].id}', '${_prod_cat[i].product_id}', '${_prod_cat[i].category_id}'); \n`
        }
        console.log("insers prod cat echo")

        for (let i=0; i < _precios.length; i++){
            sql += `INSERT INTO price (id, product_id, price, date_time, branch_id, es_oferta, 
             confiabilidad, url, notas,  	time  ) 
            VALUES('${_precios[i].id}', '${_precios[i].product_id}', '${Number(_precios[i].price)}', '${new Date(_precios[i].date_time).toISOString().replace(".000Z", "")}'
            , '${_precios[i].branch_id}', '${_precios[i].es_oferta}', 100, '${_precios[i].url}', '${String(_precios[i].notas ? _precios[i].notas : '' ).replace("'", " ")}', '${new Date(_precios[i].time).toISOString().replace(".000Z", "")}'); \n`
        }       
        console.log("insers precios echo")

        for (let i=0; i < _prods.length; i++){
            sql += `INSERT INTO products (id, name, vendor_id, barcode) 
            VALUES('${_prods[i].id}', '${limpiarTexto(_prods[i].name)}', 
            '${_prods[i].vendor_id}', '${_prods[i].barcode}'); \n`
        }
        console.log("insers prods echo")

        fs.writeFileSync(NOMBRE_ARCHIVO, sql, (err) => {
            if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
            } else {
                console.log(`Archivo escrito correctamente:`, NOMBRE_ARCHIVO)
                
            }
        })

        fs.writeFileSync("ignorados.json", JSON.stringify(_ignorados), (err) => {
            if (err) {
                console.error(`Error al escribir el archivo: ${err.message}`)
            } else {
                console.log(`Archivo escrito correctamente`)
                
            }
        })
    }
}, 1000)
