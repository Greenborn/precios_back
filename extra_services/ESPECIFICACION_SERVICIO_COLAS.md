# Especificación del Servicio de Colas Externo

## 📋 Resumen

El servicio de colas externo debe:
1. **Recibir** datos del backend vía API REST
2. **Almacenar** datos en colas persistentes
3. **Procesar** automáticamente los datos
4. **Actualizar** la base de datos

---

## 🔌 API REST Requerida

### POST /add_data

Recibe items para agregar a una cola.

**Request:**
```json
POST /add_data
Content-Type: application/json

{
  "clave": "productos",
  "data": {
    "name": "Leche La Serenísima 1L",
    "price": 850,
    "branch_id": 10,
    "category_name": "Lácteos",
    "fecha_registro": "2025-12-30T15:00:00.000Z"
  }
}
```

**Response (éxito):**
```json
{
  "success": true
}
```

**Response (error):**
```json
{
  "error": "Clave inválida"
}
```

**Status Codes:**
- `200`: Item agregado exitosamente
- `400`: Clave inválida (>255 caracteres) o datos faltantes

---

## ⚙️ Procesamiento Automático

El servicio recopila todos los elementos en una única cola llamada `precios`.
Cada objeto almacenado debe contener un campo `tipo` que indique cómo se debe
procesar:

```javascript
{
  tipo: 'producto' | 'oferta' | 'accion', // campo obligatorio
  fecha_registro: Date|string,            // obligatorio
  // demás propiedades según la categoría
}
```

El worker principal consulta la cola `precios` de forma periódica y, tras extraer
un item, despacha el procesamiento basándose en el valor de `tipo`.

```javascript
async function procesarCaso(item) {
    switch (item.tipo) {
        case 'producto':
            return procesarProducto(item)
        case 'oferta':
            return procesarOferta(item)
        case 'accion':
            // placeholder para futuras acciones específicas
            return procesarAccion(item)
        default:
            console.error('Tipo desconocido:', item.tipo)
            return false
    }
}

// ejemplo del worker principal
setInterval(async () => {
    await procesarCola('precios', procesarCaso)
}, CONFIG.INTERVALO_PROCESAMIENTO)
```

### Procesadores existentes

#### `procesarProducto(item)`
Lógica equivalente a la definida previamente para la cola `productos`.

```javascript
async function procesarProducto(item) {
    const knex = require('knex')(config)
    // validaciones básicas
    if (!item.name || !item.category_name || !item.branch_id || !item.price) {
        console.error('Datos incompletos:', item)
        return false
    }
    const { procesar_articulo } = require('./controllers/importar_productos')
    return await procesar_articulo(item, item.fecha_registro)
}
```

#### `procesarOferta(item)`
Mismo código que antes para la cola `ofertas`, adaptado a la nueva estructura.

```javascript
async function procesarOferta(item) {
    const knex = require('knex')(config)
    if (!item.titulo || !item.branch_id || !item.precio || !item.url) return false
    // (resto de la lógica permanece igual a la versión anterior)
    // ...
}
```


**Nota:** Los ejemplos anteriores están simplificados; el servicio completo debe
incluír controles de reintentos, timeouts y estadísticas similares a los ya
especificados en esta documentación.


---

## 🔄 Lógica de Procesamiento

### Configuración Recomendada

```javascript
// Configuración del procesador
const CONFIG = {
    INTERVALO_PROCESAMIENTO: 2000,  // 2 segundos
    MAX_ITEMS_POR_CICLO: 50,        // 50 items por ciclo
    REINTENTOS_MAX: 3,              // Reintentos antes de descartar
    TIMEOUT_ITEM: 30000             // 30 segundos timeout por item
}

// Worker principal
setInterval(async () => {
    // Usamos cola única 'precios' y despachamos según el campo `tipo`
    await procesarCola('precios', procesarCaso)
}, CONFIG.INTERVALO_PROCESAMIENTO)

async function procesarCola(clave, procesador) {
    let procesados = 0
    
    while (procesados < CONFIG.MAX_ITEMS_POR_CICLO) {
        const item = await obtenerDeCola(clave) // LIFO o FIFO
        if (!item) break
        
        try {
            const exito = await Promise.race([
                procesador(item),
                timeout(CONFIG.TIMEOUT_ITEM)
            ])
            
            if (exito) {
                procesados++
                console.log(`[${clave}] Item procesado #${procesados}`)
            } else {
                // Reintroducir con contador
                await reintentarItem(clave, item)
            }
        } catch (error) {
            console.error(`[${clave}] Error procesando:`, error)
            await reintentarItem(clave, item)
        }
    }
    
    if (procesados > 0) {
        console.log(`[${clave}] Ciclo finalizado: ${procesados} items procesados`)
    }
}
```

---

## 🗄️ Persistencia

### Almacenamiento de Colas

El servicio debe implementar persistencia para que:
- ✅ Los datos NO se pierdan al reiniciar el servicio
- ✅ Los items pendientes se procesen después del reinicio

**Opciones sugeridas:**
1. **Redis** (recomendado)
   - Listas: `RPUSH`, `LPOP` para FIFO
   - Persistencia: `appendonly yes`
   
2. **Base de datos**
   - Tabla `queue_items` con estado (`pending`, `processing`, `failed`)
   
3. **Sistema de archivos**
   - Archivos JSON por cola
   - Menos recomendado por concurrencia

---

## 📊 Monitoreo y Logs

### Logs Mínimos Requeridos

```javascript
console.log(`[${clave}] Iniciando procesamiento de la cola`)
console.log(`[${clave}] Procesando item #${n}`)
console.log(`[${clave}] Fin de ciclo: ${n} items procesados`)
console.error(`[${clave}] Error procesando item:`, error)
```

### Métricas Sugeridas

- Items en cola (por clave)
- Items procesados (contador total)
- Items fallidos (contador)
- Tiempo promedio de procesamiento
- Último procesamiento exitoso (timestamp)

---

## 🔗 Integración con Backend

### Variables de Entorno del Servicio

```bash
# Configuración de base de datos (igual que backend)
mysql_host=localhost
mysql_user=usuario
mysql_password=contraseña
mysql_database=precios_db

# Puerto del servicio
PORT=3501

# Configuración de colas
QUEUE_INTERVAL=2000        # Intervalo de procesamiento (ms)
QUEUE_MAX_ITEMS=50         # Items por ciclo
QUEUE_RETRY_MAX=3          # Reintentos máximos
```

### Dependencias Requeridas

El servicio debe tener acceso a:

```json
{
  "dependencies": {
    "express": "^4.18.1",
    "knex": "^2.3.0",
    "mysql2": "^3.14.3",
    "uuid": "^10.0.0",
    "dotenv": "^16.6.1",
    "redis": "^4.0.0"  // Si se usa Redis
  }
}
```

### Código Compartido

El servicio debe poder importar:
- `back/controllers/importar_productos.js` → función `procesar_articulo()`
- `back/controllers/busqueda_productos.js` → actualización de buscador
- `back/helpers/utils.js` → utilidades
- Conexión a base de datos (mismo knex config)

**Opción 1:** Copiar archivos necesarios
**Opción 2:** Compartir mediante symlinks
**Opción 3:** Convertir en paquete npm compartido

---

## ✅ Checklist de Implementación

### Básico (MVP)
- [ ] Endpoint POST /add_data funcionando
- [ ] Almacenamiento en memoria (array/Map)
- [ ] Procesamiento con setInterval cada 2s sobre clave `precios`
- [ ] Despachar a `procesar_articulo()` cuando `tipo === 'producto'`
- [ ] Despachar a `procesar_oferta()` cuando `tipo === 'oferta'`
- [ ] Logs básicos de procesamiento

### Producción
- [ ] Persistencia (Redis/DB/filesystem)
- [ ] Manejo de reintentos con límite
- [ ] Timeout por item (30s)
- [ ] Logs estructurados
- [ ] Métricas de procesamiento
- [ ] Health check endpoint
- [ ] Limpieza automática de ofertas antiguas
- [ ] Limpieza automática de estadísticas
- [ ] Actualización de incremental_stats
- [ ] Actualización del buscador en tiempo real

### Avanzado
- [ ] Dashboard de monitoreo
- [ ] Endpoint para consultar estado de colas
- [ ] Circuit breaker para DB
- [ ] Rate limiting por clave
- [ ] Priorización de colas
- [ ] Dead letter queue para items fallidos
- [ ] Alertas por colas saturadas

---

## 🧪 Testing

### Test de Integración

```bash
# 1. Agregar item
curl -X POST http://localhost:3501/add_data \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "productos",
    "data": {
      "name": "Test Product",
      "price": 100,
      "branch_id": 1,
      "category_name": "Test",
      "fecha_registro": "2025-12-30T00:00:00Z"
    }
  }'

# 2. Verificar logs del servicio
# Debe mostrar procesamiento automático

# 3. Verificar en base de datos
# SELECT * FROM price WHERE product_id IN (
#   SELECT id FROM products WHERE name = 'Test Product'
# )
```

---

## 📞 Contacto

Para implementar este servicio, referirse a:
- **Documentación:** `back/documentacion/servicio_colas_externo.md`
- **Changelog:** `back/CHANGELOG_servicio_colas.md`
- **Código fuente:** `back/controllers/importar_productos.js`
