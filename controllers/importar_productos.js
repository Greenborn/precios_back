require("dotenv").config({ path: '../.env' })
const uuid = require("uuid")
const utils = require("../helpers/utils")

let precios_reafirmados = []
let precios_actualizados = []
let nuevos_precios_creados = []

async function nuevo_reg_precio( trx, articulo, producto_db, fecha_registro ){

    const insert = {
        "id": uuid.v7(),
        "product_id": producto_db.id,
        "price": articulo.price,
        "date_time": new Date(fecha_registro),
        "branch_id": articulo.branch_id,
        "es_oferta": 0,
        "confiabilidad": 100,
        "notas": (articulo?.nota) ? articulo.nota : null,
        "url": ( articulo.url ) ? articulo.url : null,
        "time": new Date(),
    }
    let insert_1 = await trx('price').insert( insert )
    precio_hoy = {...insert}
    precio_hoy['id'] = uuid.v7()
    let insert_2 = await trx('price_today').insert( precio_hoy )
    if (insert_1 && insert_2){
        nuevos_precios_creados.push( insert )
        return insert
    } else {
        return false
    }
}


exports.procesar_articulo = procesar_articulo

async function get_categoria( trx, articulo ){
    return new Promise( async (resolve, reject) => {
        const NOMBRE_CAT = articulo.category_name
        let categoria = (global.diccio_name_category[NOMBRE_CAT])  
                            ? global.diccio_name_category[NOMBRE_CAT]
                            : await global.knex('category').select().where('name', NOMBRE_CAT).first()
        if (categoria){
            resolve(categoria)
            return
        } else {
            const ID_NUEVA_CAT = uuid.v7()
            const insert = { 'id': ID_NUEVA_CAT, 'name': NOMBRE_CAT }
            categoria = await trx('category').insert( insert )
            resolve(insert)
            return
        }
    })
}


async function get_producto( trx, articulo ){
    return new Promise( async (resolve, reject) => {
        try {
            const NAME = articulo.name
            //console.log('products_diccio', global.products_diccio[name] )
            let producto  = (global.products_diccio[NAME]) 
                            ? global.products_diccio[NAME]
                            : await global.knex('alias_productos').select()
                                .join('products', 'products.id', 'alias_productos.product_id')
                                .where('alias_productos.alias', NAME).first()
            if (producto){
                let upd = {}
                let ac = false
                if (articulo?.barcode){
                    upd['barcode'] =  articulo.barcode 
                    ac = true
                }
                if (articulo?.description){
                    upd['description'] =  articulo.description
                    ac = true
                }
                if (ac)
                    await trx('products').update( upd ).where('id','=',producto.id)

                resolve(producto)
                return
            } else {
                
                const ID_NUEVO_PROD = uuid.v7()
                let insert = {
                    "id": ID_NUEVO_PROD,
                    "name": NAME,
                    "vendor_id": articulo.vendor_id,
                }
                await trx('alias_productos').insert( { "alias": NAME, "product_id": ID_NUEVO_PROD } ) 
                if (articulo?.barcode) insert['barcode'] = articulo.barcode
                await trx('products').insert( insert ) 
                
                resolve(insert)
                return
            }
        } catch (error) {
            console.log(error, 'no se pudo obtener / crear el producto')
            resolve(null)
            return
        }
        
    })
}

async function procesa_precio( trx, producto_db, articulo, fecha_registro ){
    return new Promise( async (resolve, reject) => {
        
        let HOY = new Date()
        HOY.setHours(0,0,0,1)

        let ultimo_precio = await global.knex('price').select().where('product_id', producto_db.id).orderBy('time', 'desc').first()
        if (ultimo_precio){
            if (Math.abs(ultimo_precio.price - articulo?.price) > 1){
                let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
                if (nuevo_precio){
                    await procesar_variacion(trx, [ ultimo_precio, articulo ], fecha_registro)
                    precios_actualizados.push( [ ultimo_precio, articulo ] )
                    return resolve(true)
                } else 
                    return resolve(false)
            } else if (ultimo_precio && Math.abs(ultimo_precio.price - articulo?.price) <= 1){
                await trx('price').update( {
                    "date_time": new Date(fecha_registro), "time": new Date(), "url": ( articulo.url ) ? articulo.url : null
                } ).where("id", ultimo_precio.id)
                
                let precio_hoy = {
                    ...ultimo_precio,
                    "date_time": new Date(fecha_registro), "time": new Date(), "url": ( articulo.url ) ? articulo.url : null
                }
                precio_hoy['id'] = uuid.v4()
                await trx('price_today').insert( precio_hoy )
                precios_reafirmados.push(ultimo_precio)
                return resolve(true)
            } else  if (!ultimo_precio) {
                let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
                if (nuevo_precio){
                    return resolve(true)
                } else 
                    return resolve(false)
            } else 
                return resolve(false)
        } else {
            let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
            if (nuevo_precio){
                return resolve(true)
            } else 
                return resolve(false)
        }

    })
}

async function procesar_articulo(articulo, fecha_registro ){
    return new Promise( async (resolve, reject) => {
        if (!articulo?.category_name){
            return resolve({stat:false, text: 'No se especifica categoria!'})
        }

        let trx = await global.knex.transaction()

        try {
            let res = { stat: true, text: '' }
            let proms_arr = []

            articulo.name          = utils.limpiarTexto(articulo.name)
            articulo.category_name = utils.limpiarTexto(articulo.category_name)

            if (articulo.name.length > 500)
                articulo.name = articulo.name.substring(0, 500)

            let producto  = await get_producto( trx, articulo )
            let categoria = await get_categoria( trx, articulo )

            if (producto === null){
                trx.rollback()
                res.stat = false
                resolve(res)
                return
            }
            
            //Si no hay relacion entre producto y categoria se la crea
            if (producto && categoria){
                let hay_cat = await global.knex('product_category').select()
                    .where({ "product_id": producto.id, "category_id": categoria.id }).first()
                if (!hay_cat)
                    proms_arr.push(
                        trx('product_category').insert( {
                            "id": uuid.v7(),
                            "product_id":  producto.id,
                            "category_id": categoria.id
                        } ))

                proms_arr.push( 
                    procesa_precio( trx, producto, articulo, fecha_registro )
                )

                let res_proms = await Promise.all( proms_arr )
                if (res_proms){
                    await trx.commit()
                    console.log(res_proms)
                    resolve(res)
                    return
                } else {
                    trx.rollback()
                    res.stat = false
                    resolve(res)
                    return
                }
            } else {
                trx.rollback()
                return resolve({ stat: false, text: "no hay producto y/o categoria"})
            }
        } catch (error) {
            trx.rollback()
            console.log(error)
            return resolve({ stat: false, text: ''})
        }
             
    })
}

async function procesar_variacion( trx, variacion, fecha_registro){
    
    const reg_anterior = variacion[0]
    const reg_nuevo    = variacion[1] 
    console.log(157, variacion)
    const porcentage = (reg_nuevo.price - reg_anterior.price) / ( reg_anterior.price / 100 )
    if (porcentage > 50 || porcentage < -50){
        console.log(variacion)
    }
    if (reg_anterior.price != reg_nuevo.price && reg_nuevo.branch_id == reg_anterior.branch_id 
        && reg_anterior.price != 0 && reg_nuevo.price != 0){
        await trx("estadistica_aumento_diario").insert(
            {
                "id_producto":        reg_anterior.product_id,
                "branch_id":          reg_anterior.branch_id,
                "porcentaje_aumento": porcentage,
                "precio_ayer":        reg_anterior.price,
                "precio_hoy":         reg_nuevo.price,
                "nombre_producto":    reg_nuevo.name,
                "nombre_comercio":     global.enterprice_diccio[ global.branchs_diccio[reg_nuevo.branch_id].enterprise_id ].name,
                "fecha_utlimo_precio": fecha_registro
            })
    }
    return
}
exports.procesar_variacion = procesar_variacion
