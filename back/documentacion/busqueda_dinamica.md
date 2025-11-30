# Búsqueda Dinámica de Productos

## 📋 Descripción

Sistema mejorado de búsqueda en memoria que permite actualizar la estructura de búsqueda en tiempo real sin necesidad de regenerarla completamente.

## 🎯 Problema Resuelto

**Antes**: La estructura de búsqueda se generaba completamente al iniciar el servidor y se actualizaba solo cada 24 horas. Los nuevos productos importados no aparecían en las búsquedas hasta la siguiente regeneración.

**Ahora**: La estructura de búsqueda se actualiza automáticamente cada vez que se importa o actualiza un producto, haciendo que esté disponible para búsqueda de forma inmediata.

## 🔧 Nuevas Funcionalidades

### 1. `agregar_a_buscador(producto)`

Agrega o actualiza un producto en la estructura de búsqueda.

**Parámetros:**
```javascript
{
    product_name: string,   // Nombre del producto (requerido)
    product_id: string,     // ID del producto (requerido)
    price: number,          // Precio del producto (requerido)
    branch_id: number,      // ID de la sucursal (requerido)
    date_time: Date,        // Fecha y hora del precio
    time: Date,             // Timestamp del precio
    url: string             // URL del producto (opcional)
}
```

**Características:**
- ✅ Si ya existe un producto con el mismo `product_id` y `branch_id`, primero lo elimina
- ✅ Evita duplicados en la estructura
- ✅ Actualiza todas las letras indexadas automáticamente
- ✅ **Búsqueda case-insensitive**: Se puede buscar con mayúsculas o minúsculas indistintamente
- ✅ Retorna `true` si se agregó correctamente, `false` si faltan campos requeridos

**Ejemplo de uso:**
```javascript
const busqueda_productos = require('./controllers/busqueda_productos')

busqueda_productos.agregar_a_buscador({
    product_name: 'Leche Descremada La Serenísima 1L',
    product_id: 'prod-12345',
    price: 850.50,
    branch_id: 10,
    date_time: new Date(),
    time: new Date(),
    url: 'https://ejemplo.com/producto'
})
```

### 2. `eliminar_de_buscador(product_id, branch_id)`

Elimina un producto específico de la estructura de búsqueda.

**Parámetros:**
- `product_id` (string): ID del producto a eliminar
- `branch_id` (number): ID de la sucursal

**Características:**
- ✅ Elimina el producto de todas las letras indexadas
- ✅ Limpia arrays vacíos para optimizar memoria
- ✅ No genera error si el producto no existe

**Ejemplo de uso:**
```javascript
busqueda_productos.eliminar_de_buscador('prod-12345', 10)
```

## 🔄 Integración Automática

### En el proceso de importación

La actualización de la estructura de búsqueda se realiza automáticamente en los siguientes casos:

#### 1. Nuevo precio registrado
Cuando se crea un nuevo registro de precio en `nuevo_reg_precio()`:
```javascript
// Se actualiza price_today y luego:
busqueda_productos.agregar_a_buscador({
    product_name: articulo.name,
    product_id: producto_db.id,
    price: articulo.price,
    branch_id: articulo.branch_id,
    date_time: insert.date_time,
    time: insert.time,
    url: insert.url
})
```

#### 2. Precio sin cambio significativo (≤ $1)
Cuando el precio es prácticamente igual pero se actualiza el timestamp:
```javascript
// Se actualiza solo la fecha en price_today y luego:
busqueda_productos.agregar_a_buscador({
    product_name: articulo.name,
    product_id: producto_db.id,
    price: ultimo_precio.price,
    branch_id: articulo.branch_id,
    date_time: new Date(),
    time: new Date(),
    url: articulo.url
})
```

## 📊 Flujo de Actualización

```
┌─────────────────────────────────┐
│  POST /admin/productos/importar │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Agregar a cola de procesamiento│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Worker procesa item (2s)      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   procesar_articulo()           │
│   - Valida categoría            │
│   - Obtiene/crea producto       │
│   - Procesa precio              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   nuevo_reg_precio()            │
│   - Inserta en price            │
│   - Actualiza price_today       │
│   ┌───────────────────────┐     │
│   │ agregar_a_buscador()  │ ◄───┤ ¡AQUÍ!
│   │ - Elimina anterior    │     │
│   │ - Agrega nuevo        │     │
│   └───────────────────────┘     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Producto disponible en búsqueda│
│  de forma INMEDIATA             │
└─────────────────────────────────┘
```

## 🧪 Pruebas

Se incluye un script de pruebas completo: `test_busqueda_dinamica.js`

**Ejecución:**
```bash
node test_busqueda_dinamica.js
```

**Pruebas incluidas:**
1. ✓ Inicialización de la estructura
2. ✓ Búsqueda de productos existentes
3. ✓ Agregar nuevo producto
4. ✓ Buscar producto recién agregado
5. ✓ Actualizar producto existente
6. ✓ Verificar actualización de precio
7. ✓ Verificar que no hay duplicados
8. ✓ Eliminar producto
9. ✓ Verificar eliminación correcta

## ⚡ Ventajas

1. **Inmediatez**: Los productos importados están disponibles para búsqueda instantáneamente
2. **Sin duplicados**: Al actualizar, primero elimina el registro anterior
3. **Eficiencia**: No requiere regenerar toda la estructura
4. **Consistencia**: Garantiza que `price_today` y la estructura de búsqueda estén sincronizadas
5. **Memoria optimizada**: Limpia arrays vacíos automáticamente
6. **Case-insensitive**: La búsqueda funciona independientemente de mayúsculas/minúsculas

## 📝 Notas Técnicas

### Búsqueda Case-Insensitive

La búsqueda es **case-insensitive**, lo que significa que:

- Buscar "coca cola" encuentra productos nombrados como "Coca Cola", "COCA COLA", "CoCa CoLa", etc.
- Los nombres de productos se almacenan tanto en su forma original como en minúsculas
- La comparación se realiza siempre en minúsculas
- Los resultados retornan el nombre original del producto (con sus mayúsculas/minúsculas)

**Ejemplo:**
```javascript
// Producto almacenado: "Leche La Serenísima ENTERA 1L"

// Todas estas búsquedas lo encuentran:
busqueda('leche')           // ✓
busqueda('LECHE')           // ✓
busqueda('Leche')           // ✓
busqueda('leche serenisima') // ✓
busqueda('LECHE SERENISIMA') // ✓

// El resultado siempre retorna el nombre original:
// → "Leche La Serenísima ENTERA 1L"
```

### Identificación única
Un producto se identifica de forma única por la combinación de:
- `product_id` + `branch_id`

Esto permite que el mismo producto pueda tener diferentes precios en diferentes sucursales.

### Índice por letras
La estructura `lst_letras` mantiene un índice donde cada letra apunta a todos los productos que contienen esa letra. Esto permite búsquedas muy eficientes.

### Transaccionalidad
La actualización de la estructura de búsqueda se realiza **después** de que la transacción de base de datos sea exitosa, garantizando consistencia.

## 🔮 Mejoras Futuras

- [ ] Agregar métricas de performance (tiempo de búsqueda)
- [ ] Implementar caché LRU para búsquedas frecuentes
- [ ] Agregar búsqueda fuzzy (tolerancia a errores de escritura)
- [ ] Implementar paginación en resultados de búsqueda
- [ ] Agregar filtros por categoría, rango de precio, etc.
