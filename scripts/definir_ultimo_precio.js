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


async function definir_ultimo( trx, producto ){
    let hoy = new Date()

    let precio = await knex("price").select().where('product_id', producto.id)
        .andWhere('date_time', '>', new Date( hoy.getTime() - 30*24*60*60*1000 )).orderBy('date_time', 'desc').first()
    if (precio){
        console.log(precio)
        return await trx('price_today').insert(precio)
    }else
        return
}

const PROC_TIME = 70

setTimeout( async ()=>{
    
    await knex('price_today').delete() 

    let productos = await knex("products").select()
    if (productos){
        
        
        setInterval( async ()=>{
            let producto = productos.pop()
            var trx = await knex.transaction()
            console.log('procesando ', producto.name)
            let res = await definir_ultimo(trx, producto) 
            if (res){
                console.log(res)
                await trx.commit()
            }
        }, PROC_TIME)
        
    }

}, 100)

