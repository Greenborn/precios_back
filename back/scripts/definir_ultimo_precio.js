require("dotenv").config({ path: '../.env' })
const { text } = require("express");
const fs = require('fs');
const { resolve } = require("path");
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
    pool: { min: 0, max: 1000, "propagateCreateError": false }
})

let i=0
async function definir_ultimo( producto ){
    let trx = await knex.transaction()
    console.log(i++,' - ','procesando ', producto.name, '  ',producto.id )
    
    // Obtener la fecha de inicio del día actual
    const HOY = new Date();
    HOY.setHours(0,0,0,0);
    
    let precios = await knex.raw(`
        SELECT *
            FROM price
            WHERE product_id = :prod_id
            AND date_time >= :fecha_inicio
            AND date_time = (
            SELECT MAX(date_time)
            FROM price
            WHERE product_id = :prod_id
            AND branch_id = price.branch_id
            AND date_time >= :fecha_inicio
        )
    `,{ prod_id:producto.id, fecha_inicio: HOY })
    
    if (precios && precios[0] && precios[0].length > 0){ 
        precios = precios[0]
        console.log(precios)
        let proms_ = []
        for (let i=0; i < precios.length; i++){
            console.log(precios[i].price, precios[i].date_time)
            // Solo insertar si la fecha es del día actual
            if (new Date(precios[i].date_time) >= HOY) {
                proms_.push(trx('price_today').insert(precios[i]))
            }
        }
        if (proms_.length > 0) {
            await Promise.all(proms_)
        }
        
        return await trx.commit()
    } else
        return trx.rollback()
}

const PROC_TIME = 70

setTimeout( async ()=>{
    
    await knex('price_today').delete() 

    let productos = await knex('products')
    if (productos){
        console.log('productos obtenidos', productos.length)
        setInterval( async ()=>{
            let producto = productos.pop()
            return await definir_ultimo(producto) 
        }, PROC_TIME)
        
    }

}, 100)

