const MAX_ITEMS_PERIODO = 50
exports.procesarColaProc = async function ( cola, callback ) {
    let c = 0
    while (cola.length > 0) {
        console.log('procesando item')
        c++
        if (c > MAX_ITEMS_PERIODO)
            break
        
        const item = cola.shift();
        try {
            await callback(item);
        } catch (error) {
            cola.push( item );
            console.log("error", error);
        }
    }
}