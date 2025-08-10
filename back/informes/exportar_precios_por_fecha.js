// Script para exportar precios entre fechas a CSV
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Parámetros: node exportar_precios_por_fecha.js YYYY-MM-DD YYYY-MM-DD
const [,, fechaInicio, fechaFin] = process.argv;
if (!fechaInicio || !fechaFin) {
  console.error('Uso: node exportar_precios_por_fecha.js <fecha_inicio> <fecha_fin>');
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
  // 1. Obtener todos los productos con precios en el periodo
  const productosQuery = `
    SELECT DISTINCT pr.id AS product_id, pr.name AS nombre_producto, e.name AS comercio, b.id AS branch_id
    FROM price p
    JOIN products pr ON p.product_id = pr.id
    JOIN branch b ON p.branch_id = b.id
    JOIN enterprice e ON b.enterprise_id = e.id
    WHERE p.date_time BETWEEN ? AND ?
  `;
  const [productos] = await connection.execute(productosQuery, [fechaInicio, fechaFin]);

  // 2. Obtener todos los precios en el periodo
  const preciosQuery = `
    SELECT DATE_FORMAT(p.date_time, '%Y-%m-%d') AS fecha, pr.id AS product_id, pr.name AS nombre_producto, e.name AS comercio, p.url, '' AS notas, b.id AS branch_id
    FROM price p
    JOIN products pr ON p.product_id = pr.id
    JOIN branch b ON p.branch_id = b.id
    JOIN enterprice e ON b.enterprise_id = e.id
    WHERE p.date_time BETWEEN ? AND ?
    ORDER BY p.date_time ASC
  `;
  const [precios] = await connection.execute(preciosQuery, [fechaInicio, fechaFin]);

  // 3. Para cada producto, verificar si tiene precio el primer día
  const preciosPrimerDia = [];
  for (const prod of productos) {
    // Buscar si hay precio el primer día para este producto y sucursal
    const precioPrimerDia = precios.find(r => r.product_id === prod.product_id && r.branch_id === prod.branch_id && r.fecha === fechaInicio);
    if (!precioPrimerDia) {
      // Si no hay, buscar el último precio anterior al primer día
      const ultimoPrecioQuery = `
        SELECT DATE_FORMAT(p.date_time, '%Y-%m-%d') AS fecha_real, p.price, pr.name AS nombre_producto, e.name AS comercio, p.url, b.id AS branch_id
        FROM price p
        JOIN products pr ON p.product_id = pr.id
        JOIN branch b ON p.branch_id = b.id
        JOIN enterprice e ON b.enterprise_id = e.id
        WHERE p.product_id = ? AND b.id = ? AND p.date_time < ?
        ORDER BY p.date_time DESC LIMIT 1
      `;
      const [ultimos] = await connection.execute(ultimoPrecioQuery, [prod.product_id, prod.branch_id, fechaInicio]);
      if (ultimos.length > 0) {
        const u = ultimos[0];
        preciosPrimerDia.push({
          fecha: fechaInicio,
          nombre_producto: u.nombre_producto,
          comercio: u.comercio,
          url: u.url,
          notas: `registrado el: ${u.fecha_real}`,
        });
      }
    }
  }

  // 4. Preparar los precios del periodo (sin los campos auxiliares)
  const preciosFinales = precios.map(r => ({
    fecha: r.fecha,
    nombre_producto: r.nombre_producto,
    comercio: r.comercio,
    url: r.url,
    notas: r.notas,
  }));

  // 5. Unir los precios completados del primer día y los precios reales
  const resultado = [...preciosPrimerDia, ...preciosFinales];

  await connection.end();

  const nombreArchivo = `precios_exportados_${fechaInicio}_${fechaFin}.csv`;
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, nombreArchivo),
    header: [
      { id: 'nombre_producto', title: 'nombre producto' },
      { id: 'fecha', title: 'fecha' },
      { id: 'comercio', title: 'comercio' },
      { id: 'url', title: 'url' },
      { id: 'notas', title: 'notas' },
    ],
  });

  await csvWriter.writeRecords(resultado);
  console.log(`Archivo ${nombreArchivo} generado correctamente.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
