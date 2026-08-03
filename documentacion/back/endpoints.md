# 📡 Endpoints del Backend

Documentación completa de todos los endpoints REST disponibles en la API de Precios.

## 🎯 Convenciones

| Aspecto | Detalles |
|---------|----------|
| **Base pública** | `/publico` |
| **Base administrativa** | `/admin` |
| **Formato de respuesta** | JSON |
| **Autenticación** | Opcional por rol |
| **Encoding** | UTF-8 |

## 📚 Tabla de Contenidos

1. [Búsqueda](#búsqueda)
2. [Categorías](#categorías)
3. [Productos](#productos)
4. [Importación](#importación)
5. [Comercios](#comercios)
6. [Análisis y Estadísticas](#análisis-y-estadísticas)
7. [Respuestas Estándar](#respuestas-estándar)

---

## 🔍 Búsqueda

### Buscar Precios de Productos

```http
GET /publico/busqueda/precios?product_name=TÉRMINO
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `product_name` | string | ✅ | Término de búsqueda (min 3 caracteres) |

**Comportamiento**:
- ✅ Búsqueda case-insensitive
- ✅ Indexación en memoria ultrarrápida
- ✅ Dinámicamente actualizado en cada importación
- 🔄 Si contiene "alquiler" → busca propiedades de alquiler

**Respuesta 200 (Éxito)**:
```json
{
  "stat": true,
  "items": [
    {
      "product_id": "uuid-1",
      "name": "Leche entera La Serenísima 1L",
      "price": 1250,
      "branch_id": 5,
      "branch_name": "Sucursal Centro",
      "empresa": "Supermercado X",
      "locales": [
        {
          "branch_id": 5,
          "branch_name": "Centro",
          "price": 1250
        }
      ]
    }
  ]
}
```

**Respuesta 400 (Parámetro inválido)**:
```json
{
  "stat": false,
  "error": "product_name must be at least 3 characters"
}
```

**Respuesta 500 (Error interno)**:
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

---

### Buscar Promociones

```http
GET /publico/busqueda/promociones?product_name=TÉRMINO
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `product_name` | string | ✅ | Término de búsqueda (min 3 caracteres) |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "product_id": "...",
      "name": "Promoción especial",
      "promo_discount": 15,
      "locales": [...]
    }
  ]
}
```

---

### Comercios con Promociones

```http
GET /publico/busqueda/comercios_promociones
```

**Parámetros**: Ninguno

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "branch_id": 1,
      "branch_name": "Sucursal 1",
      "enterprise": "Supermercado X",
      "promo_count": 5
    }
  ]
}
```

---

### Información de Comercio por URL

```http
GET /publico/busqueda/info_comercio?website=URL
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `website` | string | ✅ | URL del comercio (ej: `https://supermercadox.com`) |

**Comportamiento**:
- ✅ Busca empresa por el campo `website`
- ✅ Retorna datos de la empresa + todas sus sucursales

**Respuesta 200**:
```json
{
  "stat": true,
  "items": {
    "enterprice": {
      "id": 1,
      "name": "Supermercado X",
      "type": "supermarket",
      "website": "https://supermercadox.com",
      "logo_url": "https://supermercadox.com/logo.png",
      "active": true
    },
    "branches": [
      {
        "id": 1,
        "branch_name": "Sucursal Centro",
        "enterprise_id": 1,
        "address": "Av. Siempre Viva 123",
        "latitude": -34.603722,
        "longitude": -58.381592,
        "city": "Buenos Aires"
      }
    ]
  }
}
```

**Respuesta 404 (No encontrado)**:
```json
{
  "stat": false,
  "error": "No se encontro comercio con esa URL"
}
```

---

## 🏷️ Categorías

### Listar Todas las Categorías

```http
GET /publico/categorias/all
```

**Parámetros**: Ninguno

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "cat_menu_id": 1,
      "cat_name": "Almacén",
      "icon": "box",
      "sub_count": 5
    }
  ]
}
```

---

### Empresas por Categoría

```http
GET /publico/categorias/get_empresas_categoria?menu_category_id=ID
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `menu_category_id` | number | ✅ | ID de la categoría |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "enterprise_id": 1,
      "enterprise_name": "Supermercado X",
      "product_count": 150
    }
  ]
}
```

---

### Subcategorías de una Categoría

```http
GET /publico/categorias/get_sub_categorias?cat_menu_id=ID
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `cat_menu_id` | number | ✅ | ID de la categoría padre |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "subcat_id": 10,
      "subcat_name": "Leches",
      "icon": "milk"
    }
  ]
}
```

---

### Categorías de una Empresa

```http
GET /publico/categorias/get_categoria_empresa?enterprise_id=ID
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `enterprise_id` | number | ✅ | ID de la empresa |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "cat_id": 1,
      "cat_name": "Almacén"
    }
  ]
}
```

---

## 📦 Productos

### Productos por Categoría

```http
GET /publico/productos/all?category_id=ID
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `category_id` | number | ✅ | ID de la categoría |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "product_id": "uuid",
      "name": "Leche entera 1L",
      "current_price": 1250,
      "branch_count": 3
    }
  ]
}
```

---

### Cargar Nuevo Precio

```http
PUT /publico/productos/cargar_nuevo_precio
```

**Body JSON**:
```json
{
  "product_id": "uuid-del-producto",
  "branch_id": 5,
  "price": 1250
}
```

**Validaciones**:
- ✅ Valida `product_id` + `branch_id` combinación única
- ✅ Límite de 100 ingresos globales por IP
- ✅ Esperar 3 segundos mínimo entre ingresos
- ✅ Max 1 corrección por combinación producto-sucursal
- ✅ Marca confiabilidad = 50

**Respuesta 200 (Éxito)**:
```json
{
  "stat": true,
  "message": "Precio actualizado"
}
```

**Respuesta 429 (Límite de rate)**:
```json
{
  "stat": false,
  "error": "Too many requests from this IP"
}
```

**Respuesta 400 (Validación)**:
```json
{
  "stat": false,
  "error": "Invalid product_id or branch_id"
}
```

---

## 📥 Importación

### Importar Artículos de Plataforma

```http
POST /publico/productos/importar_articulo_plataforma
```

**Body JSON**:
```json
[
  {
    "name": "Leche La Serenísima 1L",
    "price": 1250,
    "currency": "ARS",
    "category_name": "Almacén > Lácteos",
    "url": "https://mercadolibre.com/...",
    "plataforma": "ml",
    "enterprise_id": 1,
    "branch_id": 5
  }
]
```

**Campos**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `name` | string | ✅ | Nombre del producto (normalizado) |
| `price` | number | ✅ | Precio en la moneda especificada |
| `currency` | string | ✅ | ISO 4217 (ARS, USD, etc.) |
| `category_name` | string | ✅ | Ruta: "Categoría > Subcategoría" |
| `url` | string | ❌ | URL del producto en plataforma |
| `plataforma` | string | ✅ | "ml" (MercadoLibre) o "region20" |
| `enterprise_id` | number | ✅ | ID de la empresa |
| `branch_id` | number | ✅ | ID de la sucursal |

**Características**:
- 🔄 Procesamiento asíncrono (no bloquea)
- 📋 Cola en memoria (max 50 items/ciclo)
- 🔁 Reintento automático de errores
- 🔒 Validación de `product_id + branch_id`
- 📊 Calcula automáticamente estadísticas de cambio

**Respuesta 200 (Aceptado)**:
```json
{
  "stat": true,
  "message": "Importación en cola",
  "queued_items": 1,
  "total_in_queue": 5
}
```

**Respuesta 400 (Validación)**:
```json
{
  "stat": false,
  "error": "Invalid items format",
  "details": [
    {
      "index": 0,
      "error": "name is required"
    }
  ]
}
```

---

### Importación Masiva (Alternativa)

```http
POST /publico/productos/importar
```

**Body JSON**:
```json
{
  "key": "KEY_INT_SECRET",
  "lst_importa": [
    {
      "nombre": "Leche 1L",
      "precio": 1250,
      "empresa_id": 1,
      "sucursal_id": 5
    }
  ]
}
```

**Notas**:
- 🔐 Requiere clave `KEY_INT` (variable de entorno)
- 🔄 Cola asíncrona con procesamiento en background
- Respuesta inmediata sin esperar procesamiento

**Respuesta 200**:
```json
{
  "stat": true,
  "message": "Items encolados para procesamiento"
}
```

---

## 🏪 Comercios

### Crear Nuevo Comercio

```http
POST /admin/comercios
```

**Autenticación**: 🔐 Requiere clave `KEY_INT` (enviada en el body)

**Body JSON**:
```json
{
  "key": "KEY_INT_SECRET",
  "enterprice": {
    "name": "Supermercado X",
    "type": "supermarket",
    "website": "https://supermercadox.com",
    "logo_url": "https://supermercadox.com/logo.png",
    "active": true
  },
  "branch": {
    "branch_name": "Sucursal Centro",
    "address": "Av. Siempre Viva 123",
    "latitude": -34.603722,
    "longitude": -58.381592,
    "city": "Buenos Aires"
  }
}
```

**Campos**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `key` | string | ✅ | Clave de autenticación interna |
| `enterprice.name` | string | ✅ | Nombre de la empresa (único) |
| `enterprice.type` | string | ❌ | Tipo de comercio |
| `enterprice.website` | string | ❌ | Sitio web |
| `enterprice.logo_url` | string | ❌ | URL del logo |
| `enterprice.active` | boolean | ❌ | Si está activo (default: true) |
| `branch.branch_name` | string | ✅ | Nombre de la sucursal |
| `branch.address` | string | ❌ | Dirección |
| `branch.latitude` | number | ❌ | Latitud |
| `branch.longitude` | number | ❌ | Longitud |
| `branch.city` | string | ❌ | Ciudad |

**Comportamiento**:
- ✅ Crea registro en `enterprice` y `branch` en una transacción atómica
- ✅ Refresca automáticamente los diccionarios en memoria
- ✅ Si el nombre de empresa ya existe, retorna error por duplicado
- ✅ Si el website/URL ya existe, retorna error por duplicado

**Respuesta 200 (Éxito)**:
```json
{
  "stat": true,
  "items": {
    "enterprice": {
      "id": 1,
      "name": "Supermercado X",
      "type": "supermarket",
      "website": "https://supermercadox.com",
      "logo_url": "https://supermercadox.com/logo.png",
      "active": true
    },
    "branch": {
      "id": 1,
      "branch_name": "Sucursal Centro",
      "enterprise_id": 1,
      "address": "Av. Siempre Viva 123",
      "latitude": -34.603722,
      "longitude": -58.381592,
      "city": "Buenos Aires"
    }
  }
}
```

**Respuesta 401 (Autenticación)**:
```json
{
  "stat": false,
  "error": "Error de autenticación"
}
```

---

## 📊 Análisis y Estadísticas

### Incremento Acumulado de Precios

```http
GET /publico/estadisticas/incremento_acumulado_mensual?year=YYYY&month=MM
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `year` | number | ✅ | Año (YYYY) |
| `month` | number | ✅ | Mes (1-12) |

**Respuesta 200**:
```json
{
  "stat": true,
  "year": 2025,
  "month": 11,
  "items": [
    {
      "product_id": "uuid",
      "name": "Leche 1L",
      "accumulated_increase": 5.2,
      "percentile": 0.75
    }
  ]
}
```

---

### Media de Incremento Interdiario

```http
GET /publico/estadisticas/media_incremento_interdiario?year=YYYY&month=MM
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `year` | number | ✅ | Año |
| `month` | number | ✅ | Mes |

**Respuesta 200**:
```json
{
  "stat": true,
  "items": [
    {
      "product_id": "uuid",
      "name": "Producto",
      "daily_avg_increase": 0.15,
      "volatility": 0.08
    }
  ]
}
```

---

### Variación de Precios

```http
GET /publico/estadisticas/variacion_precios?product_id=UUID&branch_id=ID&days=DÍAS
```

**Parámetros Query**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `product_id` | string | ✅ | ID del producto |
| `branch_id` | number | ✅ | ID de la sucursal |
| `days` | number | ❌ | Últimos N días (default 30) |

**Respuesta 200**:
```json
{
  "stat": true,
  "product": "Leche 1L",
  "branch": "Sucursal Centro",
  "history": [
    {
      "date": "2025-11-15",
      "price": 1250,
      "change_percent": 2.5
    }
  ]
}
```

---

## ✅ Respuestas Estándar

### Formato Base de Respuesta

Todas las respuestas siguen este formato:

```json
{
  "stat": true|false,
  "items": [],
  "error": null|"mensaje"
}
```

**Campos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `stat` | boolean | Indica éxito (`true`) o error (`false`) |
| `items` | array | Datos solicitados (vacío si error) |
| `error` | string \| null | Mensaje de error (si aplica) |

### Códigos HTTP

| Código | Situación | Ejemplo |
|--------|-----------|---------|
| **200** | Éxito en operación | GET búsqueda exitosa |
| **400** | Validación fallida | Parámetros inválidos |
| **401** | No autenticado | Token expirado |
| **403** | No autorizado | Rol insuficiente |
| **429** | Rate limit | Demasiadas solicitudes |
| **500** | Error del servidor | Excepción no capturada |

---

## 🔐 Autenticación y Autorización

### Headers Requeridos

Para endpoints administrativos:

```http
Authorization: Bearer <token>
X-API-Key: <api_key>
```

### Prefijos de Rutas

- `/publico/*` → **Acceso público sin autenticación**
- `/admin/*` → **Requiere autenticación de rol administrativo**

---

## 📝 Ejemplos Prácticos

### 1. Buscar y Obtener Precios

```bash
# Buscar productos
curl -X GET "http://localhost:3001/publico/busqueda/precios?product_name=leche"

# Respuesta
{
  "stat": true,
  "items": [
    {
      "product_id": "abc123",
      "name": "Leche La Serenísima 1L",
      "price": 1250,
      "branch_name": "Centro"
    }
  ]
}
```

### 2. Importar Precios Nuevos

```bash
curl -X POST "http://localhost:3001/publico/productos/importar_articulo_plataforma" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Leche 1L",
      "price": 1250,
      "currency": "ARS",
      "category_name": "Almacén > Lácteos",
      "plataforma": "ml",
      "enterprise_id": 1,
      "branch_id": 5
    }
  ]'
```

### 3. Actualizar Precio Existente

```bash
curl -X PUT "http://localhost:3001/publico/productos/cargar_nuevo_precio" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "abc123",
    "branch_id": 5,
    "price": 1300
  }'
```

---

## 🚀 Versiones y Compatibilidad

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.1 | 2025-11-30 | ✅ Búsqueda case-insensitive, validación branch_id |
| 1.0 | 2025-07-22 | 🎉 Lanzamiento inicial |

---

## 📞 Soporte

Para reportar problemas con los endpoints:
1. Verificar documentación
2. Revisar logs del servidor
3. Contactar al equipo de desarrollo

---

**Última actualización**: 24 de julio de 2026  
**Mantenedor**: Equipo de Backend
