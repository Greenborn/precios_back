# Arquitectura del Sistema - Precios Back

Este documento describe la arquitectura, organización y buenas prácticas del sistema **precios_back**. Sirve como referencia para desarrolladores actuales y futuros.

---

## 1. Descripción General

**precios_back** es una API REST desarrollada en Node.js que proporciona servicios para la gestión y consulta de precios de productos. El sistema está diseñado para manejar catálogos de productos, precios actuales, búsquedas y estadísticas.

### Tecnologías Principales
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **Knex.js** - Query builder para MySQL
- **CORS** - Manejo de políticas de origen cruzado
- **bcrypt** - Encriptación de contraseñas
- **express-session** - Manejo de sesiones

---

## 2. Estructura de Carpetas y Propósito

```
precios_back/
├── controllers/          # Lógica de negocio y controladores
├── db/                  # Datos y configuración de base de datos
├── documentacion/       # Documentación del proyecto
├── helpers/            # Funciones auxiliares y utilidades
├── middleware/         # Middlewares de Express
├── models/             # Modelos de datos y acceso a BD
├── routes/             # Definición de rutas API
├── scripts/            # Scripts de mantenimiento y utilidades
├── server.js           # Punto de entrada de la aplicación
└── package.json        # Dependencias y configuración
```

### Descripción Detallada

- **controllers/**: Contiene la lógica de negocio principal
  - `busqueda_productos.js` - Lógica de búsqueda y filtrado de productos
  - `importar_productos.js` - Importación y procesamiento de datos de productos

- **routes/**: Definición de endpoints API organizados por dominio
  - `busqueda.js` - Endpoints de búsqueda de productos
  - `categorias.js` - Gestión de categorías
  - `estadistica.js` - Endpoints de estadísticas y reportes
  - `productos.js` - CRUD de productos
  - `userAdmin.js` - Gestión de usuarios administradores

- **middleware/**: Funciones de middleware para Express
  - `Admin.js` - Control de acceso para administradores
  - `Publico.js` - Middleware para endpoints públicos

- **models/**: Modelos de datos y acceso a base de datos
  - `BaseModel.js` - Modelo base con funcionalidades comunes
  - Modelos específicos para permisos, roles y usuarios

- **helpers/**: Funciones auxiliares reutilizables
- **scripts/**: Scripts de mantenimiento, importación y utilidades
- **db/**: Datos y configuración de base de datos

---

## 3. Arquitectura de la Aplicación

### 3.1 Flujo de Inicialización

1. **Configuración de entorno**: Carga de variables de entorno con dotenv
2. **Conexión a base de datos**: Configuración de Knex con MySQL
3. **Inicialización de diccionarios globales**: Carga de datos en memoria para optimizar consultas
4. **Configuración de Express**: Middlewares, CORS, body parser
5. **Carga de rutas**: Registro de endpoints por dominio
6. **Inicialización del buscador**: Configuración del motor de búsqueda

### 3.2 Variables Globales

El sistema utiliza variables globales para optimizar el rendimiento:

```javascript
global.knex                    // Instancia de Knex para BD
global.branchs_diccio         // Diccionario de sucursales
global.branch_enterprice_diccio // Relación sucursales-empresas
global.alias_busqueda         // Alias de búsqueda
global.enterprice_diccio      // Diccionario de empresas
global.category_diccio        // Diccionario de categorías
global.products_diccio        // Diccionario de productos por nombre
global.products_diccio_id     // Diccionario de productos por ID
global.precios_diccio         // Diccionario de precios actuales
```

### 3.3 Patrones de Diseño

- **Singleton Pattern**: Uso de variables globales para datos compartidos
- **Repository Pattern**: Modelos encapsulan el acceso a datos
- **Middleware Pattern**: Funciones de procesamiento transversal
- **MVC Pattern**: Separación de controladores, modelos y rutas

---

## 4. API Endpoints

### 4.1 Estructura de Rutas

- **/publico** - Endpoints públicos (sin autenticación)
- **/admin** - Endpoints administrativos (requieren autenticación)

### 4.2 Principales Dominios

1. **Búsqueda de Productos**
   - Búsqueda por nombre, categoría, empresa
   - Filtros por precio, ubicación
   - Sugerencias y autocompletado

2. **Gestión de Productos**
   - CRUD de productos
   - Importación masiva
   - Actualización de precios

3. **Categorías**
   - Gestión de categorías de productos
   - Jerarquías y relaciones

4. **Estadísticas**
   - Reportes de precios
   - Análisis de tendencias
   - Métricas de uso

5. **Administración de Usuarios**
   - Gestión de roles y permisos
   - Autenticación y autorización

---

## 5. Base de Datos

### 5.1 Tecnología
- **MySQL** como base de datos principal
- **Knex.js** como query builder
- Configuración optimizada para números decimales

### 5.2 Principales Tablas
- `products` - Productos
- `price_today` - Precios actuales
- `category` - Categorías
- `branch` - Sucursales
- `enterprice` - Empresas
- `alias_productos` - Alias de productos
- `alias_busqueda` - Alias de búsqueda
- `product_category` - Relación productos-categorías

### 5.3 Optimizaciones
- Uso de diccionarios en memoria para consultas frecuentes
- Índices en campos de búsqueda
- Normalización de nombres para búsquedas eficientes

---

## 6. Seguridad

### 6.1 Autenticación y Autorización
- Middleware de autenticación para rutas administrativas
- Control de roles y permisos
- Encriptación de contraseñas con bcrypt

### 6.2 CORS
- Configuración de orígenes permitidos
- Soporte para credenciales
- Políticas de seguridad por dominio

### 6.3 Validación
- Validación de entrada en controladores
- Sanitización de datos
- Manejo de errores estructurado

---

## 7. Rendimiento

### 7.1 Optimizaciones Implementadas
- Carga de datos en memoria al inicio
- Diccionarios globales para consultas rápidas
- Pool de conexiones configurado
- Normalización de strings para búsquedas

### 7.2 Monitoreo
- Logs de conexión y errores
- Métricas de rendimiento
- Timeouts configurados

---

## 8. Despliegue y Configuración

### 8.1 Variables de Entorno
```env
mysql_host=localhost
mysql_user=usuario
mysql_password=password
mysql_database=precios_db
service_port_api=3000
cors_origin=http://localhost:3000
```

### 8.2 Scripts Disponibles
- `npm start` - Inicia el servidor con nodemon
- Scripts de importación y mantenimiento en `/scripts`

---

## 9. Buenas Prácticas

### 9.1 Código
- Separación clara de responsabilidades
- Uso de middlewares para lógica transversal
- Documentación de funciones complejas
- Manejo estructurado de errores

### 9.2 Base de Datos
- Uso de transacciones cuando es necesario
- Consultas optimizadas con Knex
- Índices apropiados en campos de búsqueda
- Backup regular de datos

### 9.3 API
- Respuestas consistentes
- Códigos de estado HTTP apropiados
- Validación de entrada
- Rate limiting para endpoints críticos

---

## 10. Mantenimiento y Escalabilidad

### 10.1 Monitoreo
- Logs de aplicación
- Métricas de rendimiento
- Alertas de errores

### 10.2 Escalabilidad
- Arquitectura modular
- Separación de responsabilidades
- Posibilidad de microservicios futuros

### 10.3 Mantenimiento
- Scripts de migración
- Herramientas de importación
- Documentación actualizada

---

## 11. Glosario

- **API**: Interfaz de Programación de Aplicaciones
- **CRUD**: Create, Read, Update, Delete
- **CORS**: Cross-Origin Resource Sharing
- **Knex**: Query builder para bases de datos
- **Middleware**: Función que procesa requests antes de llegar al controlador
- **MVC**: Model-View-Controller (patrón arquitectónico)

---

_Este documento debe actualizarse ante cambios significativos en la arquitectura del sistema._ 