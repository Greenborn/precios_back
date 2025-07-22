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

## Proceso de Actualización de Precios

### Descripción general

El proceso de actualización de precios en el backend está diseñado para mantener un historial completo de cambios, asegurar la integridad de los datos y permitir análisis avanzados. Incluye:
- Ingreso manual o masivo de precios (endpoints y scripts)
- Validaciones y límites por IP, producto y sucursal
- Registro de cada cambio en la tabla `price` (histórico) y actualización de `price_today` (último valor)
- Cálculo y registro de variaciones porcentuales en `estadistica_aumento_diario`
- Actualización de estadísticas agregadas
- Uso de colas y workers para procesamiento batch

### Puntos fuertes
- **Historial completo:** Permite trazabilidad y análisis temporal.
- **Control de abusos:** Rate limiting y controles por IP/producto/negocio.
- **Registro de variaciones:** Facilita análisis de incrementos y alertas.
- **Procesamiento batch:** Escalable para grandes volúmenes.

### Oportunidades de mejora
1. **Atomicidad y transacciones:** Garantizar que todos los cambios relacionados estén siempre en la misma transacción.
2. **Validación de datos:** Usar librerías robustas para evitar errores de tipo o valores atípicos.
3. **Optimización de queries:** Mantener índices adecuados en tablas grandes.
4. **Manejo de precios negativos o nulos:** Prevenir registros inválidos.
5. **Auditoría y logs:** Agregar logs de auditoría para cambios críticos.
6. **Documentación y ejemplos:** Explicar claramente los flujos y campos clave.
7. **Pruebas automatizadas:** Incorporar tests unitarios y de integración.

### Opinión general

El proceso es robusto y flexible, adecuado para sistemas que requieren historial y trazabilidad. Las mejoras sugeridas apuntan a escalar, validar y automatizar aún más el flujo de actualización de precios.

## Cola de Procesamiento de Productos (`colaProcProductos`)

### ¿Qué es?

La cola `colaProcProductos` es una estructura en memoria utilizada para procesar de manera asíncrona y por lotes la importación y actualización masiva de productos y precios.

### Funcionamiento
- Los productos a importar se agregan a la cola mediante el endpoint `/importar` u otros flujos batch.
- Un worker (ciclo con `setInterval`) cada 2 segundos toma hasta 50 items de la cola y los procesa uno a uno.
- Por cada item, se ejecuta un callback asíncrono que realiza la inserción/actualización de precios y estadísticas en la base de datos, usando transacciones.
- Si ocurre un error al procesar un item, este se re-agrega al final de la cola para reintentar más tarde.
- El procesamiento es secuencial (o por lotes pequeños), lo que evita saturar el servidor.

### Manejo de errores y reintentos
- Los items que fallan se reintentan automáticamente.
- No hay backoff exponencial ni límite de reintentos: un item defectuoso puede quedarse en la cola indefinidamente.

### Limitaciones
- **Persistencia:** La cola solo existe en memoria. Si el proceso se reinicia, se pierden los items pendientes.
- **Paralelismo:** El procesamiento es secuencial; no hay procesamiento paralelo salvo que se modifique el worker.
- **Monitoreo:** No hay métricas ni alertas automáticas sobre el tamaño de la cola o errores recurrentes.

### Recomendaciones
- Para entornos de producción críticos, considerar persistir la cola en una tabla temporal o sistema de colas externo (ej: Redis, RabbitMQ).
- Agregar métricas y alertas para monitorear el tamaño de la cola y los errores.
- Implementar backoff exponencial o límite de reintentos para evitar loops infinitos con items defectuosos.
- Documentar claramente el flujo para el equipo de desarrollo y operaciones.

---

- [Volver al README del backend](./README.md)
- [Arquitectura](./arquitectura.md)
- [Endpoints](./endpoints.md) 