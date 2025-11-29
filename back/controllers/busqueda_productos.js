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

    // Usar price_today para inicializar el buscador
    const productosHoy = await global.knex('price_today').select()
        .orderBy('date_time', 'desc')
        .orderBy('price', 'asc')
        .where('price', '<>', 0)
    for (let i = 0; i < productosHoy.length; i++) {
        const nombre = productosHoy[i].product_name
        let props = obtener_propiedades(nombre)
        let aux = {
            'dsc':        props,
            'name':       nombre,
            'product_id': productosHoy[i].product_id,
            'price':      productosHoy[i].price,
            'branch_id':  productosHoy[i].branch_id,
            'date_time':  productosHoy[i].date_time,
            'time':       productosHoy[i].time,
            'url':        productosHoy[i].url,
        }
        let o_k = Object.keys(props)
        for (let j = 0; j < o_k.length; j++) {
            const LETRA_NOMBRE = o_k[j]
            if(!lst_letras[ LETRA_NOMBRE ])
                lst_letras[ LETRA_NOMBRE ] = []
            lst_letras[ LETRA_NOMBRE ].push(aux)
        }
    }
    console.log('estructura de busqueda generada basada en price_today.')
}

/**
 * Elimina un producto específico de la estructura de búsqueda
 * @param {string} product_id - ID del producto
 * @param {number} branch_id - ID de la sucursal
 */
exports.eliminar_de_buscador = function(product_id, branch_id) {
    for (let letra in lst_letras) {
        lst_letras[letra] = lst_letras[letra].filter(item => 
            !(item.product_id === product_id && item.branch_id === branch_id)
        )
        // Limpiar arrays vacíos para optimizar memoria
        if (lst_letras[letra].length === 0) {
            delete lst_letras[letra]
        }
    }
}

/**
 * Agrega o actualiza un producto en la estructura de búsqueda
 * Si ya existe el mismo product_id + branch_id, primero lo elimina
 * @param {object} producto - Objeto con los datos del producto
 * @param {string} producto.product_name - Nombre del producto
 * @param {string} producto.product_id - ID del producto
 * @param {number} producto.price - Precio del producto
 * @param {number} producto.branch_id - ID de la sucursal
 * @param {Date} producto.date_time - Fecha y hora del precio
 * @param {Date} producto.time - Timestamp del precio
 * @param {string} producto.url - URL del producto (opcional)
 */
exports.agregar_a_buscador = function(producto) {
    // Validar que tenga los campos requeridos
    if (!producto.product_name || !producto.product_id || !producto.branch_id) {
        console.log('[busqueda_productos] Error: faltan campos requeridos para agregar al buscador')
        return false
    }

    // Eliminar el producto existente si ya está en la estructura (mismo product_id y branch_id)
    exports.eliminar_de_buscador(producto.product_id, producto.branch_id)

    // Crear la nueva entrada
    const nombre = producto.product_name
    let props = obtener_propiedades(nombre)
    let aux = {
        'dsc':        props,
        'name':       nombre,
        'product_id': producto.product_id,
        'price':      producto.price,
        'branch_id':  producto.branch_id,
        'date_time':  producto.date_time,
        'time':       producto.time,
        'url':        producto.url || null,
    }

    // Agregar a cada letra correspondiente
    let o_k = Object.keys(props)
    for (let j = 0; j < o_k.length; j++) {
        const LETRA_NOMBRE = o_k[j]
        if (!lst_letras[LETRA_NOMBRE]) {
            lst_letras[LETRA_NOMBRE] = []
        }
        lst_letras[LETRA_NOMBRE].push(aux)
    }

    console.log(`[busqueda_productos] Producto agregado/actualizado en buscador: ${nombre} (${producto.product_id} - ${producto.branch_id})`)
    return true
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
                        encontrados_k.push({
                            'id':e_actual.id,
                            'name':e_actual.name,
                            'price':e_actual.price,
                            'branch_id':e_actual.branch_id,
                            'product_id':e_actual.product_id,
                            'date_time':e_actual.date_time,
                            'time':e_actual.time,
                            'url':e_actual.url
                        })
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
