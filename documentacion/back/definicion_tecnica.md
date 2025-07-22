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

## Serie Compilada Media Interdiaria

La tabla `serie_compilada_media_interdiaria` almacena estadísticas diarias de los incrementos interdiarios de precios, calculadas a partir de la tabla `price`.

- **Campos principales:**
  - `date`: Fecha de la estadística
  - `mean_inc`: Media de los incrementos interdiarios
  - `median_inc`: Mediana de los incrementos interdiarios
  - `std_inc`: Desviación estándar de los incrementos interdiarios
  - `count`: Cantidad de productos considerados
  - `inc_acumulado`: Incremento acumulado desde 2024-01-01 (composición multiplicativa)

### ¿Qué significa el incremento acumulado?

El campo `inc_acumulado` representa el aumento porcentual acumulado de los precios desde el 2024-01-01 hasta la fecha correspondiente, calculado de manera compuesta (multiplicativa). Por ejemplo, un valor de 166.223% significa que los precios se multiplicaron por 2.66223 respecto al valor inicial:

- Si el precio era $100 el 2024-01-01, al final del período sería $266,22.
- Fórmula: `Precio final = Precio inicial × (1 + inc_acumulado/100)`

### Proceso de cálculo y guardado

- El script `resetear_serie_compilada_media_interdiaria.js` recorre todos los productos y genera una serie diaria forward-fill desde 2024-01-01.
- Calcula el incremento interdiario para cada día y compila estadísticas diarias (media, mediana, std, count).
- El incremento acumulado se calcula día a día usando composición multiplicativa:
  - `inc_acumulado_día_n = ((1 + inc_acumulado_{n-1}/100) × (1 + mean_inc/100) - 1) × 100`
- Los resultados se guardan en la tabla `serie_compilada_media_interdiaria`.

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