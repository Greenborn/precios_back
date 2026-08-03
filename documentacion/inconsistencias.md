# Informe de Inconsistencias - Proyecto Precios Tandil

**Versión del análisis:** 1.0
**Fecha:** 2026-07-15
**Total de issues documentados:** 42

---

## 🔴 CRÍTICOS

### 1. Credenciales trackeadas en git

`back/.env` y `front/.env` contienen credenciales reales (DB password, API keys) y están siendo trackeados por git. Los `.gitignore` listan `.env` pero los archivos se commitearon antes de agregar las reglas.

- **Archivos:** `back/.env`, `front/.env`
- **Riesgo:** Exposición de credenciales en el repositorio
- **Solución:** `git rm --cached` de ambos archivos y rotar las credenciales

### 2. Migraciones vacías en `back/migrations/`

Tres archivos de migración en `back/migrations/` tienen las funciones `up()`/`down()` vacías (stubs sin implementación):

| Archivo | Problema |
|---|---|
| `back/migrations/20250722075112_init_schema.js` | `up()` y `down()` vacíos - no crea schema alguno |
| `back/migrations/20250722081905_create_serie_compilada_media_interdiaria.js` | `up()` y `down()` vacíos |
| `back/migrations/20250722084317_add_inc_acumulado_to_serie_compilada_media_interdiaria.js` | `up()` y `down()` vacíos |

Mientras tanto, en `migrations/` (raíz del proyecto) **existen los mismos archivos con implementaciones reales**. El `knexfile.js` apunta a `back/migrations/`, por lo que `knex.migrate.latest()` no ejecuta nada real.

- **Solución:** Reemplazar los stubs de `back/migrations/` con las implementaciones reales de `migrations/` (raíz), o reconfigurar `knexfile.js` para apuntar a la raíz.

### 3. Migración duplicada en directorio raíz

`migrations/20250722075717_add_serie_compilada_media_interdiaria.js` y `migrations/20250722081905_create_serie_compilada_media_interdiaria.js` crean la misma tabla con el mismo schema. Ejecutar ambas causaría un error por tabla ya existente.

- **Solución:** Eliminar el archivo duplicado (`20250722075717`)

### 4. Columnas duplicadas en migraciones

`back/migrations/20260714224208_add_address_to_branch.js` y `back/migrations/20260714224815_add_remaining_columns_to_branch.js` ambas agregan la columna `address` a la tabla `branch`.

- **Solución:** Unificar en una sola migración

### 5. Bypass total del sistema de autorización

En `back/helpers/authorization.js:13-14`:

```javascript
if (req.session?.user) { next(); return; }
// TODO: Líneas 15-54 son código muerto
```

La línea `next(); return;` hace que **toda la lógica de roles y permisos (líneas 15-54) nunca se ejecute**, permitiendo que cualquier usuario autenticado pase cualquier verificación de permisos.

- **Solución:** Mover `next()` al final de la función después de las verificaciones de rol

### 6. `knex` sin declarar en `routes/productos.js`

En `back/routes/productos.js:351-352` se usa `knex.transaction()` y `knex('propiedades_alquiler')` pero `knex` no está declarado ni importado en el archivo. Debería ser `global.knex`.

- **Solución:** Reemplazar `knex` por `global.knex`

---

## 🟡 GRAVES

### 7. Variables globales implícitas (sin declaración)

Múltiples archivos usan variables sin `let`/`const`/`var`, creando globales implícitas:

| Archivo | Línea(s) | Variable |
|---|---|---|
| `back/routes/categorias.js` | 11, 24, 43, 61 | `salida` |
| `back/routes/busqueda.js` | 49, 183 | `params` |
| `back/routes/productos.js` | 58 | `salida` |

- **Solución:** Agregar `let`/`const` antes de cada declaración

### 8. `paths` usado antes de declaración

En `back/middleware/Admin.js:10` y `back/middleware/Publico.js:11` se usa `paths` (en un `for...of`) antes de declararlo en las líneas 17 y 21 respectivamente. En modo estricto, esto lanza `ReferenceError`.

- **Solución:** Mover la declaración de `paths` antes de su uso

### 9. Endpoint `/public-news` inexistente

`front/src/api/public/publicEndpoints.js:20` define una llamada a `GET /public-news` que **no tiene ruta correspondiente en el backend**. La página `Novedades.vue` siempre recibirá 404.

- **Solución:** Implementar la ruta faltante o corregir el endpoint

### 10. Módulo `gestionUsuarios` inexistente

`front/src/components/admin/abmAdmin/AbmAdmins.vue:11` importa funciones de `@/api/admin/gestionUsuarios` pero ese archivo no existe en el proyecto. Causa error de importación en runtime.

- **Solución:** Crear el archivo faltante o corregir la importación

### 11. Endpoints de administración sin backend

Todos los endpoints de RBAC y gestión de usuarios en el frontend no tienen rutas en el backend:

**RBAC (12 endpoints):**
`GET /rbac/get_roles`, `POST /rbac/nuevo_rol`, `DELETE /rbac/eliminar_rol`, `PUT /rbac/editar_rol`, `GET /rbac/get_permisos`, `POST /rbac/nuevo_permiso`, `DELETE /rbac/eliminar_permiso`, `PUT /rbac/editar_permiso`, `GET /rbac/get_rutas`, `POST /rbac/nueva_ruta`, `DELETE /rbac/eliminar_ruta`, `PUT /rbac/editar_ruta`, `POST /rbac/asignar_permiso_rol`, `POST /rbac/asignar_usuario_rol`

**Usuario (3 endpoints):**
`POST /user/signup`, `POST /user/logout`, `PUT /user/guardar_config`

- **Solución:** Implementar las rutas faltantes en el backend

### 12. Pinia store mal configurado

```javascript
// front/src/main.js:42-43
const storeApp = AppStore();
app.use(storeApp); // Incorrecto: Pinia stores no se usan con app.use()
```

En Pinia, solo `app.use(createPinia())` es necesario. Llamar `app.use(storeApp)` es un error de concepto.

- **Solución:** Eliminar `app.use(storeApp)`. La store se usa con `useStore()` en componentes.

### 13. `ModalsManager` renderizado dos veces

`front/src/App.vue` renderiza `<ModalsManager>` en las líneas 4 y 7, creando dos instancias del gestor de modales, lo que duplica overlays y event listeners.

- **Solución:** Eliminar una de las dos ocurrencias

### 14. `onMounted` sin importar

`front/src/components/genericos/ToastGenerico.vue:20` usa `onMounted()` pero no lo importa desde `'vue'`.

- **Solución:** Agregar `onMounted` a la importación de `'vue'`

### 15. Redirección a ruta `/dashboard` inexistente

`front/src/utils/auth.js:31,208,232` redirige a `/dashboard` pero esa ruta no está definida en `router.js`. La ruta "dashboard" tiene path `/`.

- **Solución:** Cambiar `/dashboard` por `/`

---

## 🟠 MEDIAS

### 16. Typo en `vite.config.js`

`front/vite.config.js:19` tiene `pulicDir: './public'` - debería ser `publicDir`. Vite ignora esta opción por el typo, aunque funciona porque `'public'` es el valor por defecto.

### 17. `lodash` faltante en `package.json`

`lodash` se requiere en 3 archivos del backend (`middleware/Admin.js`, `middleware/Publico.js`, `helpers/authorization.js`) pero no está listado en `back/package.json`. Funciona solo porque es dependencia transitiva.

### 18. `nodemon` faltante en dependencias

`back/package.json:9` usa `nodemon server.js` en el script `start` pero `nodemon` no está en ninguna dependencia (ni devDependencies).

### 19. `express-session` en dependencias pero nunca usado

`back/package.json` lista `express-session` pero no hay `require('express-session')` en ningún archivo ni se configura como middleware.

### 20. `string-similarity` en dependencias pero nunca usado

`back/package.json` lista `string-similarity` pero no se importa en ningún archivo del backend.

### 21. Axios version mismatch

`back/package.json:22` requiere `axios: "^1.10.0"` mientras que `front/package.json:16` requiere `axios: "^1.7.7"`. Versiones diferentes entre front y back.

### 22. uuid version mismatch

`back/package.json:34` requiere `uuid: "^10.0.0"` mientras que `front/package.json:28` requiere `uuid: "^11.1.0"`. Major version diferente.

### 23. `path` como dependencia de frontend

`front/package.json:20` lista `"path": "^0.12.7"` - `path` es un módulo built-in de Node.js y no debe ser dependencia npm.

### 24. Tag de cierre incorrecto en LoginAdmin

`front/src/pages/LoginAdmin.vue:29`:
```html
<Button ...></button>  <!-- Debería ser </Button> -->
```

### 25. Falta binding `:` en Spinner

`front/src/components/layout/Spinner.vue:3`:
```html
<div class="spinner" style="styleSpinner">
<!-- Debería ser :style="styleSpinner" -->
```

### 26. Bootstrap JS importado dos veces

`front/src/main.js:8-9`:
```javascript
import "bootstrap"                     // Línea 8
import * as bootstrap from 'bootstrap' // Línea 9
```
La línea 9 es redundante si solo se usan componentes PrimeVue.

### 27. `process.env.VITE_NODE_ENV` en `vue.config.js`

`front/vue.config.js` usa `process.env.VITE_NODE_ENV`. En Vite, las variables de entorno se exponen como `import.meta.env.VITE_*`, no como `process.env.VITE_*`. Además, `vue.config.js` es para Vue CLI, no para Vite.

### 28. Opción inválida `hash: false` en router

`front/src/router.js:61` tiene `hash: false` que no es una opción válida de `createRouter` en Vue Router 4.

### 29. `.env.test` vacío

`back/.env.test` y `front/.env` (test variants) existen pero están vacíos o incompletos, lo que causará fallos si se usan para testing.

### 30. Chatbot URL hardcodeada

`back/routes/chatbot.js:16` hardcodea `http://localhost:6789/api/chat`. Esta URL debería ser configurable mediante variable de entorno.

---

## 🔵 LEVES

### 31. Typo "enterprice" vs "enterprise"

La tabla de base de datos y variables globales usan `enterprice` (faltante la 's') mientras que la columna foreign key usa `enterprise_id` correctamente.

Afecta: `server.js`, `routes/busqueda.js`, `controllers/importar_productos.js`, migraciones, documentos.

### 32. Typo "branchs" vs "branches"

Variables como `global.branchs_diccio` usan plural incorrecto en inglés. Debería ser `branches` o `sucursales`.

### 33. Typo "MIDLEWARE"

`back/server.js:195` comentario: `//MIDLEWARE` - falta una 'D'.

### 34. Typo "Dasboard"

`front/src/components/admin/Dasboard.vue` - el nombre del archivo tiene typo (falta 'h'). Debería ser `Dashboard.vue`.

### 35. URL mal formada en index.html

`front/index.html:14`: `https//precios.greenborn.com.ar` - falta `://` después de `https`.

### 36. Repo URL incorrecta

`back/package.json:13` apunta a `chat_publico_back` en lugar de `precios`.

### 37. Documentación `BaseDeDatos.md` desactualizada

Describe tablas como `Precio`, `Comercio`, `Sucursales` que no existen en el schema real. El schema real usa `price`, `products`, `branch`, `enterprice`, `price_today`.

### 38. `endpoints_old.md` con rutas obsoletas

Describe rutas con prefijo `/api/` que ya no existen (ahora son `/publico/` y `/admin/`).

### 39. Versiones inconsistentes en documentación

- `documentacion/propuestas_mejoras.md`: v2.0
- `documentacion/README.md`: v1.1
- `front/package.json` y `back/package.json`: v1.8.11

### 40. Convención de variables de entorno inconsistente

- Backend usa **snake_case**: `mysql_host`, `mysql_user`, `cors_origin`
- Documentación backend usa **UPPER_SNAKE_CASE**: `MYSQL_HOST`, `MYSQL_PORT`
- Frontend usa **VITE_UPPER_SNAKE_CASE**: `VITE_APP_BACKEND_ADMIN`

### 41. Modelos de datos vacíos

5 archivos en `back/models/` están completamente vacíos (0 líneas):
- `PermisoModel.js`
- `Permiso_RolModel.js`
- `RolModel.js`
- `UsuarioModel.js`
- `Usuario_RolModel.js`

### 42. Código duplicado

`back/helpers/utils.js` y `back/scripts/utils.js` contienen la función `limpiarTexto()` idéntica. `scripts/utils.js` nunca es importado por ningún otro archivo.

---

## Tablas usadas en código pero sin migración

Las siguientes tablas son referenciadas en el código pero **no tienen migración** que las cree:

| Tabla | Archivos donde se usa |
|---|---|
| `category` | `server.js`, `routes/categorias.js` |
| `products` | `server.js`, `controllers/busqueda_productos.js` |
| `price` | `controllers/importar_productos.js` |
| `price_today` | `server.js`, `routes/busqueda.js` |
| `branch` | `server.js` |
| `enterprice` | `server.js` |
| `alias_productos` | `server.js` |
| `alias_busqueda` | `server.js` |
| `product_category` | `server.js` |
| `promociones_hoy` | `routes/busqueda.js`, `controllers/importar_productos.js` |
| `estadistica_aumento_diario` | `controllers/importar_productos.js`, `routes/estadistica.js` |
| `enterprice_categorias_menu` | `routes/categorias.js` |
| `enterprise_category` | `routes/categorias.js` |

---

## Puertos inconsistentes

| Archivo | Puerto | Contexto |
|---|---|---|
| `env.example` | 3000 | Backend API (ejemplo) |
| `back/.env` | 3044 | Backend API (real) |
| `env.example` | 3000 | CORS origin (ejemplo) |
| `back/.env` | 3000, 3001 | CORS origin (real, dos puertos) |
| `front/package.json` | 3000 | Dev server (vite --port 3000) |
| `front/.env` | 3044 | Backend admin URL |

---

## Resumen

| Prioridad | Cantidad | % |
|---|---|---|
| 🔴 Críticos | 6 | 14% |
| 🟡 Graves | 9 | 21% |
| 🟠 Medias | 15 | 36% |
| 🔵 Leves | 12 | 29% |
| **Total** | **42** | **100%** |
