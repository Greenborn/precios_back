# Changelog - Migración a Servicio de Colas Externo

**Fecha:** 30 de diciembre de 2025

---

## 🎯 Objetivo

Migrar el sistema de colas de importación desde arreglos locales en memoria a un servicio externo independiente para mejorar la persistencia, escalabilidad y monitoreo.

---

## 🔄 Cambios Implementados

### 1. Configuración

#### `env.example`
```diff
+ # --- Servicio de Colas ---
+ QUEUE_SERVICE_URL=http://localhost:3501  # URL base del servicio de colas externo
```

**Acción requerida:** Agregar la variable `QUEUE_SERVICE_URL` en el archivo `.env`

---

### 2. Routes - `back/routes/productos.js`

#### Nuevas Dependencias
```diff
+ const axios = require('axios')
```

#### Configuración del Servicio
```javascript
// Configuración del servicio de colas
const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3501'
```

#### Funciones Helper Agregadas

1. **`agregarACola(clave, data)`**
   - Envía items al servicio de colas vía POST `/add_data`
   - Manejo de errores con logging
   - Retorna `true/false` según éxito

2. **`obtenerDeCola(clave)`**
   - Obtiene items del servicio vía GET `/get_data`
   - Elimina el item de la cola automáticamente
   - Maneja status 404 (cola vacía) sin error
   - Retorna el item o `null`

3. **`contarItemsCola(clave)`**
   - Consulta cantidad de items vía GET `/count_data`
   - Para monitoreo y debugging
   - Retorna número o `0` en caso de error

---

### 3. Procesamiento de Cola de Productos

#### Antes
```javascript
const colaProcProductos = []
const idCola = "productos"

setInterval(async () => {
    await processing.procesarColaProc(idCola, colaProcProductos, async (item) => {
        return await procesa_item(item, HOY)
    }, async () => {
        // onEmpty callback
    });
}, 2000);
```

#### Después
```javascript
const idColaProductos = "productos"

setInterval(async () => {
    // Limpieza de estadísticas
    await global.knex("estadistica_aumento_diario")
        .where('fecha_utlimo_precio', '<', HOY_ARG).del();
    
    // Procesar items de la cola externa
    let procesados = 0;
    const MAX_ITEMS_PERIODO = 50;
    
    while (procesados < MAX_ITEMS_PERIODO) {
        const item = await obtenerDeCola(idColaProductos);
        if (!item) break;
        
        try {
            await procesa_item(item, HOY)
            procesados++;
        } catch (error) {
            // Reintentar más tarde
            await agregarACola(idColaProductos, item);
            break;
        }
    }
}, 2000);
```

**Cambios clave:**
- ❌ Eliminado: `colaProcProductos` array local
- ❌ Eliminado: Uso de `processing.procesarColaProc()`
- ✅ Agregado: Loop manual con control de límite
- ✅ Agregado: Obtención de items del servicio externo
- ✅ Agregado: Lógica de reintento en caso de error

---

### 4. Procesamiento de Cola de Ofertas

#### Antes
```javascript
let colaProcOfertas = []

setInterval(async()=>{
    await processing.procesarColaProc("ofertas", colaProcOfertas, async (item) => {
        return await procesar_oferta(global.knex, item, HOY, AYER)
    })
}, 2000)
```

#### Después
```javascript
const idColaOfertas = "ofertas"

setInterval(async()=>{
    // Limpieza de promociones antiguas
    await global.knex("promociones_hoy").where('fecha', '<', HOY).del()
    
    // Procesar items de la cola externa
    let procesados = 0;
    const MAX_ITEMS_PERIODO = 50;
    
    while (procesados < MAX_ITEMS_PERIODO) {
        const item = await obtenerDeCola(idColaOfertas);
        if (!item) break;
        
        try {
            await procesar_oferta(global.knex, item, HOY, AYER)
            procesados++;
        } catch (error) {
            await agregarACola(idColaOfertas, item);
            break;
        }
    }
}, 2000)
```

**Cambios clave:**
- ❌ Eliminado: `colaProcOfertas` array local
- ✅ Agregado: Lógica similar a cola de productos

---

### 5. Endpoint `/importar`

#### Antes
```javascript
ARR_IMPORTA.forEach((item) => {
    colaProcProductos.push(item);
});
console.log(`[importar] Se agregaron ${ARR_IMPORTA.length} items a la cola. Tamaño actual:`, colaProcProductos.length);
res.status(200).send({ stat: true, count: ARR_IMPORTA.length });
```

#### Después
```javascript
let agregados = 0;
for (const item of ARR_IMPORTA) {
    const success = await agregarACola(idColaProductos, item);
    if (success) agregados++;
}

console.log(`[importar] Se agregaron ${agregados}/${ARR_IMPORTA.length} items a la cola.`);
res.status(200).send({ stat: true, count: agregados });
```

**Mejoras:**
- ✅ Contador de items agregados exitosamente
- ✅ Información de fallos en la respuesta
- ✅ Manejo asíncrono con `await`

---

### 6. Endpoint `/importar_oferta`

#### Antes
```javascript
for (let index = 0; index < ARR_IMPORTA.length; index++) {
    const item = ARR_IMPORTA[index]
    colaProcOfertas.push(item)
}

return res.status(200).send({ stat: true })
```

#### Después
```javascript
let agregados = 0;
for (let index = 0; index < ARR_IMPORTA.length; index++) {
    const item = ARR_IMPORTA[index]
    const success = await agregarACola(idColaOfertas, item)
    if (success) agregados++;
}

console.log(`[importar_oferta] Se agregaron ${agregados}/${ARR_IMPORTA.length} ofertas a la cola.`)
return res.status(200).send({ stat: true, count: agregados })
```

**Mejoras:** Iguales al endpoint `/importar`

---

## 📊 Comparativa

| Aspecto | Antes (Arreglos Locales) | Después (Servicio Externo) |
|---------|--------------------------|----------------------------|
| **Persistencia** | ❌ Se pierde al reiniciar | ✅ Depende del servicio |
| **Escalabilidad** | ❌ Una instancia | ✅ Múltiples instancias |
| **Monitoreo** | ❌ Solo logs internos | ✅ API externa consultable |
| **Memoria** | ❌ Crece sin límite | ✅ Gestionada por servicio |
| **Recuperación** | ❌ Manual | ✅ Reintentos automáticos |
| **Debugging** | ⚠️ Difícil | ✅ Endpoints de debug |

---

## 🚨 Consideraciones de Despliegue

### Prerrequisitos

1. **Servicio de Colas Activo**
   ```bash
   # El servicio debe estar corriendo en:
   http://localhost:3501
   ```

2. **Variable de Entorno Configurada**
   ```bash
   echo "QUEUE_SERVICE_URL=http://localhost:3501" >> .env
   ```

3. **Dependencias Instaladas**
   ```bash
   npm install  # axios ya está en package.json
   ```

### Orden de Inicio

```bash
# 1. Iniciar servicio de colas
cd extra_services/queue_service
npm start

# 2. Verificar que esté activo
curl http://localhost:3501/health  # O endpoint equivalente

# 3. Iniciar backend
cd back
npm start
```

### Testing

```bash
# Test de integración
node test_servicio_colas.js  # (Crear si es necesario)

# Verificar colas vacías
curl "http://localhost:3501/get_data?clave=productos"
# Esperado: { error: 'No hay datos para la clave' }

curl "http://localhost:3501/get_data?clave=ofertas"
# Esperado: { error: 'No hay datos para la clave' }
```

---

## 🔧 Rollback

Si es necesario volver al sistema anterior:

1. **Revertir `productos.js`:**
   ```bash
   git checkout HEAD~1 back/routes/productos.js
   ```

2. **Eliminar variable de entorno:**
   ```bash
   # Comentar en .env:
   # QUEUE_SERVICE_URL=http://localhost:3501
   ```

3. **Reiniciar servidor:**
   ```bash
   npm start
   ```

---

## 📝 Archivos Afectados

- ✅ `env.example` - Nueva variable de configuración
- ✅ `back/routes/productos.js` - Lógica de colas reescrita
- ✅ `back/documentacion/servicio_colas_externo.md` - Documentación nueva
- ✅ `back/CHANGELOG_servicio_colas.md` - Este archivo

---

## ✅ Checklist Post-Implementación

- [ ] Servicio de colas desplegado y funcionando
- [ ] Variable `QUEUE_SERVICE_URL` agregada al `.env`
- [ ] Backend reiniciado correctamente
- [ ] Tests de importación ejecutados exitosamente
- [ ] Monitoreo de logs sin errores por 24 horas
- [ ] Documentación compartida con el equipo
- [ ] Plan de rollback validado

---

## 🔮 Próximos Pasos

1. Implementar métricas de rendimiento
2. Agregar dashboard de monitoreo de colas
3. Implementar circuit breaker para fallos del servicio
4. Configurar alertas para colas con crecimiento anormal
5. Evaluar otros componentes para migrar a colas externas

---

## 👥 Contacto

Para dudas o problemas con esta migración, consultar:
- Documentación: `back/documentacion/servicio_colas_externo.md`
- Código: `back/routes/productos.js`
