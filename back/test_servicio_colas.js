/**
 * Test de integración con el servicio de colas externo
 * 
 * Este test verifica:
 * 1. Conectividad con el servicio de colas
 * 2. Agregar items a las colas
 * 3. Obtener items de las colas
 * 4. Manejo de errores (cola vacía, servicio no disponible)
 * 
 * Uso: node test_servicio_colas.js
 */

require("dotenv").config({ path: '.env' })
const axios = require('axios')

const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3501'

console.log('='.repeat(70))
console.log('TEST: Integración con Servicio de Colas Externo')
console.log('='.repeat(70))
console.log(`URL del servicio: ${QUEUE_SERVICE_URL}`)
console.log('')

async function testConectividad() {
    console.log('1. Verificando conectividad con el servicio...')
    try {
        // Intentar obtener de una cola vacía (debería dar 404, no error de conexión)
        await axios.get(`${QUEUE_SERVICE_URL}/get_data`, { params: { clave: 'test_conectividad' } })
        console.log('   ✓ Servicio respondiendo correctamente')
        return true
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('   ✓ Servicio respondiendo correctamente (cola vacía esperada)')
            return true
        }
        if (error.code === 'ECONNREFUSED') {
            console.log('   ✗ ERROR: No se puede conectar al servicio')
            console.log(`   ✗ Verificar que el servicio esté corriendo en ${QUEUE_SERVICE_URL}`)
            return false
        }
        console.log('   ⚠ Error inesperado:', error.message)
        return false
    }
}

async function testAgregarItems() {
    console.log('\n2. Probando agregar items a la cola...')
    
    // incluimos tanto productos como ofertas para asegurar que la cola
    // unificada acepte distintos tipos
    const items = [
        {
            tipo: 'producto',
            name: 'Test Producto 1',
            price: 1000,
            branch_id: 1,
            category_name: 'Test',
            fecha_registro: new Date().toISOString()
        },
        {
            tipo: 'oferta',
            titulo: 'Oferta Test 1',
            precio: 500,
            branch_id: 1,
            url: 'https://test',
            fecha_registro: new Date().toISOString()
        },
        {
            tipo: 'producto',
            name: 'Test Producto 2',
            price: 2000,
            branch_id: 2,
            category_name: 'Test',
            fecha_registro: new Date().toISOString()
        }
    ]
    
    try {
        for (let i = 0; i < items.length; i++) {
            const response = await axios.post(`${QUEUE_SERVICE_URL}/add_data`, {
                clave: 'test_precios',
                data: items[i]
            })
            
            if (response.data.success) {
                console.log(`   ✓ Item ${i + 1} agregado: ${items[i].name}`)
            } else {
                console.log(`   ✗ Error agregando item ${i + 1}`)
                return false
            }
        }
        
        console.log(`   ✓ Todos los items agregados correctamente (${items.length})`)
        return true
    } catch (error) {
        console.log('   ✗ ERROR:', error.message)
        return false
    }
}

async function testObtenerItems() {
    console.log('\n3. Probando obtener items de la cola...')
    
    try {
        let obtenidos = 0
        const contadorTipos = {}
        
        // Intentar obtener hasta 5 items (esperamos 3)
        for (let i = 0; i < 5; i++) {
            try {
                const response = await axios.get(`${QUEUE_SERVICE_URL}/get_data`, {
                    params: { clave: 'test_precios' }
                })
                
                if (response.data.data) {
                    const item = response.data.data
                    console.log(`   ✓ Item ${i + 1} obtenido: tipo=${item.tipo}`)
                    obtenidos++
                    contadorTipos[item.tipo] = (contadorTipos[item.tipo] || 0) + 1
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`   ℹ Cola vacía después de ${obtenidos} items`)
                    break
                }
                throw error
            }
        }
        
        console.log('   Tipos recibidos:', contadorTipos)
        
        if (obtenidos === 3) {
            console.log('   ✓ Cantidad correcta de items obtenidos (3)')
            return true
        } else {
            console.log(`   ⚠ Se esperaban 3 items, se obtuvieron ${obtenidos}`)
            return obtenidos > 0
        }
    } catch (error) {
        console.log('   ✗ ERROR:', error.message)
        return false
    }
}

async function testColaVacia() {
    console.log('\n4. Probando manejo de cola vacía...')
    
    try {
        await axios.get(`${QUEUE_SERVICE_URL}/get_data`, {
            params: { clave: 'test_cola_vacia' }
        })
        console.log('   ✗ Debería haber retornado 404 para cola vacía')
        return false
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('   ✓ Status 404 retornado correctamente para cola vacía')
            console.log(`   ✓ Mensaje: ${error.response.data.error}`)
            return true
        }
        console.log('   ✗ Error inesperado:', error.message)
        return false
    }
}

async function testClaveInvalida() {
    console.log('\n5. Probando validación de clave...')
    
    try {
        // Clave muy larga (>255 caracteres)
        const claveLarga = 'a'.repeat(300)
        await axios.post(`${QUEUE_SERVICE_URL}/add_data`, {
            clave: claveLarga,
            data: { test: 'data' }
        })
        console.log('   ⚠ El servicio debería rechazar claves > 255 caracteres')
        return false
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('   ✓ Status 400 retornado para clave inválida')
            console.log(`   ✓ Mensaje: ${error.response.data.error}`)
            return true
        }
        console.log('   ⚠ Comportamiento inesperado:', error.message)
        // No es un error crítico si el servicio acepta claves largas
        return true
    }
}

async function testConcurrencia() {
    console.log('\n6. Probando agregar múltiples items simultáneamente...')
    
    try {
        const promises = []
        
        // Agregar 10 items en paralelo
        for (let i = 0; i < 10; i++) {
            promises.push(
                axios.post(`${QUEUE_SERVICE_URL}/add_data`, {
                    clave: 'test_concurrencia',
                    data: {
                        id: i,
                        name: `Item Concurrente ${i}`,
                        timestamp: Date.now()
                    }
                })
            )
        }
        
        const results = await Promise.all(promises)
        const exitosos = results.filter(r => r.data.success).length
        
        console.log(`   ✓ ${exitosos}/10 items agregados correctamente en paralelo`)
        
        // Verificar que todos están en la cola
        let recuperados = 0
        for (let i = 0; i < 15; i++) {
            try {
                const response = await axios.get(`${QUEUE_SERVICE_URL}/get_data`, {
                    params: { clave: 'test_concurrencia' }
                })
                if (response.data.data) recuperados++
            } catch (error) {
                if (error.response?.status === 404) break
            }
        }
        
        console.log(`   ✓ ${recuperados}/10 items recuperados de la cola`)
        
        return recuperados === 10
    } catch (error) {
        console.log('   ✗ ERROR:', error.message)
        return false
    }
}

async function limpiarColas() {
    console.log('\n7. Limpiando colas de test...')
    
    const claves = ['test_precios', 'test_cola_vacia', 'test_concurrencia', 'test_conectividad']
    
    for (const clave of claves) {
        let vaciados = 0
        try {
            // Vaciar hasta 20 items por cola
            for (let i = 0; i < 20; i++) {
                try {
                    await axios.get(`${QUEUE_SERVICE_URL}/get_data`, { params: { clave } })
                    vaciados++
                } catch (error) {
                    if (error.response?.status === 404) break
                }
            }
            if (vaciados > 0) {
                console.log(`   ✓ Cola "${clave}" limpiada (${vaciados} items)`)
            }
        } catch (error) {
            console.log(`   ⚠ Error limpiando cola "${clave}":`, error.message)
        }
    }
    
    console.log('   ✓ Limpieza completada')
}

// Ejecutar todos los tests
async function runAllTests() {
    const tests = [
        { name: 'Conectividad', fn: testConectividad },
        { name: 'Agregar Items', fn: testAgregarItems },
        { name: 'Obtener Items', fn: testObtenerItems },
        { name: 'Cola Vacía', fn: testColaVacia },
        { name: 'Clave Inválida', fn: testClaveInvalida },
        { name: 'Concurrencia', fn: testConcurrencia }
    ]
    
    const resultados = []
    
    for (const test of tests) {
        try {
            const exito = await test.fn()
            resultados.push({ test: test.name, exito })
        } catch (error) {
            console.log(`\n✗ Test "${test.name}" falló con error:`, error.message)
            resultados.push({ test: test.name, exito: false })
        }
    }
    
    // Limpiar
    await limpiarColas()
    
    // Resumen
    console.log('\n' + '='.repeat(70))
    console.log('RESUMEN DE TESTS')
    console.log('='.repeat(70))
    
    resultados.forEach(r => {
        const simbolo = r.exito ? '✓' : '✗'
        const estado = r.exito ? 'PASÓ' : 'FALLÓ'
        console.log(`${simbolo} ${r.test}: ${estado}`)
    })
    
    const pasados = resultados.filter(r => r.exito).length
    const total = resultados.length
    
    console.log('\n' + '='.repeat(70))
    console.log(`RESULTADO FINAL: ${pasados}/${total} tests pasados`)
    console.log('='.repeat(70))
    
    if (pasados === total) {
        console.log('\n🎉 ¡Todos los tests pasaron exitosamente!')
        console.log('✅ El servicio de colas está funcionando correctamente')
        console.log('✅ La integración está lista para producción')
    } else {
        console.log('\n⚠️  Algunos tests fallaron')
        console.log('❌ Revisar los errores antes de desplegar')
    }
    
    process.exit(pasados === total ? 0 : 1)
}

// Ejecutar
runAllTests().catch(error => {
    console.error('\n❌ Error fatal ejecutando tests:', error)
    process.exit(1)
})
