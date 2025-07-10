
exports.limpiarTexto = (texto) => {
    const REPLACES = [['á', 'a'],['é', 'e'],['í', 'i'],['ó', 'o'],['ú', 'u']]
    texto = texto.replace(/[;{}()\*/\\`'"]/g, '');
    texto = texto.replace(/[\r\n]/g, '');
    texto = texto.replace(/\s+/g, ' ');
    for (let i = 0; i < REPLACES.length; i++) 
        texto = texto.replace(REPLACES[i][0], REPLACES[i][1])
    texto = texto.trim().toLowerCase();
    return texto;
}