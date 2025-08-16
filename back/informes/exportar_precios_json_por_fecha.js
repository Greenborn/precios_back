// Script para exportar precios entre fechas a JSON agrupado por producto
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Parámetros: node exportar_precios_json_por_fecha.js YYYY-MM-DD YYYY-MM-DD
const [,, fechaInicio, fechaFin] = process.argv;
if (!fechaInicio || !fechaFin) {
  console.error('Uso: node exportar_precios_json_por_fecha.js <fecha_inicio> <fecha_fin>');
  process.exit(1);
}

const dbConfig = {
  host: process.env.mysql_host,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
  port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
};

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  // 1. Obtener todos los precios en el periodo
  const preciosQuery = `
    SELECT p.id, p.product_id, p.price, DATE_FORMAT(p.date_time, '%Y-%m-%d %H:%i:%s') AS date_time, p.branch_id, p.es_oferta, p.porcentage_oferta, p.confiabilidad, p.url, p.notas
    FROM price p
    WHERE p.date_time BETWEEN ? AND ?
    ORDER BY p.product_id, p.date_time ASC
  `;
  const [precios] = await connection.execute(preciosQuery, [fechaInicio, fechaFin]);

  // 2. Obtener el precio anterior para cada producto y sucursal
  const productosSucursales = [...new Set(precios.map(r => r.product_id + '-' + r.branch_id))];
  const preciosAnteriores = [];
  for (const key of productosSucursales) {
    const [product_id, branch_id] = key.split('-');
    const anteriorQuery = `
      SELECT p.id, p.product_id, p.price, DATE_FORMAT(p.date_time, '%Y-%m-%d %H:%i:%s') AS date_time, p.branch_id, p.es_oferta, p.porcentage_oferta, p.confiabilidad, p.url, p.notas
      FROM price p
      WHERE p.product_id = ? AND p.branch_id = ? AND p.date_time < ?
      ORDER BY p.date_time DESC LIMIT 1
    `;
    const [anteriores] = await connection.execute(anteriorQuery, [product_id, branch_id, fechaInicio]);
    if (anteriores.length > 0) {
      preciosAnteriores.push({ ...anteriores[0], notas: (anteriores[0].notas || '') + ' (precio anterior)' });
    }
  }

  // 3. Calcular aumento porcentual interdiario y agrupar por día
  // Crear un mapa para el último precio por producto y sucursal
  const ultimoPrecioPorProductoSucursal = {};
  for (const registro of preciosAnteriores) {
    const key = registro.product_id + '-' + registro.branch_id;
    ultimoPrecioPorProductoSucursal[key] = registro.price;
  }

  // Agrupar por día y calcular mediana
  const resultado = {};
  for (const registro of precios) {
    const fechaDia = registro.date_time.substring(0, 10); // YYYY-MM-DD
    const key = registro.product_id + '-' + registro.branch_id;
    const precioAnterior = ultimoPrecioPorProductoSucursal[key];
    let aumento_interdiario = null;
    if (precioAnterior !== undefined && precioAnterior > 0) {
      aumento_interdiario = ((registro.price - precioAnterior) / precioAnterior) * 100;
    }
    // Actualizar el último precio para el siguiente registro
    ultimoPrecioPorProductoSucursal[key] = registro.price;
    if (!resultado[fechaDia]) {
      resultado[fechaDia] = { precios: [], mediana: null };
    }
    resultado[fechaDia].precios.push({
      price: registro.price,
      product_id: registro.product_id,
      branch_id: registro.branch_id,
      aumento_interdiario: aumento_interdiario
    });
  }

  // Calcular la mediana del aumento interdiario por día
  function calcularMediana(arr) {
    if (arr.length === 0) return null;
    const valores = arr.filter(obj => obj.aumento_interdiario !== null)
      .map(obj => obj.aumento_interdiario)
      .sort((a, b) => a - b);
    if (valores.length === 0) return null;
    const mid = Math.floor(valores.length / 2);
    if (valores.length % 2 === 0) {
      return (valores[mid - 1] + valores[mid]) / 2;
    } else {
      return valores[mid];
    }
  }
  for (const fechaDia in resultado) {
    resultado[fechaDia].mediana = calcularMediana(resultado[fechaDia].precios);
  }

  // Crear CSV con fecha y mediana de aumento interdiario
  const fechasOrdenadas = Object.keys(resultado).sort();
  const csvLines = ['fecha,mediana_aumento_interdiario'];
  for (const fecha of fechasOrdenadas) {
    csvLines.push(`${fecha},${resultado[fecha].mediana !== null ? resultado[fecha].mediana : ''}`);
  }
  const nombreArchivoCSV = `precios_exportados_${fechaInicio}_${fechaFin}_mediana_aumento_interdiario.csv`;
  fs.writeFileSync(path.join(__dirname, nombreArchivoCSV), csvLines.join('\n'));
  console.log(`Archivo ${nombreArchivoCSV} generado correctamente.`);

  await connection.end();

  const nombreArchivo = `precios_exportados_${fechaInicio}_${fechaFin}.json`;
  fs.writeFileSync(path.join(__dirname, nombreArchivo), JSON.stringify(resultado, null, 2));
  console.log(`Archivo ${nombreArchivo} generado correctamente.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
