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

const ALIAS_PRODS = ['']
const PRODUCT_ID = ''


async function process_alias( ALIAS ){
    console.log(ALIAS)
}

setTimeout( async ()=>{

    let arr_proms = []

    for (let i=0; i < ALIAS_PRODS.length; i++)
        arr_proms.push(process_alias(ALIAS_PRODS[i]))

    let proms_res = await Promise.all(arr_proms)
    if (proms_res){
        console.log(proms_res)
    }
}, 100)