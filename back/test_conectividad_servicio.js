#!/usr/bin/env node

/**
 * Test rápido de conectividad con el servicio de colas
 * 
 * Uso: node test_conectividad_servicio.js
 */

require("dotenv").config({ path: '.env' })
const axios = require('axios')

const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3501'

console.log('='.repeat(70))
console.log('TEST DE CONECTIVIDAD - Servicio de Colas')
console.log('='.repeat(70))
console.log(`URL: ${QUEUE_SERVICE_URL}`)
console.log('')

async function testConectividad() {
    console.log('1. Verificando conectividad...')
    
    try {
        // Intentar agregar un item de prueba
        console.log(`   Enviando POST a ${QUEUE_SERVICE_URL}/add_data`)
        const response = await axios.post(`${QUEUE_SERVICE_URL}/add_data`, {
            clave: 'test_conectividad',
            data: {
                test: true,
                timestamp: new Date().toISOString(),
                mensaje: 'Test de conectividad desde backend'
            }
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        console.log(`   ✓ Respuesta recibida:`)
        console.log(`     Status: ${response.status}`)
        console.log(`     Data:`, response.data)
        
        if (response.data?.success) {
            console.log('')
            console.log('✅ ÉXITO: El servicio está funcionando correctamente')
            console.log('✅ El backend puede comunicarse con el servicio de colas')
            return true
        } else {
            console.log('')
            console.log('⚠️  ADVERTENCIA: El servicio respondió pero no con success:true')
            return false
        }
        
    } catch (error) {
        console.log('')
        console.log('❌ ERROR al conectar con el servicio:')
        
        if (error.code === 'ECONNREFUSED') {
            console.log('')
            console.log('   Causa: No se puede conectar al servicio')
            console.log(`   El servicio NO está corriendo en ${QUEUE_SERVICE_URL}`)
            console.log('')
            console.log('   Solución:')
            console.log('   1. Iniciar el servicio de colas:')
            console.log('      cd extra_services/queue_service')
            console.log('      npm start')
            console.log('')
            console.log('   2. Verificar que el puerto 3501 no esté ocupado:')
            console.log('      lsof -i :3501')
            
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.log('')
            console.log('   Causa: Timeout al conectar')
            console.log('   El servicio no responde en 5 segundos')
            console.log('')
            console.log('   Solución:')
            console.log('   - Verificar que el servicio esté corriendo')
            console.log('   - Verificar que no haya firewall bloqueando')
            
        } else if (error.response) {
            console.log('')
            console.log(`   Status HTTP: ${error.response.status}`)
            console.log(`   Respuesta:`, error.response.data)
            console.log('')
            console.log('   El servicio está activo pero retornó un error')
            
        } else {
            console.log('')
            console.log(`   Error: ${error.message}`)
        }
        
        return false
    }
}

async function testVariablesEntorno() {
    console.log('')
    console.log('2. Verificando configuración...')
    
    if (process.env.QUEUE_SERVICE_URL) {
        console.log(`   ✓ Variable QUEUE_SERVICE_URL definida: ${process.env.QUEUE_SERVICE_URL}`)
    } else {
        console.log(`   ⚠️  Variable QUEUE_SERVICE_URL NO definida`)
        console.log(`   ℹ  Usando valor por defecto: ${QUEUE_SERVICE_URL}`)
        console.log('')
        console.log('   Recomendación: Agregar en .env:')
        console.log('   QUEUE_SERVICE_URL=http://localhost:3501')
    }
}

async function run() {
    await testVariablesEntorno()
    const exito = await testConectividad()
    
    console.log('')
    console.log('='.repeat(70))
    
    if (exito) {
        console.log('RESULTADO: Todo OK ✅')
        console.log('El backend puede comunicarse con el servicio de colas')
        process.exit(0)
    } else {
        console.log('RESULTADO: Hay problemas de conectividad ❌')
        console.log('Revisar los errores arriba y solucionarlos antes de importar datos')
        process.exit(1)
    }
}

run().catch(error => {
    console.error('')
    console.error('❌ Error fatal:', error.message)
    process.exit(1)
})
