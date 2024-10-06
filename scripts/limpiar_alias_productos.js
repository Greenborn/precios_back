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


let diccio_alias = {}
let alias_unicos = []

setTimeout( async ()=>{

    let alias_productos = await knex("alias_productos").select()
    if (alias_productos){
        console.log("Armando diccionario de alias -> productos ")
        for (let i=0; i < alias_productos.length; i++){ 
            if (!diccio_alias[alias_productos[i].alias]){ 
                diccio_alias[alias_productos[i].alias] = []
                alias_unicos.push([alias_productos[i].alias])
            }
            diccio_alias[alias_productos[i].alias].push(alias_productos[i].product_id)
        }      

        fs.writeFile("productos_unificar.json", JSON.stringify(alias_unicos), err => {
            console.log("Done writing"); // Success
        })
        fs.writeFile("diccio_alias_products.json", JSON.stringify(diccio_alias), err => {
            console.log("Done writing",diccio_alias ); // Success
        })
        
        console.log("Procesando diccionario de alias -> productos ")
        let proms_arr = []
        let trx = await knex.transaction()
        
        let keys_ = Object.keys(diccio_alias)

        console.log("Se borran todos los alias para iniciarlizarlos de nuevo")
        proms_arr.push( 
            trx('alias_productos').delete()
        )

        let cant_regs_insertados = 0
        for (let i=0; i < keys_.length; i++){
            let alias = keys_[i]

            for (let j=0; j < diccio_alias[alias].length; j++){
                proms_arr.push( 
                    trx('alias_productos').insert({ alias: keys_[i], product_id: diccio_alias[alias][j] })
                )
                console.log('insercion: ', keys_[i], diccio_alias[alias][j])
                cant_regs_insertados ++
            }
            
        }

        let res = await Promise.all(proms_arr)
        if (res){
            await trx.commit()
            console.log(res)
        }

        console.log(" Alias unicos:  ", keys_.length, ' inserciones ', cant_regs_insertados)

    }
}, 100)
