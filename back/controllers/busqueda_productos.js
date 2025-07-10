let lst_letras = {}

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
        const nombre = global.alias_productos[i].name
        
        let props = obtener_propiedades(nombre)
        let aux = { 'dsc': props, 'name': nombre, 'id': global.alias_productos[i].id}

        let o_k = Object.keys(props)
        for (let j = 0; j < o_k.length; j++) {
            const LETRA_NOMBRE = o_k[j]
            if(!lst_letras[ LETRA_NOMBRE ])
                lst_letras[ LETRA_NOMBRE ] = []
            lst_letras[ LETRA_NOMBRE ].push(aux)
        }
        
    }
    console.log('estructura de busqueda generada.')
}


exports.busqueda = async function( termino, limit = -1 ) {
    let palabras = termino.split(" ")
    
    let encontrados = []
    let encontrados_k = []
    const p_letra = termino[0]
    if (!lst_letras[p_letra])
        return []
    
    let listado = [ ...lst_letras[p_letra] ]

    for (let c = 0; c < palabras.length; c++) {
        const palabra = palabras[c]
        encontrados = []
        encontrados_k = []
        let primera_letra = palabra[0]

        for (let i = 0; i < listado.length; i++) {
            const e_actual = listado[i]
            if (!e_actual.dsc[primera_letra])
                continue

            const posiciones_letras = e_actual.dsc[primera_letra]

            for (let NUM_APARICION = 0; NUM_APARICION < posiciones_letras.length; NUM_APARICION++) {
                let POS_T = 0
                for (let POS_LETRA = posiciones_letras[NUM_APARICION]; POS_LETRA < e_actual.name.length; POS_LETRA++) {
                    const letra_db = e_actual.name[POS_LETRA]
                    if (letra_db != palabra[POS_T])
                        break
                    POS_T++
                    if (POS_T == palabra.length) {
                        encontrados_k.push({'id':e_actual.id, 'name':e_actual.name})
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
