# Servicio de Colas Externo

## 📋 Descripción

El sistema de importación ahora utiliza un servicio externo de colas que se encarga tanto del almacenamiento como del procesamiento de los datos. El backend actúa únicamente como proxy, enviando los datos al servicio externo.

## 🎯 Arquitectura

**Backend (routes/productos.js):**
- ✅ Recibe peticiones de importación
- ✅ Valida KEY y datos
- ✅ Envía datos al servicio de colas (POST /add_data)
- ❌ **NO** procesa colas localmente
- ❌ **NO** tiene setInterval de procesamiento

**Servicio Externo (puerto 3501):**
- ✅ Almacena datos en colas
- ✅ Procesa items de las colas
- ✅ Ejecuta `procesar_articulo()` y `procesar_oferta()`
- ✅ Actualiza base de datos
- ✅ Maneja reintentos y errores

## 💡 Beneficios

- ✅ **Persistencia**: Los datos en cola no se pierden si el servidor se reinicia
- ✅ **Escalabilidad**: Múltiples instancias del backend pueden enviar datos
- ✅ **Monitoreo**: Posibilidad de consultar el estado de las colas externamente
- ✅ **Desacoplamiento**: Procesamiento completamente separado del backend API
- ✅ **Simplicidad**: El backend solo envía datos, sin lógica compleja de procesamiento

---

## 🔧 Configuración

### Variables de Entorno

Agregar en el archivo `.env`:

```bash
QUEUE_SERVICE_URL=http://localhost:3501
```

**Nota:** El servicio de colas debe estar ejecutándose en el puerto especificado antes de iniciar el backend.

---

## 🚀 API del Servicio de Colas

### Agregar Item a la Cola

**Endpoint:** `POST /add_data`

**Body (JSON):**
```json
{
  "clave": "productos",
  "data": {
    "name": "Producto X",
    "price": 1000,
    "branch_id": 5
  }
}
```

**Respuestas:**
- `200`: `{ success: true }`
- `400`: `{ error: 'Clave inválida' }`

### Obtener y Eliminar Item de la Cola

**Endpoint:** `GET /get_data?clave=productos`

**Parámetros Query:**
- `clave`: Nombre de la cola (máx 255 caracteres)

**Respuestas:**
- `200`: `{ data: {...} }` - Retorna el último item y lo elimina
- `400`: `{ error: 'Clave inválida' }`
- `404`: `{ error: 'No hay datos para la clave' }` - Cola vacía

### Contar Items (Opcional)

**Endpoint:** `GET /count_data?clave=productos`

**Parámetros Query:**
- `clave`: Nombre de la cola

**Respuestas:**
- `200`: `{ count: 42 }`
- `400`: `{ error: 'Clave inválida' }`

---

## 📦 Colas Utilizadas

El sistema utiliza dos colas principales:

### 1. Cola de Productos (`productos`)

**Uso:** Importación de productos y precios

**Procesamiento:** El servicio externo se encarga del procesamiento

**Alimentada por:** 
- Endpoint `/importar` - Importación masiva de productos

**Datos esperados:**
```json
{
  "name": "string",
  "price": "number",
  "branch_id": "number",
  "category_name": "string",
  "fecha_registro": "Date",
  "vendor_id": "string (opcional)",
  "barcode": "string (opcional)",
  "description": "string (opcional)",
  "url": "string (opcional)",
  "nota": "string (opcional)"
}
```

### 2. Cola de Ofertas (`ofertas`)

**Uso:** Importación de promociones y ofertas

**Procesamiento:** El servi (al backend)
   └─> Validación de KEY
   └─> Validación de ARR_IMPORTA
   
2. Backend → POST {QUEUE_SERVICE_URL}/add_data
   └─> clave: "productos"
   └─> data: cada item del array
   └─> Responde al cliente con { stat: true, count: N }
   
3. Servicio Externo (procesamiento automático)
   └─> Obtiene items de la cola
   └─> procesa_item() → procesar_articulo()
   └─> Actualiza base de datos
   └─> Actualiza estadísticas
   └─> Actualiza buscador en tiempo real
```

### Importación de Ofertas

```
1. Cliente → POST /importar_oferta (al backend)
   └─> Validación de KEY
   └─> Validación de ARR_IMPORTA
   
2. Backend → POST {QUEUE_SERVICE_URL}/add_data
   └─> clave: "ofertas"
   └─> data: cada item del array
   └─> Responde al cliente con { stat: true, count: N }
   
3. Servicio Externo (procesamiento automático)
   └─> Obtiene items de la cola
   └─> procesar_oferta()
   └─> Actualiza base de datos
   └─> Actualiza estadísticas de promocioneray
   
3. setInterval (cada 2s)
   └─> GET {QUEUE_SERVICE_URL}/get_data?clave=productos
   └─> Procesar hasta 50 items
   └─> procesa_item() → procesar_articulo()
**Única función del backend.** Envía un item a la cola externa para que el servicio externo lo procese.

**Parámetros:**
- `clave`: Nombre de la cola (`"productos"` o `"ofertas"`)
- `data`: Objeto con los datos del item

**Retorna:**
- `true`: Item agregado correctamente al servicio externo
- `false`: Error al comunicarse con el servicio

**Implementación:**
```javascript
async function agregarACola(clave, data) {
    try {
        await axios.post(`${QUEUE_SERVICE_URL}/add_data`, { clave, data })
        return true
    } catch (error) {
        console.error(`[Cola ${clave}] Error al agregar item:`, error.message)
        return false
    }
}
```

**Ejemplo de uso:**
```javascript
const success = await agregarACola("productos", {
    name: "Leche La Serenísima 1L",
    price: 850,
    branch_id: 10,
    category_name: "Lácteos",
    fecha_registro: new Date()
})

if (success) {
    console.log('Item enviado al servicio de colas')
} else {
    console.error('Error al enviar item')
}
```
Obtiene y elimina el último item de la cola.

**Parámetros:**
- `clave`: Nombre de la cola

**Retorna:**
- `Object`: Item obtenido
- `null`: No hay items o error

**Ejemplo:**
```javascript
const item = await obtenerDeCola("productos")
if (item) {
    await procesa_item(item, HOY)
}
```

### `contarItemsCola(clave)`

Cuenta los items pendientes en la cola (si el servicio lo soporta).

**Parámetros:**
- `clave`: Nombre de la cola

**Retorna:**
- `Number`: Cantidad de items
- `0`: Error o cola vacía

---

## 🚨 Manejo de Errores

### Reconexión Automática

Si el servicio de colas no está disponible:

1. **Al agregar items:** 
   - Se registra el error en consola
   - Retorna `false` al endpoint
   - El cliente recibe el conteo de items agregados exitosamente
En el Backend

Si el servicio de colas no está disponible:

**Al agregar items:** 
- Se registra el error en consola: `[Cola productos] Error al agregar item: ECONNREFUSED`
- Retorna `false` al endpoint
- El cliente recibe el conteo de items agregados exitosamente vs. fallidos

**Ejemplo de respuesta:**
```json
{
  "stat": true,
  "count": 95  // De 100 enviados, 95 fueron aceptados
}
```

### En el Servicio Externo

El servicio externo es responsable de:

- ✅ Procesar items de la cola
- ✅ Reintentar items fallidos
- ✅ Registrar errores de procesamiento
- ✅ Actualizar estadísticas
- ✅ Mantener logs de operaciones

**El backend NO tiene lógica de reintentos** - esta responsabilidad es del servicio externo.
[productos] Iniciando procesamiento de la cola.
[productos] Procesando item #1.
[productos] Procesando item #2.
...en el Backend (solo envío)

```
[importar] Se agregaron 100/100 items a la cola.
[importar_oferta] Se agregaron 25/30 ofertas a la cola.
```

En caso de error:
```
[Cola productos] Error al agregar item: connect ECONNREFUSED 127.0.0.1:3501
[importar] Se agregaron 0/100 items a la cola.
```

### Logs en el Servicio Externo (procesamiento)

El servicio externo debe implementar sus propios logs de procesamiento:
- Items obtenidos de la cola
- Items procesados exitosamente
- Errores durante el procesamiento
- Estadísticas actualizadas
- Tiempo de procesamiento Rendimiento

- **Límite por ciclo:** 50 items cada 2 segundos = ~1500 items/minuto
- **Si la cola crece:** Los items se procesan en orden LIFO (último en entrar, primero en salir)
sponsabilidades

**Backend:**
- ✅ Validar datos de entrada (KEY, formato)
- ✅ Enviar datos al servicio externo
- ✅ Informar al cliente sobre éxito/fracaso del envío
- ❌ **NO** procesa ninguna cola
- ❌ **NO** interactúa con la base de datos para importación

**Servicio Externo:**
- ✅ Almacenar items en colas
- ✅ Procesar items (ejecutar lógica de importación)
- ✅ Actualizar base de datos
- ✅ Manejar reintentos y errores
- ✅ Actualizar estadísticas
- ✅ Mantener logs de procesamiento

### Persistencia

- Los datos en la cola dependen del servicio externo
- El servicio debe tener persistencia o tolerancia a fallos
- Si el servicio se reinicia, debe recuperar colas pendientes

### Escalabilidad

- ✅ Múltiples instancias del backend pueden enviar datos al mismo servicio
- ⚠️ El servicio externo debe manejar concurrencia correctamente
- ⚠️ Considerar usar locks/transacciones para evitar procesamiento duplicado

### Verificar Estado de la Cola

```bash
# Contar items en cola de productos
curl "http://localhost:3501/count_data?clave=productos"

# Contar items en cola de ofertas
curl "http://localhost:3501/count_data?clave=ofertas"
```

### Agregar Item de Prueba

```bash
curl -X POST http://localhost:3501/add_data \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "productos",
    "data": {
      "name": "Test Product",
      "price": 100,
      "branch_id": 1,
      "category_name": "Test",
      "fecha_registro": "2025-12-30T00:00:00.000Z"
    }
  }'
```

### Obtener Item de Prueba

```bash
curl "http://localhost:3501/get_data?clave=productos"
```

---
en `setInterval` | **ELIMINADO** - Lo hace el servicio |
| Procesamiento | `setInterval` con `processing.procesarColaProc()` | **ELIMINADO** - Lo hace el servicio |

### Archivos Modificados

1. ✅ [env.example](../../env.example) - Variable `QUEUE_SERVICE_URL`
2. ✅ [routes/productos.js](../routes/productos.js) - Solo envío, sin procesamiento
3. ⚠️ [helpers/processing.js](../helpers/processing.js) - Ya no se usa para importación

### Código Eliminado del Backend

- ❌ `setInterval` de procesamiento de productos
- ❌ `setInterval` de procesamiento de ofertas
- ❌ `procesa_item()` function
- ❌ `procesar_oferta()` function
- ❌ `obtenerDeCola()` helper
- ❌ `contarItemsCola()` helper
- ❌ Limpieza de `estadistica_aumento_diario` en backend
- ❌ Limpieza de `promociones_hoy` en backend

**Nota:** Estas funciones deben implementarse en el servicio externo
### Archivos Modificados

1. ✅ [env.example](../../env.example) - Variable `QUEUE_SERVICE_URL`
2. ✅ [routes/productos.js](../routes/productos.js) - Integración con servicio
3. ⚠️ [helpers/processing.js](../helpers/processing.js) - Ya no se usa para colas externas

### Retrocompatibilidad

El módulo `processing.js` se mantiene para otros usos potenciales, pero ya no se utiliza en la importación de productos y ofertas.

---

## 📝 TODO

- [ ] Implementar endpoint para monitorear el estado de las colas
- [ ] Agregar métricas de tiempo de procesamiento
- [ ] Implementar circuit breaker si el servicio falla
- [ ] Agregar retry exponencial para errores temporales
- [ ] Documentar el servicio de colas externo en detalle
