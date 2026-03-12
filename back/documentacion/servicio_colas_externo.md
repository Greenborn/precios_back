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
- ✅ Procesa items de la cola `precios` según el campo `tipo`
- ✅ Invoca las rutinas `procesar_articulo()`, `procesar_oferta()` u otras
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

## 📦 Cola utilizada

A partir de la actualización de marzo de 2026 la API envía todos los elementos de
precios (productos, ofertas o futuras acciones) a una única cola llamada
`precios`. El valor del campo `tipo` dentro del objeto determina cómo será
procesado por el servicio externo.

### Estructura básica de cada item
```json
{
  "tipo": "producto" | "oferta" | "accion", // obligatorio
  "fecha_registro": "Date|string",            // obligatorio
  // ... demás propiedades específicas según el tipo
}
```

### Ejemplos de uso
**Producto:**
```json
{
  "tipo": "producto",
  "name": "Leche La Serenísima 1L",
  "price": 850,
  "branch_id": 10,
  "category_name": "Lácteos",
  "fecha_registro": "2025-12-30T15:00:00.000Z"
}
```

**Oferta:**
```json
{
  "tipo": "oferta",
  "titulo": "Oferta especial",
  "precio": 500,
  "branch_id": 5,
  "url": "https://...",
  "fecha_registro": "2025-12-30T15:00:00.000Z"
}
```

### Flujo simplificado
1. Cliente → Backend (`/importar` ó `/importar_oferta`)
   - el backend valida KEY y datos, agrega la propiedad `tipo` y reenvía al
     servicio externo
2. Backend → `POST {QUEUE_SERVICE_URL}/add_data` con
   `clave: "precios"` y el objeto completo
3. Servicio externo procesa items en la cola `precios` y, según `tipo`, llama a
   la rutina correspondiente (`procesarProducto`, `procesarOferta`, etc.)
4. El servicio actualiza la base de datos, estadísticas y maneja reintentos.

> Un solo canal de entrada permite escalar más fácilmente y añadir nuevos tipos
> sin tocar el backend.


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
- ❌ `procesar_oferta()` function (parte del código backend ya no se usa)
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
