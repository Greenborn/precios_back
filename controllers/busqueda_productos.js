let lst_letras = {}

function normalize( str ){
    return String(str).normalize('NFD')
            .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,"$1")
            .normalize().toLowerCase()
}

function obtener_propiedades(name) {
    let letras = {}

    for (let i = 0; i < name.length; i++) {
        if (!letras[name[i]])
            letras[name[i]] = []

        letras[name[i]].push(i)
    }
    return letras
}

exports.inicializa_buscador = async function() {

    console.log('Generando estructura de busqueda')

    for (let i = 0; i < global.alias_productos.length; i++) {
        const nombre = normalize(global.alias_productos[i].name)
        
        let props = obtener_propiedades(nombre)
        let aux = { dsc: props, name: nombre, id: global.alias_productos[i].id}

        let o_k = Object.keys(props)
        for (let j = 0; j < o_k.length; j++) {
            if(!lst_letras[o_k[j]])
                lst_letras[o_k[j]] = []
            lst_letras[o_k[j]].push(aux)
        }
        
    }
    console.log('estructura de busqueda generada.')
}


exports.busqueda = async function( termino, limit = -1 ) {
    termino = normalize(termino)
    let palabras = termino.split(" ")
    
    let encontrados = []
    let encontrados_k = []
    const p_letra = termino[0]
    let listado = [...lst_letras[p_letra] ? lst_letras[p_letra] : []]

    for (let c = 0; c < palabras.length; c++) {
        const palabra = palabras[c]
        encontrados = []
        encontrados_k = []
        let primera_letra = palabra[0]

        for (let i = 0; i < listado.length; i++) {
            const e_actual = listado[i]
            if (!e_actual.dsc[primera_letra])
                continue

            let pos_ = e_actual.dsc[primera_letra]

            for (let j = 1; j < pos_.length; j++) {
                let l = 0
                for (let k = pos_[j]; k < e_actual.name.length; k++) {
                    const letra_db = e_actual.name[k]
                    if (letra_db != palabra[l])
                        break
                    l++
                    if (l == palabra.length) {
                        encontrados_k.push({id:e_actual.id, name:e_actual.name})
                        encontrados.push(e_actual)
                        break
                    }
                }
            }

        }
        if (encontrados.length == 0)
            return []
        listado = [...encontrados]
    }

    return encontrados_k
}
