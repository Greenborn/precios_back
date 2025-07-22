const MAX_ITEMS_PERIODO = 50;

// Estados por cola (clave: idCola)
const estadosColas = {};

exports.procesarColaProc = async function (idCola, cola, callback, onEmpty) {
    if (!estadosColas[idCola]) estadosColas[idCola] = { estabaVacia: true };
    let c = 0;
    if (cola.length !== 0) {
        console.log(`[${idCola}] Iniciando procesamiento de la cola. Items en cola: ${cola.length}`);
    }
    while (cola.length > 0) {
        estadosColas[idCola].estabaVacia = false;
        c++;
        if (c > MAX_ITEMS_PERIODO) {
            console.log(`[${idCola}] Límite de items por ciclo alcanzado (${MAX_ITEMS_PERIODO}).`);
            break;
        }
        const item = cola.shift();
        try {
            console.log(`[${idCola}] Procesando item #${c}. Items restantes: ${cola.length}`);
            await callback(item);
        } catch (error) {
            cola.push(item);
            console.log(`[${idCola}] Error procesando item, se re-agrega a la cola. Error:`, error);
        }
    }
    if (cola.length === 0 && !estadosColas[idCola].estabaVacia && typeof onEmpty === 'function') {
        estadosColas[idCola].estabaVacia = true;
        console.log(`[${idCola}] Cola vacía. Ejecutando callback onEmpty.`);
        try {
            await onEmpty();
        } catch (err) {
            console.log(`[${idCola}] Error en callback onEmpty:`, err);
        }
    } else if (cola.length === 0) {
        //console.log(`[${idCola}] Cola vacía. No se ejecuta onEmpty (ya ejecutado previamente).`);
    } else {
        console.log(`[${idCola}] Fin de ciclo. Items restantes en cola: ${cola.length}`);
    }
}

// Función auxiliar para usar al agregar elementos a la cola
exports.marcarColaNoVacia = function(idCola) {
    if (!estadosColas[idCola]) estadosColas[idCola] = { estabaVacia: true };
    estadosColas[idCola].estabaVacia = false;
};