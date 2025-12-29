const express = require('express')
require("dotenv").config({ path: '../.env' })
var router = express.Router()
module.exports = router
const bcrypt = require('bcrypt')
const fs = require("fs")
const cargador_precios = require("../controllers/importar_productos")
const processing = require("../helpers/processing")
const { exec } = require('child_process')

router.get('/all', async function (req, res) {
    console.log("query ", req.query)
    
    try {
        salida = global.products_category_diccio.by_category_id[req?.query?.category_id]
        res.status(200).send({ stat: true, items: salida, error: true })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false, items: [], error: true })
    }    
})


let diccio_limit = {}

router.put('/cargar_nuevo_precio', async function (req, res) {
    //console.log("data ", req.body)
    
    try {
        const AHORA = new Date()
        const PROD_ID = req.body?.product_id
        const BRANCH_ID = req.body?.branch_id
        const PRICE = req.body?.price
        if (!PROD_ID || !BRANCH_ID || !PRICE){
            res.status(200).send({ stat: false, error: "Error interno, reintente luego" })
            return
        }

        let IP = req.header('x-forwarded-for')
        if (IP == undefined)
            IP = 'NO_IP'
        const PB = PROD_ID+'_'+BRANCH_ID
        if (diccio_limit[IP] === undefined){
            diccio_limit[IP] = { cantidad: 1 }
        } else {
            if (Number(AHORA.getTime()) - diccio_limit[IP]['ultimo_intento'] < 3000){
                res.status(200).send({ stat: false,  error: "Pasó muy poco tiempo del último ingreso!" })
                return
            }
        }
        diccio_limit[IP]['ultimo_intento'] = Number(new Date().getTime())
        diccio_limit[IP]['cantidad'] += 1
        if (diccio_limit[IP]['cantidad'] > 100){
            res.status(200).send({ stat: false,  error: "Superó la cantidad máxima de ingresos, reintente mañana" })
            return
        }

        if (diccio_limit[IP][PB] === undefined){
            diccio_limit[IP][PB] = 1
        } else {
            console.log("cuota excedida")
            res.status(200).send({ stat: false,  error: "Solo se permite el ingreso de un precio corregido por cada Producto y Negocio" })
            return
        }
        console.log(diccio_limit)

        const HOY = new Date()

        const insert = {
            "product_id": PROD_ID,
            "price": PRICE,
            "date_time": new Date(),
            "branch_id": BRANCH_ID,
            "es_oferta": 0,
            "confiabilidad": 50,
            "url": null,
            "notas": "Precios de la Gente - ingresado por formulario de corrección de precio"
        }
        
        res.status(200).send({ stat: await global.knex('price').insert( insert ) })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }    
})

async function procesa_item( item, HOY){
    return new Promise(async (resolve, reject) => {
        // (Limpieza de estadistica_aumento_diario eliminada, ahora se hace al inicio del lote)
        let res_procesa = await cargador_precios.procesar_articulo( item, HOY )
        if (res_procesa.stat){
            let cant_reg = await global.knex("price").count("id").first()
            await global.knex("incremental_stats").update({ "value": cant_reg['count(`id`)'] }).where("key", "cant_price")
            let cant_reg2 = await global.knex("price_today").count("id").first()
            await global.knex("incremental_stats").update({ "value": cant_reg2['count(`id`)'] }).where("key", "precios_hoy")
            resolve({ stat: true })
            return
        } else {
            console.log(res_procesa)
            resolve({ stat: false, error: res_procesa?.text ? res_procesa.text :"Error interno, reintente luego" })
            return
        }
    })
}

const colaProcProductos = []
const idCola = "productos"

setInterval(async () => {
    // Limpiar la tabla estadistica_aumento_diario para dejar solo los registros del día actual (GMT-3)
    let HOY_ARG = new Date();
    // Ajustar a zona horaria Argentina (GMT-3): obtener timestamp UTC y restar 3 horas
    HOY_ARG = new Date(HOY_ARG.getTime() - (3 * 60 * 60 * 1000));
    HOY_ARG.setHours(0, 0, 0, 0);
    await global.knex("estadistica_aumento_diario").where('fecha_utlimo_precio', '<', HOY_ARG).del();
    
    await processing.procesarColaProc(idCola, colaProcProductos, async (item) => {
        let HOY = new Date()
        HOY.setHours(0,0,0,1)
        // HOY aquí es UTC, para inserts y updates usar new Date() directamente
        return await procesa_item(item, HOY)
    }, async () => {
        // Limpiar la tabla antes de actualizar la serie compilada (usando inicio de día Argentina GMT-3)
        /*let HOY_ARG = new Date();
        HOY_ARG = new Date(HOY_ARG.getTime() - (3 * 60 * 60 * 1000));
        HOY_ARG.setHours(0, 0, 0, 0);
        await global.knex("estadistica_aumento_diario").where('fecha_utlimo_precio', '<', HOY_ARG).del();
        console.log("Cola de productos vacía, actualizando serie_compilada_media_interdiaria...");
        exec('node scripts/resetear_serie_compilada_media_interdiaria.js price_today --no-truncate', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error al actualizar serie compilada: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });*/
    });
}, 2000);

const TABLAS = {
    "ml": {
        "articulos": "articulos_mercado_libre",
        "precios": "precios_articulos_mercado_libre"
    },
    "region20": {
        "articulos": "articulos_region_20",
        "precios": "precios_articulos_region_20"
    }
}

async function procesa_art_plataforma(DATA){
    let HOY = new Date()
    HOY.setHours(0,0,0,1)
    // HOY aquí es UTC, para inserts y updates usar new Date() directamente
    
    let existe = await global.knex(TABLAS[DATA.plataforma].articulos).select()
                    .where('url', DATA.url).first()

    if (existe){
        await global.knex(TABLAS[DATA.plataforma].articulos).update({
            nombre: DATA.name,
            precio: DATA?.currency === 'pesos' ? DATA.price : null,
            precio_dolares: DATA?.currency === 'dolares' ? DATA.price : null,
            categoria: DATA.category_name,
            fecha_actualizacion: new Date()
        }).where('url', DATA.url)

        let ultimo_precio = await global.knex(TABLAS[DATA.plataforma].precios).select()
                                .where('id_articulo', existe.id)
                                .orderBy('id', 'desc').first()
        if (!ultimo_precio){
            await global.knex(TABLAS[DATA.plataforma].precios).insert({
                id_articulo: existe.id,
                precio: DATA?.currency === 'pesos' ? DATA.price : null,
                precio_dolares: DATA?.currency === 'dolares' ? DATA.price : null,
                fecha: new Date()
            })
            console.log("precio registrado")
        } else {
            if ((ultimo_precio.precio != DATA.price && ultimo_precio.precio !== null )
                || (ultimo_precio.precio_dolares != DATA.price && ultimo_precio.precio_dolares !== null)){
                await global.knex(TABLAS[DATA.plataforma].precios).insert({
                    id_articulo: existe.id,
                    precio: DATA?.currency === 'pesos' ? DATA.price : null,
                    precio_dolares: DATA?.currency === 'dolares' ? DATA.price : null,
                    fecha: new Date()
                })
                console.log("precio actualizado")
            }
        }
    } else {
        await global.knex(TABLAS[DATA.plataforma].articulos).insert({
            nombre: DATA.name,
            precio: DATA?.currency === 'pesos' ? DATA.price : null,
            precio_dolares: DATA?.currency === 'dolares' ? DATA.price : null,
            categoria: DATA.category_name,
            fecha_actualizacion: new Date(),
            fecha_creacion: new Date(),
            url: DATA.url
        }).where('url', DATA.url)
        .then(async function (id_nuevo) {
            console.log('id_nuevo',id_nuevo)
            await global.knex(TABLAS[DATA.plataforma].precios).insert({
                id_articulo: id_nuevo,
                precio: DATA?.currency === 'pesos' ? DATA.price : null,
                precio_dolares: DATA?.currency === 'dolares' ? DATA.price : null,
                fecha: new Date()
            })
        })
        
    }
    return
}

router.post('/importar_articulo_plataforma', async function (req, res) {
    //console.log("data ", req.body)
    const KEY = req.body?.key
    const DATA = req.body
    try {
        /*const KEY_VALID = process.env.KEY_INT
        if (KEY != KEY_VALID){
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego_" })
            return
        }*/
        
        let proms_arr = []
        for (let i=0; i < DATA.length; i++)
            proms_arr.push(procesa_art_plataforma(DATA[i]))
        
        let res_procesa = await Promise.all(proms_arr)
        if (res_procesa)
            console.log("res_procesa", res_procesa)
        
        res.status(200).send({ stat: true })
        return
        
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }    
})

const MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

async function procesar_oferta(trx, item, HOY, AYER){
    return new Promise(async (resolve, reject) => {
        try{
            if (!item?.titulo)
                return resolve({ stat: false,  error: "Revisar titulo ", 'item':JSON.stringify(item) })
            
            let existe = await global.knex("promociones_hoy").where("titulo", item.titulo).first()
            if (existe)
                return resolve({ stat: false,  error: "Ya existe oferta con ese título ", 'item':JSON.stringify(item) })
            else {
                let proms_arr = []
                // Usar fecha_registro si viene, sino fecha actual
                let fecha = item.fecha_registro || new Date();
                const insert_ = {
                    'orden': 0,
                    'fecha': fecha,
                    'titulo': item.titulo,
                    'id_producto': -1,
                    'precio': item.precio,
                    'datos_extra': item?.datos_extra ? item?.datos_extra : '{ }',
                    'branch_id': item.branch_id,
                    'url': item.url
                }
                proms_arr.push( trx('promociones_hoy').delete().where('fecha' , '<', AYER) )
                proms_arr.push( trx('promociones_hoy').insert( insert_ ) )
                proms_arr.push( trx('promociones').insert( insert_ ) )

                let proms_res = await Promise.all(proms_arr)
                if (proms_res){
                    let cant_reg = await global.knex("promociones_hoy").count("id").first()
                    await global.knex("incremental_stats").update({ "value": cant_reg['count(`id`)'] }).where("key", "cant_promos")
                    resolve({ stat: true, nuevo: 1 })
                    return
                } else{
                    console.log(proms_res)
                    resolve({ stat: false,  error: "Error interno, reintente luego" })
                    return
                }
            }   
            
        } catch (e){
            console.log('procesar_oferta', e)
            return resolve({ stat: false,  error: "Error interno, reintente luego" })
        }
        
    })
}

let colaProcOfertas = []

// Worker que se encarga de procesar los items de la cola
setInterval(async()=>{
    // Limpiar la tabla promociones_hoy para dejar solo los registros del día actual
    let HOY = new Date()
    HOY.setHours(0,0,0,0)
    await global.knex("promociones_hoy").where('fecha', '<', HOY).del()
    await processing.procesarColaProc("ofertas", colaProcOfertas, async (item) => {
        let HOY = new Date()
        HOY.setHours(0,0,0,1)

        let AYER = new Date()
        AYER.setDate(AYER.getDate() - 1)
        AYER.setHours(23,59,59)
        return await procesar_oferta(global.knex, item, HOY, AYER)
    })
}, 2000)

router.post('/importar_oferta', async function (req, res) {
    //console.log("data ", req.body)
    const KEY = req.body?.key
    try {
        const KEY_VALID = process.env.KEY_INT
        const ARR_IMPORTA = req.body?.lst_importa

        if (KEY != KEY_VALID){
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego_" })
            return
        }

        for (let index = 0; index < ARR_IMPORTA.length; index++) {
            const item = ARR_IMPORTA[index]
            colaProcOfertas.push( item )
        }
        
        return res.status(200).send({ stat: true })
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }
})

router.post('/importar_alquiler', async function (req, res) {
    console.log("data ", req.body)
    const KEY = req.body?.key
    try {
        const KEY_VALID = process.env.KEY_INT
        if (KEY != KEY_VALID){
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
            return
        }
        let es_nuevo = 0
        let suma_valores_props = ""
        let keys_ = Object.keys(req.body?.especificaciones)
        for (let i=0; i < keys_.length; i++)
            suma_valores_props += String(req.body?.especificaciones[keys_[i]]) + "|"
        
        //El hash se usa para diferenciar las propiedades unas de otras
        let suma_campos = (req.body?.titulo + req.body?.locador + suma_valores_props).replace(/\W/g, '')
        let hash = MD5( suma_campos )

        if (hash !== req.body?.hash){
            console.log("No coinciden los hash!")
            res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
            return
        }
        let HOY = new Date()
        //HOY.setHours(0,0,0,1)

        let trx = await knex.transaction()
        let existe_ = await knex('propiedades_alquiler').select().where('hash', hash).first()
        if (!existe_){
            es_nuevo = 1
            const insert = {
                "titulo": req.body.titulo,
                "locador": req.body.locador,
                "url": req.body.url,
                "precio": req.body.precio,
                "moneda": req.body.moneda,
                "especificaciones": req.body.especificaciones,
                "hash": hash,
                "ultima_fecha": HOY
            }
            
            let res_nueva = await trx('propiedades_alquiler').insert( insert )
            if (res_nueva){
                console.log(res_nueva)
                await trx('historico_precios_alquiler').insert( {
                    'id_propiedad': res_nueva[0],
                    'precio': req.body.precio,
                    'fecha': HOY
                } )
            }
        } else {
            console.log("existe")

            let reg_historico_precio = await knex('historico_precios_alquiler').select()
                .where({'id_propiedad': existe_.id, 'precio': req.body.precio }).first()
            if (!reg_historico_precio){
                es_nuevo = 2
                await trx('historico_precios_alquiler').insert( {
                    'id_propiedad': existe_.id,
                    'precio': req.body.precio,
                    'fecha': HOY
                } )
            }

            await trx('propiedades_alquiler').update( {
                "precio": req.body.precio,
                "moneda": req.body.moneda,
                "ultima_fecha": HOY
            }).where('id', existe_.id)
        }

        await trx.commit()
        res.status(200).send({ stat: true, nuevo: es_nuevo })
        
    } catch (error) {
        console.log("error", error)
        res.status(200).send({ stat: false,  error: "Error interno, reintente luego" })
    }
})

// Endpoint para importar productos y llenar la cola de procesamiento
// El endpoint /importar ya utiliza la cola y procesamiento correcto, que actualiza price_today.
router.post('/importar', async function (req, res) {
    const KEY = req.body?.key;
    try {
        const KEY_VALID = process.env.KEY_INT;
        const ARR_IMPORTA = req.body?.lst_importa;

        if (KEY != KEY_VALID) {
            res.status(200).send({ stat: false, error: "Error interno, reintente luego_" });
            return;
        }
        if (!Array.isArray(ARR_IMPORTA) || ARR_IMPORTA.length === 0) {
            res.status(200).send({ stat: false, error: "No hay items para importar" });
            return;
        }

        ARR_IMPORTA.forEach((item) => {
            colaProcProductos.push(item);
        });
        console.log(`[importar] Se agregaron ${ARR_IMPORTA.length} items a la cola. Tamaño actual:`, colaProcProductos.length);
        res.status(200).send({ stat: true, count: ARR_IMPORTA.length });
        return;
    } catch (error) {
        console.log("[importar] error", error);
        res.status(200).send({ stat: false, error: "Error interno, reintente luego" });
    }
});