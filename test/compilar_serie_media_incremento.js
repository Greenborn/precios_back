const fs = require('fs');
const path = require('path');

const SERIES_DIR = path.join(__dirname, 'series');
const OUT_DIR = path.join(__dirname, 'series_compiladas');
const OUT_FILE = path.join(OUT_DIR, 'media_incremento_diario.json');

// Crear el directorio de salida si no existe
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

// Leer todos los archivos de series
const files = fs.readdirSync(SERIES_DIR).filter(f => f.endsWith('.json'));

// Diccionario: fecha -> array de incrementos
const incPorFecha = {};
let minFecha = null;
let maxFecha = null;

for (const file of files) {
    const serie = JSON.parse(fs.readFileSync(path.join(SERIES_DIR, file), 'utf8'));
    for (const punto of serie) {
        const fecha = punto.date;
        const inc = punto.inc;
        if (!fecha || inc === null || inc === undefined) continue;
        if (fecha < '2024-01-01') continue;
        if (!incPorFecha[fecha]) incPorFecha[fecha] = [];
        incPorFecha[fecha].push(Number(inc));
        if (!minFecha || fecha < minFecha) minFecha = fecha;
        if (!maxFecha || fecha > maxFecha) maxFecha = fecha;
    }
}

if (!minFecha || !maxFecha) {
    console.error('No se encontraron datos válidos desde 2024.');
    process.exit(1);
}

// Funciones estadísticas
function calcularMediana(arr) {
    const nums = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}
function calcularStd(arr, media) {
    if (arr.length < 2) return 0;
    const m = media !== undefined ? media : arr.reduce((a, b) => a + b, 0) / arr.length;
    const varianza = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (arr.length - 1);
    return Math.sqrt(varianza);
}

// Generar la serie compilada desde el 1 de enero de 2024 hasta la última fecha
const start = new Date('2024-01-01');
const end = new Date(maxFecha);
const formatDate = d => d.toISOString().slice(0, 10);
const serieCompilada = [];

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const fechaStr = formatDate(d);
    const incs = incPorFecha[fechaStr];
    let mean = null, count = 0, median = null, std = null;
    if (incs && incs.length > 0) {
        mean = incs.reduce((a, b) => a + b, 0) / incs.length;
        median = calcularMediana(incs);
        std = calcularStd(incs, mean);
        count = incs.length;
    }
    serieCompilada.push({ date: fechaStr, mean_inc: mean, median_inc: median, std_inc: std, count });
}

fs.writeFileSync(OUT_FILE, JSON.stringify(serieCompilada, null, 2));
console.log(`Serie compilada guardada en: ${OUT_FILE}`); 