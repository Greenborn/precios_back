const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const preciosPath = path.join(__dirname, 'price.csv');
const productosPath = path.join(__dirname, 'products.csv');
const salidaJson = path.join(__dirname, 'precios_por_producto.json');

function cargarCSV(filePath, nombre) {
    return new Promise((resolve, reject) => {
        const resultados = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => resultados.push(data))
            .on('end', () => {
                console.log(`Archivo ${nombre} cargado. Total de filas: ${resultados.length}`);
                resolve(resultados);
            })
            .on('error', reject);
    });
}

async function main() {
    try {
        console.log('Cargando productos...');
        const productos = await cargarCSV(productosPath, 'products.csv');
        console.log('Cargando precios...');
        const precios = await cargarCSV(preciosPath, 'price.csv');
        console.log('--- Resumen ---');
        console.log(`Productos cargados: ${productos.length}`);
        console.log(`Precios cargados: ${precios.length}`);

        // Crear diccionario por id de producto
        const preciosPorProducto = {};
        for (const precio of precios) {
            const id = precio.product_id;
            if (!preciosPorProducto[id]) {
                preciosPorProducto[id] = [];
            }
            preciosPorProducto[id].push(precio);
        }
        console.log('Diccionario de precios por producto creado. Ejemplo:');
        const primerId = Object.keys(preciosPorProducto)[0];
        console.log(`Producto: ${primerId}`);
        console.log(preciosPorProducto[primerId]);

        // Guardar en JSON
        fs.writeFileSync(salidaJson, JSON.stringify(preciosPorProducto, null, 2));
        console.log(`Diccionario guardado en: ${salidaJson}`);
    } catch (err) {
        console.error('Error al cargar los CSV:', err);
    }
}

main(); 