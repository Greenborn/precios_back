import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';

const NOMBRE_ARCHIVO = "unificar_prod.sql"

function procesa_unificacion(/*trx,*/ ALIAS_PRODS, products_, prods_diccio ){
    let arr_id_prods = []
    let arr_alias = []
    //Se obtiene todos los ids de productos del alias
    let products_consult = []
    let diccio_sql_no_rep = {}
    
    let script_sql = ""

    for (let i=0; i < products_.length; i++){
        if (products_[i].name.toLowerCase().includes(ALIAS_PRODS[0].toLowerCase())){
            products_consult.push(products_[i])
            products_.splice(i, 1)
        }
    }

    if (products_consult){
        console.log('Cant. prods encontrados: ', products_consult.length, ' total restante  ', products_.length)
        parentPort.postMessage("Procesando "+ALIAS_PRODS[0]);
        if (products_consult.length == 1){
            return ''
        }

        for (let i=0; i < products_consult.length; i++){
            arr_id_prods.push( products_consult[i].id )
            arr_alias.push( products_consult[i].name )
        }

        const ID_PRINCIPAL = arr_id_prods[0]
        console.log(ALIAS_PRODS, ALIAS_PRODS.length, arr_id_prods, arr_id_prods.length, ID_PRINCIPAL)
        if (!ID_PRINCIPAL){
            console.log(ID_PRINCIPAL, products_consult)
            return ''
        }

        let product = prods_diccio[ID_PRINCIPAL]
        if (!product){
            return ''
        } else {
            console.log(product)

            console.log(" \n Se actualizan registros de alias referenciandolos solo al primer producto")
            for (let i=0; i < arr_alias.length; i++){
                if (arr_alias[i].includes("'"))
                    return ''

                let aux = "update alias_productos set product_id = '"+ID_PRINCIPAL+"' where alias = '"+arr_alias[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                    console.log(aux)
                }
            }
            
            for (let i=0; i < arr_id_prods.length; i++){
                let aux = "update price set product_id = '"+ID_PRINCIPAL+"' where product_id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                    console.log(aux)
                }
            }

            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                let aux = "delete from product_category where product_id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                    console.log(aux)
                }
            }

            for (let i=0; i < arr_id_prods.length; i++){
                if (arr_id_prods[i] == ID_PRINCIPAL)
                    continue

                if (arr_alias[i].includes("'"))
                    return ''

                let aux = "delete from products where id = '"+arr_id_prods[i]+"';\n"
                if (!diccio_sql_no_rep[aux]){
                    script_sql += aux
                    diccio_sql_no_rep[aux] = true
                    console.log(aux)
                }                
            }
            
           
            return script_sql
            
        }
        
    } else 
        return ''
}

let script_sql = ''
let c = 0

parentPort.on('message', (msg) => {
    const regs         = msg.regs
    const products_    = msg.products_
    const prods_diccio = msg.prods_diccio

    for (let j=0; j < regs.length; j ++){
        let reg = regs[j]
        //console.log("Procesando ", reg, c, ' de ', cant_total)
        script_sql += procesa_unificacion( reg, products_, prods_diccio ) 
        c++ 

        if (c % 100 == 0){
            fs.writeFileSync(NOMBRE_ARCHIVO, script_sql, { flag: 'a' }, (err) => {
                if (err) {
                    console.error(`Error al escribir el archivo: ${err.message}`)
                } else {
                    console.log(`Archivo escrito correctamente: unificar_productos.sql`)
                    
                }
            })
            script_sql = ''
        }
    }
    parentPort.postMessage("Worker termino proceso");
});