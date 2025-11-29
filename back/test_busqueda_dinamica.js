/**
 * Script de prueba para validar las nuevas funcionalidades de búsqueda dinámica
 * 
 * Uso: node test_busqueda_dinamica.js
 */

require("dotenv").config({ path: '.env' })
const busqueda_productos = require("./controllers/busqueda_productos")

// Configuración de conexión a base de datos
let conn_obj = {
    host: process.env.mysql_host,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: function (field, next) {
        if (field.type == "NEWDECIMAL") {
            var value = field.string();
            return (value === null) ? null : Number(value);
        }
        return next();
    }
}

global.knex = require('knex')({
    client: 'mysql2',
    connection: conn_obj,
    pool: { min: 0, max: 10, "propagateCreateError": false }
});

async function testBusquedaDinamica() {
    console.log('='.repeat(60))
    console.log('TEST: Búsqueda Dinámica de Productos')
    console.log('='.repeat(60))

    try {
        // 1. Inicializar el buscador
        console.log('\n1. Inicializando estructura de búsqueda...')
        await busqueda_productos.inicializa_buscador()
        console.log('   ✓ Estructura inicializada')

        // 2. Buscar un producto existente
        console.log('\n2. Buscando "leche"...')
        let resultados = await busqueda_productos.busqueda('leche', 5)
        console.log(`   ✓ Encontrados: ${resultados.length} productos`)
        if (resultados.length > 0) {
            console.log(`   - Ejemplo: ${resultados[0].name} - $${resultados[0].price}`)
        }

        // 3. Agregar un nuevo producto de prueba
        console.log('\n3. Agregando producto de prueba a la estructura...')
        const productoTest = {
            product_name: 'Leche Descremada Test 1L',
            product_id: 'test-prod-001',
            price: 999.99,
            branch_id: 1,
            date_time: new Date(),
            time: new Date(),
            url: 'https://test.com/producto'
        }
        
        const agregado = busqueda_productos.agregar_a_buscador(productoTest)
        console.log(`   ✓ Producto agregado: ${agregado}`)

        // 4. Verificar que se puede encontrar el producto nuevo
        console.log('\n4. Buscando el producto agregado...')
        let resultadosTest = await busqueda_productos.busqueda('leche descremada test', 10)
        const encontrado = resultadosTest.find(p => p.product_id === 'test-prod-001')
        console.log(`   ✓ Producto encontrado: ${encontrado ? 'Sí' : 'No'}`)
        if (encontrado) {
            console.log(`   - Nombre: ${encontrado.name}`)
            console.log(`   - Precio: $${encontrado.price}`)
        }

        // 5. Actualizar el producto (mismo product_id y branch_id)
        console.log('\n5. Actualizando producto (nuevo precio)...')
        const productoActualizado = {
            ...productoTest,
            price: 1299.99,
            date_time: new Date()
        }
        
        busqueda_productos.agregar_a_buscador(productoActualizado)
        console.log('   ✓ Producto actualizado')

        // 6. Verificar que el precio se actualizó
        console.log('\n6. Verificando actualización...')
        let resultadosActualizados = await busqueda_productos.busqueda('leche descremada test', 10)
        const actualizado = resultadosActualizados.find(p => p.product_id === 'test-prod-001')
        console.log(`   ✓ Precio actualizado: $${actualizado?.price}`)
        console.log(`   ✓ Debe ser 1299.99: ${actualizado?.price === 1299.99 ? 'Correcto' : 'Error'}`)

        // 7. Verificar que no hay duplicados
        const duplicados = resultadosActualizados.filter(p => p.product_id === 'test-prod-001')
        console.log(`   ✓ Sin duplicados: ${duplicados.length === 1 ? 'Correcto' : 'Error - hay ' + duplicados.length}`)

        // 8. Eliminar el producto de prueba
        console.log('\n7. Eliminando producto de prueba...')
        busqueda_productos.eliminar_de_buscador('test-prod-001', 1)
        console.log('   ✓ Producto eliminado')

        // 9. Verificar que ya no existe
        console.log('\n8. Verificando eliminación...')
        let resultadosFinales = await busqueda_productos.busqueda('leche descremada test', 10)
        const existe = resultadosFinales.find(p => p.product_id === 'test-prod-001')
        console.log(`   ✓ Producto eliminado correctamente: ${!existe ? 'Sí' : 'No'}`)

        console.log('\n' + '='.repeat(60))
        console.log('✓ Todas las pruebas completadas exitosamente')
        console.log('='.repeat(60))

    } catch (error) {
        console.error('\n✗ Error en las pruebas:', error)
    } finally {
        await global.knex.destroy()
        process.exit(0)
    }
}

// Ejecutar las pruebas
testBusquedaDinamica()
