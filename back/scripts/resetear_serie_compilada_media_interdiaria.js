const fs = require('fs');
const path = require('path');
const knex = require('knex')(require('../knexfile'));

function esNumeroValido(n) {
  return typeof n === 'number' && isFinite(n) && !isNaN(n);
}

const TMP_DIR = path.join(__dirname, 'tmp_inc_por_fecha');
const FECHA_PARTIDA = '2024-01-01';

// Permitir pasar la tabla fuente como argumento (por defecto 'price')
const tablaFuente = process.argv[2] || 'price';

(async () => {
  try {
    console.log(`Iniciando reseteo de serie_compilada_media_interdiaria usando datos de ${tablaFuente}...`);
    await knex('serie_compilada_media_interdiaria').truncate();
    console.log('Tabla serie_compilada_media_interdiaria vaciada.');

    // Limpiar/crear directorio temporal
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TMP_DIR);

    // Leer todos los productos únicos
    const productos = await knex(tablaFuente).distinct('product_id');
    console.log(`Productos distintos encontrados: ${productos.length}`);

    // Procesar producto por producto
    for (let i = 0; i < productos.length; i++) {
      const prodId = productos[i].product_id;
      if (i % 1000 === 0) console.log(`Procesando producto ${i+1}/${productos.length}`);
      const serie = await knex(tablaFuente).select('date_time', 'price').where('product_id', prodId).orderBy('date_time');
      if (!serie.length) continue;
      // Generar serie diaria forward-fill desde FECHA_PARTIDA
      let daily = [];
      let idx = 0;
      let currPrice = serie[0].price;
      let currDate = new Date(FECHA_PARTIDA);
      const endDate = new Date(serie[serie.length-1].date_time);
      // Si el primer registro es posterior a FECHA_PARTIDA, usar ese como primer precio
      if (currDate < new Date(serie[0].date_time)) {
        currDate = new Date(serie[0].date_time);
      }
      while (currDate <= endDate) {
        if (idx < serie.length && sameDay(currDate, new Date(serie[idx].date_time))) {
          currPrice = serie[idx].price;
          idx++;
        }
        daily.push({ date: new Date(currDate), price: currPrice });
        currDate.setDate(currDate.getDate() + 1);
      }
      // Calcular incrementos interdiarios y guardar en archivos temporales por fecha
      for (let j = 1; j < daily.length; j++) {
        const prev = daily[j-1];
        const curr = daily[j];
        const inc = ((curr.price / prev.price) - 1) * 100;
        const fecha = curr.date.toISOString().slice(0, 10);
        if (fecha < FECHA_PARTIDA) continue;
        const file = path.join(TMP_DIR, `${fecha}.jsonl`);
        fs.appendFileSync(file, JSON.stringify(inc) + '\n');
      }
    }
    console.log('Incrementos interdiarios guardados en archivos temporales.');

    // Calcular estadísticas por fecha y guardar en la base de datos
    const files = fs.readdirSync(TMP_DIR).filter(f => f.endsWith('.jsonl'));
    let totalFechas = 0;
    let incAcumulado = 0;
    const fechas = files.map(f => f.replace('.jsonl', ''));
    fechas.sort();
    for (const fecha of fechas) {
      if (fecha < FECHA_PARTIDA) continue;
      const incs = fs.readFileSync(path.join(TMP_DIR, `${fecha}.jsonl`), 'utf8')
        .split('\n').filter(Boolean).map(Number).filter(esNumeroValido);
      if (!incs.length) continue;
      let mean = incs.reduce((a, b) => a + b, 0) / incs.length;
      let median = calcularMediana(incs);
      let std = calcularStd(incs, mean);
      const count = incs.length;
      if (!esNumeroValido(mean)) mean = 0;
      if (!esNumeroValido(median)) median = 0;
      if (!esNumeroValido(std)) std = 0;
      // Calcular incremento acumulado (composición multiplicativa)
      incAcumulado = ((1 + incAcumulado/100) * (1 + mean/100) - 1) * 100;
      await knex('serie_compilada_media_interdiaria').insert({
        date: fecha,
        mean_inc: mean,
        median_inc: median,
        std_inc: std,
        count,
        inc_acumulado: incAcumulado
      });
      totalFechas++;
      if (totalFechas % 50 === 0) {
        console.log(`Fechas procesadas: ${totalFechas}/${files.length}`);
      }
    }
    // Limpiar archivos temporales
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    console.log(`Serie compilada de incremento interdiario generada y guardada en la base de datos. Total de fechas: ${totalFechas}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

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
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
} 