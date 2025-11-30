/**
 * Test de validación: Verificar que no se pisen precios entre sucursales diferentes
 * 
 * Este test valida que:
 * 1. Un mismo producto puede tener diferentes precios en diferentes sucursales
 * 2. Actualizar el precio en una sucursal NO afecta el precio en otras sucursales
 * 3. La estructura de búsqueda mantiene correctamente los precios separados por sucursal
 * 
 * Uso: node test_validacion_branch_id.js
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

async function testValidacionBranchId() {
    console.log('='.repeat(70))
    console.log('TEST: Validación de Separación de Precios por Sucursal (branch_id)')
    console.log('='.repeat(70))

    try {
        // 1. Inicializar el buscador
        console.log('\n1. Inicializando estructura de búsqueda...')
        await busqueda_productos.inicializa_buscador()
        console.log('   ✓ Estructura inicializada')

        // 2. Agregar mismo producto en 3 sucursales diferentes con precios diferentes
        console.log('\n2. Agregando mismo producto en 3 sucursales diferentes...')
        
        // Usar mayúsculas/minúsculas mezcladas para validar búsqueda case-insensitive
        const producto_base = {
            product_name: 'Coca Cola 2.25L Test Validacion',  // Con mayúsculas
            product_id: 'test-coca-001',
        }

        // Sucursal 1: $1000
        busqueda_productos.agregar_a_buscador({
            ...producto_base,
            branch_id: 1,
            price: 1000.00,
            date_time: new Date(),
            time: new Date(),
            url: 'https://sucursal1.com/coca'
        })
        console.log('   ✓ Sucursal 1: $1000.00')

        // Sucursal 2: $1200
        busqueda_productos.agregar_a_buscador({
            ...producto_base,
            branch_id: 2,
            price: 1200.00,
            date_time: new Date(),
            time: new Date(),
            url: 'https://sucursal2.com/coca'
        })
        console.log('   ✓ Sucursal 2: $1200.00')

        // Sucursal 3: $950
        busqueda_productos.agregar_a_buscador({
            ...producto_base,
            branch_id: 3,
            price: 950.00,
            date_time: new Date(),
            time: new Date(),
            url: 'https://sucursal3.com/coca'
        })
        console.log('   ✓ Sucursal 3: $950.00')

        // 3. Buscar con MINÚSCULAS (debe encontrar productos con MAYÚSCULAS)
        console.log('\n3. Buscando "coca cola" (en minúsculas)...')
        let resultados = await busqueda_productos.busqueda('coca cola', 100)
        const productos_coca = resultados.filter(p => p.product_id === 'test-coca-001')
        
        console.log(`   ✓ Encontradas ${productos_coca.length} entradas del mismo producto`)
        console.log(`   ✓ Debe haber 3 entradas: ${productos_coca.length === 3 ? 'CORRECTO ✓' : 'ERROR ✗'}`)

        // 4. Verificar que cada sucursal tiene su precio correcto
        console.log('\n4. Verificando precios por sucursal...')
        const sucursal1 = productos_coca.find(p => p.branch_id === 1)
        const sucursal2 = productos_coca.find(p => p.branch_id === 2)
        const sucursal3 = productos_coca.find(p => p.branch_id === 3)

        console.log(`   Sucursal 1: $${sucursal1?.price} - Esperado: $1000.00 - ${sucursal1?.price === 1000 ? '✓' : '✗'}`)
        console.log(`   Sucursal 2: $${sucursal2?.price} - Esperado: $1200.00 - ${sucursal2?.price === 1200 ? '✓' : '✗'}`)
        console.log(`   Sucursal 3: $${sucursal3?.price} - Esperado: $950.00 - ${sucursal3?.price === 950 ? '✓' : '✗'}`)

        // 5. Actualizar precio SOLO en sucursal 2
        console.log('\n5. Actualizando precio SOLO en sucursal 2 (de $1200 a $1350)...')
        busqueda_productos.agregar_a_buscador({
            ...producto_base,
            branch_id: 2,
            price: 1350.00,
            date_time: new Date(),
            time: new Date(),
            url: 'https://sucursal2.com/coca-actualizado'
        })
        console.log('   ✓ Precio actualizado')

        // 6. Verificar que SOLO cambió sucursal 2
        console.log('\n6. Verificando que SOLO cambió sucursal 2...')
        let resultados_actualizados = await busqueda_productos.busqueda('coca cola', 100)
        const productos_coca_act = resultados_actualizados.filter(p => p.product_id === 'test-coca-001')
        
        const suc1_act = productos_coca_act.find(p => p.branch_id === 1)
        const suc2_act = productos_coca_act.find(p => p.branch_id === 2)
        const suc3_act = productos_coca_act.find(p => p.branch_id === 3)

        console.log(`   Sucursal 1: $${suc1_act?.price} - Esperado: $1000.00 (sin cambio) - ${suc1_act?.price === 1000 ? '✓' : '✗ ERROR'}`)
        console.log(`   Sucursal 2: $${suc2_act?.price} - Esperado: $1350.00 (actualizado) - ${suc2_act?.price === 1350 ? '✓' : '✗ ERROR'}`)
        console.log(`   Sucursal 3: $${suc3_act?.price} - Esperado: $950.00 (sin cambio) - ${suc3_act?.price === 950 ? '✓' : '✗ ERROR'}`)

        // 7. Verificar que no hay duplicados
        console.log('\n7. Verificando que no hay duplicados...')
        console.log(`   Total de entradas: ${productos_coca_act.length}`)
        console.log(`   Debe ser exactamente 3: ${productos_coca_act.length === 3 ? 'CORRECTO ✓' : 'ERROR ✗'}`)

        // 8. Eliminar solo sucursal 1
        console.log('\n8. Eliminando SOLO sucursal 1...')
        busqueda_productos.eliminar_de_buscador('test-coca-001', 1)
        console.log('   ✓ Sucursal 1 eliminada')

        // 9. Verificar que quedan solo sucursales 2 y 3
        console.log('\n9. Verificando que quedan solo sucursales 2 y 3...')
        let resultados_finales = await busqueda_productos.busqueda('coca cola', 100)
        const productos_coca_final = resultados_finales.filter(p => p.product_id === 'test-coca-001')
        
        console.log(`   Total de entradas restantes: ${productos_coca_final.length}`)
        console.log(`   Debe ser 2: ${productos_coca_final.length === 2 ? 'CORRECTO ✓' : 'ERROR ✗'}`)

        const suc1_final = productos_coca_final.find(p => p.branch_id === 1)
        const suc2_final = productos_coca_final.find(p => p.branch_id === 2)
        const suc3_final = productos_coca_final.find(p => p.branch_id === 3)

        console.log(`   Sucursal 1 existe: ${suc1_final ? 'SÍ ✗ ERROR' : 'NO ✓'}`)
        console.log(`   Sucursal 2 existe: ${suc2_final ? 'SÍ ✓' : 'NO ✗ ERROR'}`)
        console.log(`   Sucursal 3 existe: ${suc3_final ? 'SÍ ✓' : 'NO ✗ ERROR'}`)

        // 10. Limpieza
        console.log('\n10. Limpiando datos de prueba...')
        busqueda_productos.eliminar_de_buscador('test-coca-001', 2)
        busqueda_productos.eliminar_de_buscador('test-coca-001', 3)
        console.log('   ✓ Limpieza completada')

        // Validación final
        console.log('\n' + '='.repeat(70))
        const todo_ok = (
            productos_coca.length === 3 &&
            sucursal1?.price === 1000 &&
            sucursal2?.price === 1200 &&
            sucursal3?.price === 950 &&
            suc1_act?.price === 1000 &&
            suc2_act?.price === 1350 &&
            suc3_act?.price === 950 &&
            productos_coca_act.length === 3 &&
            productos_coca_final.length === 2 &&
            !suc1_final &&
            suc2_final &&
            suc3_final
        )

        if (todo_ok) {
            console.log('✓✓✓ TODAS LAS VALIDACIONES PASARON CORRECTAMENTE ✓✓✓')
            console.log('✓ Los precios se mantienen separados correctamente por sucursal')
            console.log('✓ No hay interferencia entre sucursales diferentes')
        } else {
            console.log('✗✗✗ ALGUNAS VALIDACIONES FALLARON ✗✗✗')
            console.log('✗ Revisar la lógica de separación por branch_id')
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
testValidacionBranchId()
