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
  const query = `
    SELECT DATE_FORMAT(p.date_time, '%Y-%m-%d') AS fecha, pr.name AS nombre_producto, e.name AS comercio, p.url, '' AS notas
    FROM price p
    JOIN products pr ON p.product_id = pr.id
    JOIN branch b ON p.branch_id = b.id
    JOIN enterprice e ON b.enterprise_id = e.id
    WHERE p.date_time BETWEEN ? AND ?
    ORDER BY p.date_time ASC
  `;
  const [rows] = await connection.execute(query, [fechaInicio, fechaFin]);
  await connection.end();

  const csvWriter = createCsvWriter({
    path: path.join(__dirname, 'precios_exportados.csv'),
    header: [
      { id: 'fecha', title: 'fecha' },
      { id: 'nombre_producto', title: 'nombre producto' },
      { id: 'comercio', title: 'comercio' },
      { id: 'url', title: 'url' },
      { id: 'notas', title: 'notas' },
    ],
  });

  await csvWriter.writeRecords(rows);
  console.log('Archivo precios_exportados.csv generado correctamente.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
