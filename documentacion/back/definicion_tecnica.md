# Definición Técnica del Backend

Este documento especifica los detalles técnicos del backend de forma abstracta para permitir su reconstrucción en otra tecnología.

## Tecnologías Utilizadas
- Node.js
- Express
- ORM/ODM (especificar si aplica)
- Base de datos (especificar tipo)
- Knex (migraciones y query builder)

## Estructura de Carpetas
- `controllers/`: Controladores de rutas
- `models/`: Modelos de datos
- `routes/`: Definición de endpoints
- `middleware/`: Lógica de autenticación y autorización
- `helpers/`: Utilidades y funciones auxiliares
- `scripts/`: Scripts de procesamiento y migración
- `migrations/`: Migraciones de base de datos (Knex)

## Dependencias Clave
Listar y describir las dependencias principales.

## Migraciones de Base de Datos (Knex)

El backend utiliza **Knex** para gestionar migraciones de base de datos de forma controlada.

- **Configuración:**
  - El archivo `knexfile.js` toma los datos de conexión desde el archivo `.env`.
  - Las migraciones se almacenan en el directorio `back/migrations/`.

- **Comandos principales:**
  - Crear una nueva migración:
    ```bash
    npx knex migrate:make nombre_migracion
    ```
  - Ejecutar todas las migraciones pendientes:
    ```bash
    npx knex migrate:latest
    ```
  - Revertir la última migración:
    ```bash
    npx knex migrate:rollback
    ```

- **Buenas prácticas:**
  - Versionar todas las migraciones en el repositorio.
  - No modificar migraciones ya aplicadas en producción; crear nuevas para cambios.
  - Mantener el esquema sincronizado entre entornos usando migraciones.

## Consideraciones de Portabilidad
- Separación de lógica de negocio y acceso a datos
- Uso de variables de entorno para configuración
- Documentación exhaustiva de endpoints y modelos

---

- [Volver al README del backend](./README.md)
- [Arquitectura](./arquitectura.md)
- [Endpoints](./endpoints.md) 