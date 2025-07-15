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
        
        // Generar series diarias con mediana y rellenar días intermedios
        const preciosDiariosPorProducto = {};
        const parseDate = (str) => new Date(str);
        const formatDate = (date) => date.toISOString().slice(0, 10);
        const getMediana = (arr) => {
            const nums = arr.map(Number).sort((a, b) => a - b);
            const mid = Math.floor(nums.length / 2);
            return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
        };
        // Guardar en JSON por producto individualmente
        const seriesDir = path.join(__dirname, 'series');
        if (!fs.existsSync(seriesDir)) {
            fs.mkdirSync(seriesDir);
        }
        let count = 0;
        for (const [id, preciosArr] of Object.entries(preciosPorProducto)) {
            // Agrupar por fecha y calcular mediana
            const preciosPorFecha = {};
            for (const p of preciosArr) {
                let fecha = p.date_time || p.date || p.fecha || p.Date || p.Fecha; // soporta varios nombres
                const precio = p.price || p.precio || p.Price || p.Precio;
                if (!fecha || !precio) continue;
                if (fecha.length > 10) fecha = fecha.slice(0, 10);
                if (!preciosPorFecha[fecha]) preciosPorFecha[fecha] = [];
                preciosPorFecha[fecha].push(Number(precio));
            }
            const fechas = Object.keys(preciosPorFecha).sort();
            if (fechas.length === 0) continue;
            const primera = parseDate(fechas[0]);
            const ultima = parseDate(fechas[fechas.length - 1]);
            let actual = new Date(primera);
            let ultimoPrecio = null;
            let serie = [];
            let prevPrecio = null;
            while (actual <= ultima) {
                const fechaStr = formatDate(actual);
                if (preciosPorFecha[fechaStr]) {
                    ultimoPrecio = getMediana(preciosPorFecha[fechaStr]);
                }
                if (ultimoPrecio !== null) {
                    let inc = null;
                    let agregar = true;
                    if (prevPrecio !== null && prevPrecio !== 0) {
                        inc = ((ultimoPrecio / prevPrecio) - 1) * 100;
                        if (Math.abs(inc) > 50) {
                            agregar = false; // Excluir variaciones mayores al 50%
                        }
                    }
                    if (agregar) {
                        serie.push({ date: fechaStr, price: ultimoPrecio, inc });
                        prevPrecio = ultimoPrecio;
                    }
                }
                actual.setDate(actual.getDate() + 1);
            }
            // Guardar la serie individual
            const outPath = path.join(seriesDir, `${id}.json`);
            fs.writeFileSync(outPath, JSON.stringify(serie, null, 2));
            count++;
            if (count % 1000 === 0) console.log(`Guardadas ${count} series...`);
        }
        console.log(`Series diarias guardadas en archivos individuales dentro de: ${seriesDir}`);
    } catch (err) {
        console.error('Error al cargar los CSV:', err);
    }
}

main(); 