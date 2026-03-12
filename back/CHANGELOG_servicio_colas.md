# Changelog - Migración a Servicio de Colas Externo

**Fecha:** 30 de diciembre de 2025  
**Versión:** 2.0 - Solo envío, sin procesamiento local

---

## 🎯 Objetivo

Migrar el sistema de importación a una arquitectura completamente desacoplada donde:
- **Backend:** Solo envía datos al servicio de colas (actúa como proxy)
- **Servicio Externo:** Almacena y procesa todos los datos


---

## 📅 2026-03-12 - Unificación de colas

Se decidió consolidar los mensajes de productos y ofertas en una **única cola** llamada
`precios`. Cada elemento enviado ahora incluye un campo adicional `tipo` que permite distinguir
su naturaleza (`producto`, `oferta`, y en el futuro `accion`, etc.).

Cambios principales:

- Los endpoints `/importar` y `/importar_oferta` usan ahora la misma clave `precios`.
- Se agrega el atributo `tipo` a cada objeto antes de encolarlo.
- Se deprecó el uso de claves separadas (`productos`, `ofertas`) en el backend.
- Actualización de tests y documentación para reflejar la nueva estructura.

Este ajuste simplifica la gestión de la cola y permite escalabilidad cuando se agreguen más
tipos de datos.

---

## 🎯 Objetivo

Migrar el sistema de importación a una arquitectura completamente desacoplada donde:
- **Backend:** Solo envía datos al servicio de colas (actúa como proxy)
- **Servicio Externo:** Almacena y procesa todos los datos

---

## 🏗️ Arquitectura Final

```
Cliente
   ↓ POST /importar
Backend (API)
   ↓ POST /add_data (solo envío)
Servicio de Colas (puerto 3501)
   ↓ Procesamiento automático
   ↓ Actualización BD
Base de Datos
```

**Responsabilidades:**

| Componente | Responsabilidad |
|------------|-----------------|
| **Backend** | Validar y enviar datos |
| **Servicio Externo** | Almacenar, procesar y persistir |

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

#### Código ELIMINADO (ya no se procesa localmente)

```diff
- async function procesa_item(item, HOY) { ... }
- async function procesar_oferta(trx, item, HOY, AYER) { ... }
- async function obtenerDeCola(clave) { ... }
- async function contarItemsCola(clave) { ... }

- setInterval(async () => {
-     // Procesamiento de cola de productos
-     while (procesados < MAX_ITEMS_PERIODO) {
-         const item = await obtenerDeCola(idColaProductos);
-         await procesa_item(item, HOY)
-     }
- }, 2000);

- setInterval(async () => {
-     // Procesamiento de cola de ofertas
-     while (procesados < MAX_ITEMS_PERIODO) {
-         const item = await obtenerDeCola(idColaOfertas);
-         await procesar_oferta(global.knex, item, HOY, AYER)
-     }
- }, 2000);
```

#### Código MANTENIDO (solo envío)

```javascript
const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3501'

// ÚNICA función helper
async function agregarACola(clave, data) {
    try {
        await axios.post(`${QUEUE_SERVICE_URL}/add_data`, { clave, data })
        return true
    } catch (error) {
        console.error(`[Cola ${clave}] Error al agregar item:`, error.message)
        return false
    }
}

// Identificadores de colas
const idColaProductos = "productos"
const idColaOfertas = "ofertas"
```

**Resultado:** El backend solo envía datos, no procesa nada.

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

| Aspecto | Antes (Arreglos Locales) | Intermedio (v1.0) | Ahora (v2.0) |
|---------|--------------------------|-------------------|--------------|
| **Almacenamiento** | Array en memoria | Servicio externo | Servicio externo |
| **Procesamiento** | En backend (setInterval) | En backend (setInterval) | **En servicio externo** |
| **Backend procesa** | ✅ Sí | ✅ Sí (50 items/2s) | ❌ **NO** |
| **Backend envía** | - | ✅ Sí | ✅ **Solo esto** |
| **Persistencia** | ❌ Se pierde | ✅ En servicio | ✅ En servicio |
| **Escalabilidad** | ❌ 1 instancia | ⚠️ Compiten por items | ✅ **Múltiples envían** |
| **Simplicidad** | ⚠️ Media | ⚠️ Compleja | ✅ **Muy simple** |

---

## 🚨 Consideraciones de Despliegue

### Prerrequisitos
 y PROCESANDO**
   ```bash
   # El servicio debe:
   # - Estar corriendo en puerto 3501
   # - Tener acceso a la base de datos
   # - Implementar la lógica de procesamiento
   # - Ejecutar procesar_articulo() y procesar_oferta()
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
# 1. Iniciar servicio de colas (OBLIGATORIO)
cd extra_services/queue_service
npm start

# 2. Verificar que esté procesando
curl http://localhost:3501/health
# Verificar logs: debe mostrar procesamiento de colas

# 3. Iniciar backend
cd back
npm start
```

**IMPORTANTE:** El backend NO funcionará correctamente si el servicio de colas no está procesando datos. start
```

### Testing

```bash
# Test de integración
node test_servicio_colas.js  # (Crear si es necesario)

# Verificar colas vacías
curl "http://localhost:3501/get_data?clave=productos"
# Es3. Endpoint `/importars para la clave' }

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
### 4. Endpoint `/importar_oferta`
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
