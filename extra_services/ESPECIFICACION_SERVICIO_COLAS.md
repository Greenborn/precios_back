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

### Cola: `"productos"`

El servicio debe procesar items de esta cola ejecutando la lógica equivalente a:

```javascript
// Pseudo-código del procesamiento
async function procesarProducto(item) {
    // 1. Conectar a la base de datos
    const knex = require('knex')(config)
    
    // 2. Validar datos requeridos
    if (!item.name || !item.category_name || !item.branch_id || !item.price || !item.fecha_registro) {
        console.error('Datos incompletos:', item)
        return false
    }
    
    // 3. Ejecutar procesar_articulo()
    // Importar desde: back/controllers/importar_productos.js
    const { procesar_articulo } = require('./controllers/importar_productos')
    const resultado = await procesar_articulo(item, item.fecha_registro)
    
    // 4. Actualizar estadísticas si fue exitoso
    if (resultado.stat) {
        // Actualizar incremental_stats
        const cant_price = await knex('price').count('id').first()
        await knex('incremental_stats')
            .update({ value: cant_price['count(`id`)'] })
            .where('key', 'cant_price')
        
        const cant_price_today = await knex('price_today').count('id').first()
        await knex('incremental_stats')
            .update({ value: cant_price_today['count(`id`)'] })
            .where('key', 'precios_hoy')
    }
    
    return resultado.stat
}
```

**Datos esperados en cada item:**
```javascript
{
  name: string,              // REQUERIDO
  price: number,             // REQUERIDO (>0)
  branch_id: number,         // REQUERIDO
  category_name: string,     // REQUERIDO
  fecha_registro: Date|string, // REQUERIDO
  vendor_id: string,         // OPCIONAL
  barcode: string,           // OPCIONAL
  description: string,       // OPCIONAL
  url: string,              // OPCIONAL
  nota: string              // OPCIONAL
}
```

### Cola: `"ofertas"`

El servicio debe procesar items de esta cola ejecutando:

```javascript
async function procesarOferta(item) {
    const knex = require('knex')(config)
    
    // 1. Validar datos
    if (!item.titulo || !item.fecha_registro || !item.branch_id || !item.precio || !item.url) {
        console.error('Datos incompletos:', item)
        return false
    }
    
    // 2. Verificar si ya existe
    const existe = await knex('promociones_hoy')
        .where('titulo', item.titulo)
        .first()
    
    if (existe) {
        console.log('Oferta duplicada:', item.titulo)
        return false
    }
    
    // 3. Insertar en tablas
    const HOY = new Date()
    HOY.setHours(0, 0, 0, 0)
    
    const AYER = new Date()
    AYER.setDate(AYER.getDate() - 1)
    AYER.setHours(23, 59, 59)
    
    const insert = {
        orden: 0,
        fecha: item.fecha_registro,
        titulo: item.titulo,
        id_producto: -1,
        precio: item.precio,
        datos_extra: item.datos_extra || '{}',
        branch_id: item.branch_id,
        url: item.url
    }
    
    // Limpiar ofertas antiguas
    await knex('promociones_hoy').where('fecha', '<', AYER).del()
    
    // Insertar nueva oferta
    await knex('promociones_hoy').insert(insert)
    await knex('promociones').insert(insert)
    
    // 4. Actualizar estadísticas
    const cant_promos = await knex('promociones_hoy').count('id').first()
    await knex('incremental_stats')
        .update({ value: cant_promos['count(`id`)'] })
        .where('key', 'cant_promos')
    
    return true
}
```

**Datos esperados en cada item:**
```javascript
{
  titulo: string,           // REQUERIDO
  precio: number,           // REQUERIDO
  branch_id: number,        // REQUERIDO
  url: string,              // REQUERIDO
  fecha_registro: Date|string, // REQUERIDO
  datos_extra: object       // OPCIONAL (default: {})
}
```

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
    await procesarCola('productos', procesarProducto)
    await procesarCola('ofertas', procesarOferta)
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
- [ ] Procesamiento con setInterval cada 2s
- [ ] Ejecución de procesar_articulo() para productos
- [ ] Ejecución de procesar_oferta() para ofertas
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
