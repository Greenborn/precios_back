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


/*
const rutaPrecios = './tmp/productos'+HOY.getFullYear()+Number((HOY.getMonth()+1)).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 0
  })+Number(HOY.getDate()).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 0
  })+".json"*/

async function agregar_producto_sino_esta(trx, articulo){
    let producto = await knex('products').select().where('name', articulo.name).first()
    if (producto){
        return { 'data':producto, 'nuevo': false }
    } else {
        const insert = {
            "name": articulo.name,
            "vendor_id": articulo.vendor_id
        }
        let nuevo_reg = await trx('products').insert( insert )
        await trx('product_category').insert( {
            "product_id": nuevo_reg[0],
            "category_id": articulo.category
        } )
        return { 'data': {...insert, "id": nuevo_reg[0] }, 'nuevo': true }
    }
}
let precios_reafirmados = []
let precios_actualizados = []
let nuevos_precios_creados = []
let diccio_enterprise = {}
let diccio_branch = {}

async function nuevo_reg_precio( trx, articulo, producto_db, fecha_registro ){

    const insert = {
        "product_id": producto_db.data.id,
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
    let insert_2 = await trx('price_today').insert( insert )
    if (insert_1 && insert_2){
        nuevos_precios_creados.push( insert )
        return insert
    } else {
        return false
    }
}


async function cargar_precio( trx, articulo, producto_db, fecha_registro ){
    //si es nuevo se inserta un nuevo precio
    if (producto_db.nuevo){
        let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
        if (nuevo_precio){
            await trx('news').insert( {
                text: "Se agrega nuevo precio de "+articulo.name+" que sale "+articulo.price
            } )
            return true
        } else 
            return false
    } else { // si no es nuevo se crea un nuevo si el ultimo es diferente
        let ultimo_precio = await knex('price').select()
                .where({'product_id': producto_db.data.id, 'branch_id': articulo.branch_id })
                .orderBy('date_time', 'desc').first()
        
        if (ultimo_precio && Math.abs(ultimo_precio.price - articulo?.price) > 1){
            let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
            if (nuevo_precio){
                await trx('news').insert( {
                    text: "Se actualiza precio de "+articulo.name+" que ahora sale "+articulo.price
                } )
                await procesar_variacion(trx, [ ultimo_precio, articulo ], fecha_registro)
                precios_actualizados.push( [ ultimo_precio, articulo ] )
                return true
            } else 
                return false
        } else if (ultimo_precio && Math.abs(ultimo_precio.price - articulo?.price) <= 1){
            await trx('price').update( {
                "date_time": new Date(fecha_registro), "time": new Date(), "url": ( articulo.url ) ? articulo.url : null
            } ).where("id", ultimo_precio.id)
            const precio_hoy = {
                ...ultimo_precio,
                "date_time": new Date(fecha_registro), "time": new Date(), "url": ( articulo.url ) ? articulo.url : null
            }
            await trx('price_today').insert( precio_hoy )
            precios_reafirmados.push(ultimo_precio)
            return true
        } else  if (!ultimo_precio) {
            let nuevo_precio = await nuevo_reg_precio( trx, articulo, producto_db, fecha_registro )
            if (nuevo_precio){
                await trx('news').insert( {
                    text: "Se agrega nuevo precio de "+articulo.name+" que sale "+articulo.price
                } )
                return true
            } else 
                return false
        } else 
            return false
    }
}

let nuevos_productos = []

async function procesar_articulo(trx, articulo, fecha_registro ){
    try {
        console.log(articulo)
        let producto_db = await agregar_producto_sino_esta(trx, articulo)
        let AYER = new Date()
        AYER.setDate( AYER.getDate() - 1 )
        AYER.setUTCHours(23,59,59)
        await knex('price_today').delete().where('date_time', '<', AYER)
        if (producto_db){
            articulo['product_id'] = producto_db.data.id
            if (producto_db.nuevo)
                nuevos_productos.push( articulo )
            let procesa_precio = await cargar_precio(trx, articulo, producto_db, fecha_registro)
            if (procesa_precio){
                return true
            }
        }

    } catch( error ){
        console.log(error)
        return false
    }
}
exports.procesar_articulo = procesar_articulo

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
                "id_producto": reg_nuevo.product_id,
                "branch_id": reg_nuevo.branch_id,
                "porcentaje_aumento": porcentage,
                "precio_ayer": reg_anterior.price,
                "precio_hoy": reg_nuevo.price,
                "nombre_producto": reg_nuevo.name,
                "nombre_comercio": diccio_enterprise[ diccio_branch[reg_nuevo.branch_id].enterprise_id ].name,
                "fecha_utlimo_precio": fecha_registro
            })
    }
    return
}
exports.procesar_variacion = procesar_variacion

async function generar_estadisticas_variacion_diaria(trx, variaciones){
    let proms = []
    await trx("estadistica_aumento_diario").delete()
    for (let i=0; i < variaciones.length; i++){
        proms.push( procesar_variacion(trx, variaciones[i]) )
    }
    await Promise.all( proms )
}

let diccio = {}

setTimeout( async ()=>{

    //const archivo_importacion = await fs.promises.readFile(rutaPrecios, 'utf8')
    //const array_importacion   = JSON.parse(archivo_importacion)

    let enterprises = await knex("enterprice").select()
    let branchs     = await knex("branch").select()

    if (/*array_importacion && */ enterprises && branchs){
        const proms_procesar = []
        let trx = await knex.transaction()
        /*for (let i=0; i < array_importacion.length; i++){
            const articulo = array_importacion[i]
            const reg_concat = articulo.name+articulo.price+articulo.branch_id
            if (diccio[reg_concat] == undefined){
                diccio[reg_concat] = 1
            } else 
                continue
            
            console.log("procesando", articulo)
            proms_procesar.push(procesar_articulo(trx, articulo))
        }*/
        for (let i =0; i < enterprises.length; i++)
            diccio_enterprise[enterprises[i].id ] = enterprises[i]
        for (let i=0; i < branchs.length; i++)
            diccio_branch[branchs[i].id ] = branchs[i]

        /*let procesada = await Promise.all(proms_procesar)
        if (procesada){
            await trx("news").delete().where("datetime", "<", HOY)
            await trx.commit()
            console.log("Cantidad de productos agregados: ", nuevos_productos.length)
            console.log("Cantidad de precios agregados: ", nuevos_precios_creados.length)
            console.log("Cantidad de precios reafirmados: ", precios_reafirmados.length)
            console.log("Cantidad de precios actualizados: ", precios_actualizados.length)
        }*/
    }
}, 100)

