# Documentación de Endpoints del Backend

## Información General
- Base pública: `/publico`
- Base administrativa: `/admin`
- Autenticación: actualmente no se aplica (middleware de autorización deshabilitado)
- Formato de respuestas: JSON

Notas:
- El backend monta routers bajo `/publico` y `/admin`. Las rutas mostradas aquí incluyen esos prefijos.
- El servicio de búsqueda externa se configura por variables de entorno (`SEARCH_SERVICE_ENDPOINT`, `SEARCH_SERVICE_TIMEOUT_MS`, `SEARCH_SERVICE_CACHE_TTL_MS`).

---

## Búsqueda

### Buscar precios de productos
GET `/publico/busqueda/precios`

- Parámetros (query):
  - `product_name` (string, mínimo 3 caracteres)
- Comportamiento:
  - Si el término contiene "alquiler", busca propiedades en alquiler.
  - Usa servicio externo de búsqueda si está configurado; si falla, hace búsqueda interna.
- Respuesta 200:
  - `{ stat: true, items: [...] }`
- Respuesta error:
  - `{ stat: false, items: [], error: true }`

### Buscar promociones
GET `/publico/busqueda/promociones`

- Parámetros (query):
  - `product_name` (string, mínimo 3 caracteres)
- Respuesta 200:
  - `{ stat: true, items: [...] }`

### Comercios con promociones
GET `/publico/busqueda/comercios_promociones`

- Sin parámetros.
- Respuesta 200:
  - `{ stat: true, items: [...] }`

---

## Categorías

### Listar categorías
GET `/publico/categorias/all`

- Sin parámetros.
- Respuesta 200: `{ stat: true, items: [...] }`

### Empresas por categoría
GET `/publico/categorias/get_empresas_categoria`

- Parámetros (query): `menu_category_id`
- Respuesta 200: `{ stat: true, items: [...] }`

### Subcategorías de una categoría
GET `/publico/categorias/get_sub_categorias`

- Parámetros (query): `cat_menu_id`
- Respuesta 200: `{ stat: true, items: [...] }`

### Categorías de una empresa
GET `/publico/categorias/get_categoria_empresa`

- Parámetros (query): `enterprise_id`
- Respuesta 200: `{ stat: true, items: [...] }`

---

## Productos

### Productos por categoría
GET `/publico/productos/all`

- Parámetros (query): `category_id`
- Respuesta 200: `{ stat: true, items: [...] }`

### Cargar nuevo precio
PUT `/publico/productos/cargar_nuevo_precio`

- Body JSON:
  - `product_id` (string)
  - `branch_id` (string)
  - `price` (number)
- Notas:
  - Aplica límites básicos por IP y combinación producto-sucursal.
- Respuesta 200:
  - `{ stat: true }` o `{ stat: false, error: "..." }`

### Importar artículos de plataformas
POST `/publico/productos/importar_articulo_plataforma`

- Body JSON: array de items con campos como `name`, `price`, `currency`, `category_name`, `url`, `plataforma` (`ml` | `region20`).
- Notas:
  - Validación por `key` actualmente deshabilitada.
- Respuesta 200: `{ stat: true }`

### Importar ofertas
POST `/publico/productos/importar_oferta`

- Body JSON:
  - `key` (string, debe igualar `KEY_INT`)
  - `lst_importa` (array de items `{ titulo, precio, branch_id, url, datos_extra }`)
- Respuesta 200: `{ stat: true }`

### Importar alquileres
POST `/publico/productos/importar_alquiler`

- Body JSON:
  - `key` (string, debe igualar `KEY_INT`)
  - `titulo`, `locador`, `url`, `precio`, `moneda`, `especificaciones` (objeto), `hash` (MD5 de campos)
- Respuesta 200: `{ stat: true, nuevo: 0|1|2 }`

### Importación masiva de productos
POST `/publico/productos/importar`

- Body JSON:
  - `key` (string, debe igualar `KEY_INT`)
  - `lst_importa` (array de artículos)
- Comportamiento:
  - Los items se agregan a una cola en memoria (`colaProcProductos`) y se procesan en lotes periódicos.
- Respuesta 200: `{ stat: true, count: <n> }`

---

## Estadística

### Datos estadísticos
GET `/publico/estadistica/data`

- Parámetros (query):
  - `id_estadistica` (string): uno de `incremental_stats`, `precios_por_negocio`, `trending`, `mayor_aumento_diario`, `variacion_precio`
  - `limit` (number, opcional para `mayor_aumento_diario`)
  - `id_producto`, `id_local` (para `variacion_precio`)
- Respuesta 200: `{ stat: true, items: [...] }`

### Precios cargados por usuarios
POST `/publico/estadistica/precios_usuarios`

- Body JSON:
  - `fecha` (string o Date)
  - `nombre` (string)
  - `comercio` (string)
  - `productos` (array de hasta 100 items `{ nombre, marca, precio, presentacion }`)
- Respuesta 200: `{ stat: true }`

---

## Chatbot

### Respuesta del chatbot
POST `/publico/chatbot/chat_bot_rsp`

- Body JSON:
  - `texto` (string)
  - `user_id` (string)
- Respuesta 200:
  - `{ stat: true, msg: <texto> }`
- Notas:
  - Llama a un servicio externo (`http://localhost:6789/api/chat`).

---

## Administración

### Información
GET `/admin/user/info`

- Respuesta 200: `{ stat: true, data: { rutas: [] } }`

### Login
POST `/admin/user/login`

- Respuesta 200: `{ stat: true, data: { rutas: [] } }`

---

## Variables de entorno relevantes

- Base de datos: `mysql_host`, `mysql_user`, `mysql_password`, `mysql_database`, `mysql_port`
- API: `service_port_api`, `cors_origin`, `KEY_INT`
- Búsqueda externa: `SEARCH_SERVICE_ENDPOINT`, `SEARCH_SERVICE_TIMEOUT_MS`, `SEARCH_SERVICE_CACHE_TTL_MS`
- Zona horaria: el proceso fija `process.env.TZ = 'America/Argentina/Buenos_Aires'`

---

[Volver al README del backend](./README.md)
[Arquitectura](./arquitectura.md)
[Definición técnica](./definicion_tecnica.md)