# Documentación de Endpoints del Backend

## Información General
- **Base URL:** `/api`
- **Autenticación:** Bearer Token (JWT) (algunos endpoints públicos)
- **Formato:** JSON

> **Nota:** Las tablas temporales `estadistica_aumento_diario` y `promociones_hoy` solo contienen registros del día actual. El sistema elimina automáticamente los registros antiguos al inicio de cada lote de procesamiento, garantizando que los endpoints relacionados siempre devuelvan datos vigentes.

## Navegación
- [Volver al README del backend](./README.md)
- [Arquitectura](./arquitectura.md)
- [Definición técnica](./definicion_tecnica.md)

---

## Endpoints

### 1. Búsqueda

#### 1.1 Buscar precios de productos
**GET** `/api/busqueda/precios`

Devuelve los precios de productos según el nombre buscado. Si el término contiene "alquiler", busca propiedades en alquiler.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "product_name": "nombre del producto o término de búsqueda"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de precios o propiedades */ ]
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Longitud mínima del término
- **Transaccional**: No
- **Rate Limiting**: No

#### Implementación y búsqueda externa
- La resolución de productos se realiza mediante un servicio de búsqueda externo configurado en `SEARCH_SERVICE_ENDPOINT`.
- Ejemplo de request: `curl "http://localhost:3075/search?q=manzana"` que responde `{"items":[{"id":1,"texto":"ejemplo"}]}`.
- El campo `id` devuelto por el servicio corresponde a `products.id` en la base local.
- Se mantiene un cache en memoria con TTL configurable (`SEARCH_SERVICE_CACHE_TTL_MS`) para términos de búsqueda.

---

#### 1.2 Buscar promociones
**GET** `/api/busqueda/promociones`

Devuelve promociones activas según el nombre del producto.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "product_name": "nombre del producto"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de promociones */ ]
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Longitud mínima del término
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 1.3 Comercios con promociones
**GET** `/api/busqueda/comercios_promociones`

Devuelve comercios que tienen promociones activas.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
_No requiere parámetros._

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de comercios */ ]
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: No
- **Transaccional**: No
- **Rate Limiting**: No

---

### 2. Categorías

#### 2.1 Listar todas las categorías
**GET** `/api/categorias/all`

Devuelve todas las categorías ordenadas alfabéticamente.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
_No requiere parámetros._

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de categorías */ ],
  "error": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: No
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 2.2 Empresas por categoría
**GET** `/api/categorias/get_empresas_categoria`

Devuelve las empresas asociadas a una categoría de menú.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "menu_category_id": "ID de la categoría de menú"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de empresas */ ],
  "error": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere parámetro menu_category_id
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 2.3 Subcategorías de una categoría
**GET** `/api/categorias/get_sub_categorias`

Devuelve las subcategorías asociadas a una categoría de menú.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "cat_menu_id": "ID de la categoría de menú"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de subcategorías */ ],
  "error": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere parámetro cat_menu_id
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 2.4 Categorías por empresa
**GET** `/api/categorias/get_categoria_empresa`

Devuelve las categorías asociadas a una empresa.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "enterprise_id": "ID de la empresa"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de categorías */ ],
  "error": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere parámetro enterprise_id
- **Transaccional**: No
- **Rate Limiting**: No

---

### 3. Chatbot

#### 3.1 Respuesta del chatbot
**POST** `/api/chatbot/chat_bot_rsp`

Envía un mensaje al chatbot y recibe una respuesta.

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "texto": "Mensaje del usuario",
  "user_id": "ID del usuario"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "msg": "Respuesta del chatbot"
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere texto y user_id
- **Transaccional**: No
- **Rate Limiting**: No

---

### 4. Estadística

#### 4.1 Obtener datos estadísticos
**GET** `/api/estadistica/data`

Devuelve datos estadísticos según el parámetro id_estadistica.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "id_estadistica": "Tipo de estadística",
  "id_producto": "ID del producto (opcional)",
  "id_local": "ID del local (opcional)",
  "limit": "Límite de resultados (opcional)"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de datos */ ],
  "media": "valor medio si aplica"
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere id_estadistica
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 4.2 Cargar precios de usuarios
**POST** `/api/estadistica/precios_usuarios`

Permite a los usuarios cargar precios de productos de forma comunitaria.

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "fecha": "Fecha de carga",
  "nombre": "Nombre del usuario",
  "comercio": "Nombre del comercio",
  "productos": [
    {
      "nombre": "Nombre del producto",
      "marca": "Marca",
      "precio": 0,
      "presentacion": "Presentación"
    }
  ]
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [],
  "error": false
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Estructura del body
- **Transaccional**: No
- **Rate Limiting**: No

---

### 5. Productos

#### 5.1 Listar productos por categoría
**GET** `/api/productos/all`

Devuelve los productos de una categoría específica.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
```json
{
  "category_id": "ID de la categoría"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "items": [ /* array de productos */ ],
  "error": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "items": [],
  "error": true
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere category_id
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 5.2 Cargar nuevo precio
**PUT** `/api/productos/cargar_nuevo_precio`

Permite cargar un nuevo precio para un producto en un local.

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "product_id": "ID del producto",
  "branch_id": "ID del local",
  "price": 0
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "error": "Mensaje de error"
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Requiere product_id, branch_id y price
- **Transaccional**: No
- **Rate Limiting**: Limita frecuencia y cantidad por IP

---

#### 5.3 Importar precios masivos
**POST** `/api/productos/importar`

Permite importar precios de productos en lote (requiere clave interna).

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "key": "clave interna",
  "lst_importa": [ /* array de productos a importar */ ]
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "error": "Mensaje de error"
}
```

#### Características del Endpoint
- **Autenticación**: Requiere clave interna
- **Permisos**: Solo sistemas autorizados
- **Validación**: Estructura del body
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 5.4 Importar artículo de plataforma
**POST** `/api/productos/importar_articulo_plataforma`

Permite importar artículos desde plataformas externas (requiere clave interna, actualmente comentada en el código).

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
[
  {
    "plataforma": "ml|region20",
    "name": "Nombre del artículo",
    "price": 0,
    "currency": "pesos|dolares",
    "category_name": "Categoría",
    "url": "URL del artículo"
  }
]
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "error": "Mensaje de error"
}
```

#### Características del Endpoint
- **Autenticación**: Requiere clave interna (comentada en el código)
- **Permisos**: Solo sistemas autorizados
- **Validación**: Estructura del body
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 5.5 Importar ofertas masivas
**POST** `/api/productos/importar_oferta`

Permite importar ofertas en lote (requiere clave interna).

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "key": "clave interna",
  "lst_importa": [ /* array de ofertas */ ]
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "res": "Resultado de la importación"
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "error": "Mensaje de error"
}
```

#### Características del Endpoint
- **Autenticación**: Requiere clave interna
- **Permisos**: Solo sistemas autorizados
- **Validación**: Estructura del body
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 5.6 Importar alquileres
**POST** `/api/productos/importar_alquiler`

Permite importar propiedades en alquiler (requiere clave interna y hash de validación).

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "key": "clave interna",
  "titulo": "Título de la propiedad",
  "locador": "Nombre del locador",
  "url": "URL",
  "precio": 0,
  "moneda": "Moneda",
  "especificaciones": { /* objeto de especificaciones */ },
  "hash": "hash de validación"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "nuevo": 1
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "error": "Mensaje de error"
}
```

#### Características del Endpoint
- **Autenticación**: Requiere clave interna y hash
- **Permisos**: Solo sistemas autorizados
- **Validación**: Estructura del body y hash
- **Transaccional**: Sí (usa transacciones de BD)
- **Rate Limiting**: No

---

### 6. Administración de Usuarios

#### 6.1 Información de usuario admin
**GET** `/api/userAdmin/info`

Devuelve información básica de rutas disponibles para el usuario admin.

#### Headers
```
Content-Type: application/json
```

#### Parámetros (query)
_No requiere parámetros._

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "data": { "rutas": [] }
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "data": null
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (admin)
- **Permisos**: Admin
- **Validación**: No
- **Transaccional**: No
- **Rate Limiting**: No

---

#### 6.2 Login de usuario admin
**POST** `/api/userAdmin/login`

Permite iniciar sesión como usuario admin.

#### Headers
```
Content-Type: application/json
```

#### Body (request)
```json
{
  "usuario": "Nombre de usuario",
  "password": "Contraseña"
}
```

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "data": { "rutas": [] }
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "data": null
}
```

#### Características del Endpoint
- **Autenticación**: No requerida (devuelve rutas si login es correcto)
- **Permisos**: Admin
- **Validación**: usuario y password
- **Transaccional**: No
- **Rate Limiting**: No

---

## Códigos de Error
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

---

## Ejemplos de Uso
Describir flujos completos de uso de la API.