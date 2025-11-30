/**
 * Test específico para validar búsqueda case-insensitive
 * 
 * Uso: node test_case_insensitive.js
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

async function testCaseInsensitive() {
    console.log('='.repeat(70))
    console.log('TEST: Búsqueda Case-Insensitive (Mayúsculas/Minúsculas)')
    console.log('='.repeat(70))

    try {
        // 1. Inicializar el buscador
        console.log('\n1. Inicializando estructura de búsqueda...')
        await busqueda_productos.inicializa_buscador()
        console.log('   ✓ Estructura inicializada')

        // 2. Agregar productos con diferentes combinaciones de mayúsculas/minúsculas
        console.log('\n2. Agregando productos de prueba...')
        
        busqueda_productos.agregar_a_buscador({
            product_name: 'Leche La Serenisima ENTERA 1L',  // MAYÚSCULAS/minúsculas mezcladas
            product_id: 'test-case-001',
            price: 800,
            branch_id: 1,
            date_time: new Date(),
            time: new Date(),
            url: 'https://test.com/1'
        })
        console.log('   ✓ Producto 1: "Leche La Serenisima ENTERA 1L"')

        busqueda_productos.agregar_a_buscador({
            product_name: 'COCA COLA 2.25L',  // TODO MAYÚSCULAS
            product_id: 'test-case-002',
            price: 1200,
            branch_id: 1,
            date_time: new Date(),
            time: new Date(),
            url: 'https://test.com/2'
        })
        console.log('   ✓ Producto 2: "COCA COLA 2.25L"')

        busqueda_productos.agregar_a_buscador({
            product_name: 'queso cremoso ilolay',  // todo minúsculas
            product_id: 'test-case-003',
            price: 2500,
            branch_id: 1,
            date_time: new Date(),
            time: new Date(),
            url: 'https://test.com/3'
        })
        console.log('   ✓ Producto 3: "queso cremoso ilolay"')

        // 3. Buscar con diferentes combinaciones de mayúsculas/minúsculas
        console.log('\n3. Buscando con diferentes combinaciones...\n')

        // Test 1: Buscar "leche" (minúsculas) - debe encontrar "Leche La Serenisima ENTERA 1L"
        console.log('   Test 1: Buscar "leche" (minúsculas)')
        let r1 = await busqueda_productos.busqueda('leche', 100)
        let encontrado1 = r1.find(p => p.product_id === 'test-case-001')
        console.log(`   → ${encontrado1 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado1?.name}`)

        // Test 2: Buscar "LECHE" (MAYÚSCULAS) - debe encontrar "Leche La Serenisima ENTERA 1L"
        console.log('\n   Test 2: Buscar "LECHE" (MAYÚSCULAS)')
        let r2 = await busqueda_productos.busqueda('LECHE', 100)
        let encontrado2 = r2.find(p => p.product_id === 'test-case-001')
        console.log(`   → ${encontrado2 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado2?.name}`)

        // Test 3: Buscar "LeCHe SeReNiSiMa" (MeZcLaDo) - debe encontrar producto
        console.log('\n   Test 3: Buscar "LeCHe SeReNiSiMa" (mezclado)')
        let r3 = await busqueda_productos.busqueda('LeCHe SeReNiSiMa', 100)
        let encontrado3 = r3.find(p => p.product_id === 'test-case-001')
        console.log(`   → ${encontrado3 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado3?.name}`)

        // Test 4: Buscar "coca cola" (minúsculas) - debe encontrar "COCA COLA 2.25L"
        console.log('\n   Test 4: Buscar "coca cola" (minúsculas)')
        let r4 = await busqueda_productos.busqueda('coca cola', 100)
        let encontrado4 = r4.find(p => p.product_id === 'test-case-002')
        console.log(`   → ${encontrado4 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado4?.name}`)

        // Test 5: Buscar "COCA COLA" (MAYÚSCULAS) - debe encontrar "COCA COLA 2.25L"
        console.log('\n   Test 5: Buscar "COCA COLA" (MAYÚSCULAS)')
        let r5 = await busqueda_productos.busqueda('COCA COLA', 100)
        let encontrado5 = r5.find(p => p.product_id === 'test-case-002')
        console.log(`   → ${encontrado5 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado5?.name}`)

        // Test 6: Buscar "QUESO CREMOSO" (MAYÚSCULAS) - debe encontrar "queso cremoso ilolay"
        console.log('\n   Test 6: Buscar "QUESO CREMOSO" (MAYÚSCULAS)')
        let r6 = await busqueda_productos.busqueda('QUESO CREMOSO', 100)
        let encontrado6 = r6.find(p => p.product_id === 'test-case-003')
        console.log(`   → ${encontrado6 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado6?.name}`)

        // Test 7: Buscar "Queso Cremoso" (Capitalizado) - debe encontrar "queso cremoso ilolay"
        console.log('\n   Test 7: Buscar "Queso Cremoso" (capitalizado)')
        let r7 = await busqueda_productos.busqueda('Queso Cremoso', 100)
        let encontrado7 = r7.find(p => p.product_id === 'test-case-003')
        console.log(`   → ${encontrado7 ? '✓ ENCONTRADO' : '✗ NO ENCONTRADO'}: ${encontrado7?.name}`)

        // Limpieza
        console.log('\n4. Limpiando datos de prueba...')
        busqueda_productos.eliminar_de_buscador('test-case-001', 1)
        busqueda_productos.eliminar_de_buscador('test-case-002', 1)
        busqueda_productos.eliminar_de_buscador('test-case-003', 1)
        console.log('   ✓ Limpieza completada')

        // Validación final
        console.log('\n' + '='.repeat(70))
        const todo_ok = encontrado1 && encontrado2 && encontrado3 && 
                        encontrado4 && encontrado5 && encontrado6 && encontrado7

        if (todo_ok) {
            console.log('✓✓✓ TODAS LAS BÚSQUEDAS CASE-INSENSITIVE FUNCIONAN CORRECTAMENTE ✓✓✓')
            console.log('✓ La búsqueda funciona independientemente de mayúsculas/minúsculas')
        } else {
            console.log('✗✗✗ ALGUNAS BÚSQUEDAS FALLARON ✗✗✗')
            console.log('✗ Revisar la lógica de case-insensitive')
        }
        console.log('='.repeat(70))

    } catch (error) {
        console.error('\n✗ Error en las pruebas:', error)
    } finally {
        await global.knex.destroy()
        process.exit(0)
    }
}

// Ejecutar las pruebas
testCaseInsensitive()
