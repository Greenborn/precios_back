const MAX_ITEMS_PERIODO = 50;

// Estados por cola (clave: idCola)
const estadosColas = {};

exports.procesarColaProc = async function (idCola, cola, callback, onEmpty) {
    if (!estadosColas[idCola]) estadosColas[idCola] = { estabaVacia: true };
    let c = 0;
    while (cola.length > 0) {
        estadosColas[idCola].estabaVacia = false;
        c++;
        if (c > MAX_ITEMS_PERIODO) break;
        const item = cola.shift();
        try {
            await callback(item);
        } catch (error) {
            cola.push(item);
            console.log("error", error);
        }
    }
    if (cola.length === 0 && !estadosColas[idCola].estabaVacia && typeof onEmpty === 'function') {
        estadosColas[idCola].estabaVacia = true;
        try {
            await onEmpty();
        } catch (err) {
            console.log('Error en callback onEmpty:', err);
        }
    }
}

// Función auxiliar para usar al agregar elementos a la cola
exports.marcarColaNoVacia = function(idCola) {
    if (!estadosColas[idCola]) estadosColas[idCola] = { estabaVacia: true };
    estadosColas[idCola].estabaVacia = false;
};