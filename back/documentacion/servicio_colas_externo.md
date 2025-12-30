# Servicio de Colas Externo

## 📋 Descripción

El sistema de importación ahora utiliza un servicio externo de colas en lugar de arreglos locales en memoria. Esto permite:

- ✅ **Persistencia**: Los datos en cola no se pierden si el servidor se reinicia
- ✅ **Escalabilidad**: Múltiples instancias del backend pueden compartir la misma cola
- ✅ **Monitoreo**: Posibilidad de consultar el estado de las colas externamente
- ✅ **Desacoplamiento**: El procesamiento de colas está separado del almacenamiento

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

**Items procesados por:** `setInterval` cada 2 segundos en [productos.js:106-145](../routes/productos.js#L106-L145)

**Límite de procesamiento:** 50 items por ciclo

**Alimentada por:** 
- Endpoint `/importar` - Importación masiva de productos

### 2. Cola de Ofertas (`ofertas`)

**Uso:** Importación de promociones y ofertas

**Items procesados por:** `setInterval` cada 2 segundos en [productos.js:304-340](../routes/productos.js#L304-L340)

**Límite de procesamiento:** 50 items por ciclo

**Alimentada por:**
- Endpoint `/importar_oferta` - Importación de ofertas

---

## 🔄 Flujo de Procesamiento

### Importación de Productos

```
1. Cliente → POST /importar
   └─> Validación de KEY
   └─> Validación de ARR_IMPORTA
   
2. Backend → POST {QUEUE_SERVICE_URL}/add_data
   └─> clave: "productos"
   └─> data: cada item del array
   
3. setInterval (cada 2s)
   └─> GET {QUEUE_SERVICE_URL}/get_data?clave=productos
   └─> Procesar hasta 50 items
   └─> procesa_item() → procesar_articulo()
   └─> Actualizar estadísticas
```

### Importación de Ofertas

```
1. Cliente → POST /importar_oferta
   └─> Validación de KEY
   └─> Validación de ARR_IMPORTA
   
2. Backend → POST {QUEUE_SERVICE_URL}/add_data
   └─> clave: "ofertas"
   └─> data: cada item del array
   
3. setInterval (cada 2s)
   └─> GET {QUEUE_SERVICE_URL}/get_data?clave=ofertas
   └─> Procesar hasta 50 items
   └─> procesar_oferta()
   └─> Actualizar estadísticas
```

---

## 🛠️ Funciones Helper

### `agregarACola(clave, data)`

Agrega un item a la cola externa.

**Parámetros:**
- `clave`: Nombre de la cola (`"productos"` o `"ofertas"`)
- `data`: Objeto con los datos del item

**Retorna:**
- `true`: Item agregado correctamente
- `false`: Error al agregar

**Ejemplo:**
```javascript
const success = await agregarACola("productos", {
    name: "Leche La Serenísima 1L",
    price: 850,
    branch_id: 10,
    category_name: "Lácteos",
    fecha_registro: new Date()
})
```

### `obtenerDeCola(clave)`

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

2. **Al obtener items:**
   - Se registra el error en consola
   - Retorna `null`
   - El procesador espera al siguiente ciclo (2 segundos)

### Reintentos

Si un item falla al procesarse:

```javascript
catch (error) {
    console.error(`[Cola] Error procesando item, reintentando...`, error);
    // Reintroduce el item en la cola
    await agregarACola(clave, item);
    break; // Salir del ciclo para no bloquear
}
```

---

## 📊 Monitoreo

### Logs de Procesamiento

```
[productos] Iniciando procesamiento de la cola.
[productos] Procesando item #1.
[productos] Procesando item #2.
...
[productos] Fin de ciclo. Items procesados: 50
```

### Logs de Importación

```
[importar] Se agregaron 100/100 items a la cola.
[importar_oferta] Se agregaron 25/30 ofertas a la cola.
```

---

## ⚠️ Consideraciones

### Rendimiento

- **Límite por ciclo:** 50 items cada 2 segundos = ~1500 items/minuto
- **Si la cola crece:** Los items se procesan en orden LIFO (último en entrar, primero en salir)

### Persistencia

- Los datos en la cola dependen del servicio externo
- Si el servicio se reinicia, verificar que tenga persistencia implementada

### Escalabilidad

- Múltiples instancias del backend pueden competir por items
- El servicio debe manejar concurrencia correctamente
- Considerar usar locks o transacciones en el servicio de colas

---

## 🔍 Debugging

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

## 🔄 Migración desde Arreglos Locales

### Cambios Realizados

| Componente | Antes | Después |
|------------|-------|---------|
| Almacenamiento | `colaProcProductos = []` | Servicio externo puerto 3501 |
| Agregar items | `colaProcProductos.push(item)` | `await agregarACola("productos", item)` |
| Obtener items | `cola.shift()` | `await obtenerDeCola("productos")` |
| Procesamiento | `processing.procesarColaProc()` | Loop manual con `while` |

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
