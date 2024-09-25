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
    let precios = await trx("price").select()
                    .where('product_id', producto.id)
    
    if (precios){ 
        //console.log(precio)
        let proms_ = []
        for (let i=0; i < precios.length; i++){
            proms_.push(trx('price_today').insert(precios[i]))
        }
        await Promise.all(proms_)
        
        return await trx.commit()
    } else
        return trx.rollback()
}

const PROC_TIME = 70

setTimeout( async ()=>{
    
    await knex('price_today').delete() 

    let productos = await knex.raw(`SELECT *
                        FROM price
                        WHERE (product_id, branch_id, price) IN (
                        SELECT product_id, branch_id, MAX(date_time)
                        FROM price
                        GROUP BY product_id, branch_id
                    )`)
    if (productos){
        console.log('productos obtenidos', productos.length)
        setInterval( async ()=>{
            let producto = productos.pop()
            return await definir_ultimo(producto) 
        }, PROC_TIME)
        
    }

}, 100)

