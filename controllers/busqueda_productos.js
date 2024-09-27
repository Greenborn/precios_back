let caracteres = []

let posiciones = []

function normalize( str ){
    return String(str).normalize('NFD')
            .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
            .normalize().toLowerCase()
}

exports.inicializa_buscador = async function() {
    console.log('Mapeando todos los posibles caracteres')
    let chars = {}

    for (let i=0; i < global.products.length; i++){
        const nombre = normalize(global.products[i].name)

        for (let j=0; j < nombre.length; j++){
            const caracter = nombre[j]
            if (!chars[caracter]){
                caracteres.push(caracter)
                chars[caracter] = 1
            }
            
        }
    } 
    console.log('caracteres obtenidos: ', caracteres)
    console.log('Generando matriz de busqueda')
    for (let i=0; i < global.products.length; i++){
        const nombre = normalize(global.products[i].name)
        const nombre_arr = nombre.split("")
                                
        for (let j=0; j < nombre_arr.length; j++){
            if (!posiciones[j]) posiciones[j] = {}

            const caracter = nombre_arr[j]
            if (!posiciones[j][caracter])
                posiciones[j][caracter] = {}

            posiciones[j][caracter][global.products[i].id] = global.products_diccio_id[global.products[i].id]
        }
    }
    console.log('Matriz de busqueda generada', posiciones.length)
}

exports.busqueda = async function( termino, limit = -1 ) {
    let palabras = termino.normalize('NFD')
                  .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
                  .normalize().toLowerCase().split(" ")
    let res = []
    let aux = []
    for (let i=0; i < palabras.length; i++){
        aux.push( buscar_termino(palabras[i]) ) 
    }

    let keys = Object.keys(aux[0])
    for (let i=1; i < keys.length; i++){
        let encontrado = true
        for (let j=1; j < aux.length; j++){
            encontrado = encontrado && aux[j][keys[i]]
        }
        if (encontrado) res.push(aux[0][keys[i]])

        if (limit > 0 && res.length >= limit) return res
    }
    return res

}

function buscar_termino(termino, buscar_f_n_letras = posiciones.length){

    let res = {}

    cant_pos = buscar_f_n_letras - termino.length
    
    for (let i = 0; i < cant_pos; i++){
        res = {...res, ...buscar(termino,i) }
    }
   
    return res 
}

function buscar(termino, offset=0){
    let res = {}
    
    let presel = []
    for (let i=0; i < termino.length; i++){
        const caracter = termino[i]
        
        const seccion = posiciones[i+offset][caracter]
        
        if (!seccion) 
            return {}

        presel[i] = seccion
    }
    
    const o_k = Object.keys(presel[0])
    
    for (let i=0; i < o_k.length; i++){
        
        let encontrado = true
        for (let j=1; j < presel.length; j++)
            encontrado = encontrado && presel[j][o_k[i]]
        
        if (encontrado)
            res[global.products_diccio_id[o_k[i]].id] = global.products_diccio_id[o_k[i]]
    }
    
   return res
    
}