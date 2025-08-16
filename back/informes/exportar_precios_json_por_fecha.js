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

  // 3. Agrupar por product_id
  const resultado = {};
  for (const registro of [...preciosAnteriores, ...precios]) {
    if (!resultado[registro.product_id]) {
      resultado[registro.product_id] = { precios: [] };
    }
    resultado[registro.product_id].precios.push({
      id: registro.id,
      price: registro.price,
      date_time: registro.date_time,
      branch_id: registro.branch_id,
      es_oferta: registro.es_oferta,
      porcentage_oferta: registro.porcentage_oferta,
      confiabilidad: registro.confiabilidad,
      url: registro.url,
      notas: registro.notas
    });
  }

  await connection.end();

  const nombreArchivo = `precios_exportados_${fechaInicio}_${fechaFin}.json`;
  fs.writeFileSync(path.join(__dirname, nombreArchivo), JSON.stringify(resultado, null, 2));
  console.log(`Archivo ${nombreArchivo} generado correctamente.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
