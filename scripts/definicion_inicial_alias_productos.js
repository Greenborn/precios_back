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
    pool: { min: 0, max: 7 }
})


async function  procesa_reg(trx, product){
    const name = product.name.replace("\n","").toLowerCase()
    console.log(name)
    return await trx('alias_productos').insert( { "alias": name, "product_id": product.id } ) 
}

setTimeout( async ()=>{

    let products = await knex("products").select()
    if (products){
        
        let proms_arr = []
        let trx = await knex.transaction()
        for (let i=0; i < products.length; i++){
            let product = products[i]
            proms_arr.push(procesa_reg(trx, product))
        }

        let res = await Promise.all(proms_arr)
        if (res){
            await trx.commit()
            console.log(res)
        }
    }
}, 100)

