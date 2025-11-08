# Definición Técnica del Backend

Este documento especifica los detalles técnicos del backend de forma abstracta para permitir su reconstrucción en otra tecnología.

## Tecnologías Utilizadas
- Node.js
- Express
- ORM/ODM (especificar si aplica)
- Base de datos (especificar tipo)
- Knex (migraciones y query builder)

## Zona horaria y manejo de fechas

El backend establece `process.env.TZ = 'America/Argentina/Buenos_Aires'` y maneja el "día actual" con hora local (UTC-3). Las limpiezas de datos temporales usan `setHours(0,0,0,0)`. La serialización a ISO (`toISOString`) se utiliza cuando corresponde, pero no se emplea `setUTCHours` para cálculos diarios.

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

### Advertencia sobre el procesamiento secuencial de la cola

Actualmente, la función que procesa la cola (`procesarColaProc`) utiliza un ciclo `while` con `await` para procesar los items uno a uno de forma estrictamente secuencial. Esto implica:
- Solo se procesa un item a la vez, sin paralelismo.
- Si un item es lento o queda colgado, la cola se detiene hasta que termine o falle.
- Un item defectuoso puede provocar loops rápidos de reintentos y bloquear la cola.
- No se aprovecha el hardware para procesamiento concurrente.

**Para cargas bajas o moderadas esto es suficiente, pero para cargas altas o producción crítica se recomienda:**
- Implementar procesamiento en paralelo controlado (pool de workers, Promise.all por lotes, etc.).
- Agregar timeouts y backoff para reintentos.
- Persistir la cola para evitar pérdida de datos ante caídas.

Esta limitación está documentada para futuras mejoras del sistema.

### Aclaración sobre el uso de `marcarColaNoVacia`

- **Con worker periódico (setInterval):**
  - No es obligatorio llamar a `marcarColaNoVacia` al agregar elementos a la cola, ya que el worker revisa periódicamente el estado real de la cola y ajusta el estado interno automáticamente.
  - El callback `onEmpty` se ejecutará correctamente una sola vez por transición a vacía, aunque haya un pequeño retraso hasta el próximo ciclo del worker.

- **Con procesamiento por evento (sin worker):**
  - Si solo procesas la cola cuando agregas elementos (sin worker periódico), entonces sí debes llamar a `marcarColaNoVacia` cada vez que agregues un elemento, para que el callback `onEmpty` funcione correctamente.

**Patrón recomendado:**
- Para la mayoría de los casos con worker periódico, puedes omitir `marcarColaNoVacia` y el sistema funcionará bien.
- Documenta el comportamiento esperado para el equipo y ajusta según el modelo de procesamiento que uses.

## Actualización automática de la serie compilada al vaciarse la cola de productos

Cuando la cola de productos (`colaProcProductos`) queda vacía, el sistema ejecuta automáticamente el script:

```bash
node scripts/resetear_serie_compilada_media_interdiaria.js price_today --no-truncate
```

Esto actualiza la tabla `serie_compilada_media_interdiaria` solo para los días presentes en `price_today`, sin borrar el historial previo (gracias al argumento `--no-truncate`).

- **Ventaja:** Permite mantener la serie compilada siempre al día con los precios más recientes, sin perder el historial de días anteriores.
- **Uso recomendado:** Este proceso es automático y no requiere intervención manual, pero puede ejecutarse manualmente si es necesario.

### Mecanismo de limpieza automática de `price_today`

La tabla `price_today` está diseñada para contener únicamente los precios correspondientes al día actual. Para garantizar esto, el sistema implementa la siguiente lógica:

- **Limpieza automática al registrar un nuevo precio:**
  - Cada vez que se registra un nuevo precio (ya sea por importación masiva, carga manual o actualización), el controlador ejecuta una limpieza previa de la tabla `price_today`.
  - Se eliminan todos los registros cuya columna `date_time` sea anterior al día actual (es decir, menor a las 00:00:00 del día en curso).
  - Solo después de esta limpieza se inserta el nuevo precio correspondiente.

**Ventajas de este enfoque:**
- La limpieza es centralizada y automática, sin depender del endpoint específico que realice la operación.
- Se evita la acumulación de precios antiguos y se garantiza que los análisis y reportes sobre `price_today` reflejen únicamente los datos vigentes.

**Referencia de implementación:**
- Ver función `nuevo_reg_precio` en `back/controllers/importar_productos.js`:
  ```js
  // Limpiar price_today para dejar solo los precios del día actual
  const HOY = new Date(fecha_registro)
  HOY.setHours(0,0,0,0)
  await trx('price_today').where('date_time', '<', HOY).del();
  ```

### Limpieza automática de `estadistica_aumento_diario` y `promociones_hoy`

La limpieza de datos temporales usa inicio de día en hora local (UTC-3):

- Al vaciarse `colaProcProductos` se ejecuta un callback `onEmpty` que, además de actualizar la serie compilada, elimina registros en `estadistica_aumento_diario` con `fecha_utlimo_precio` anterior a `HOY` (inicio del día local).
- Al vaciarse `colaProcOfertas` se eliminan registros en `promociones_hoy` con `fecha` anterior a `HOY`.
- Cálculo de `HOY`:
  ```js
  let HOY = new Date();
  HOY.setHours(0,0,0,0);
  ```

Esto mantiene las tablas temporales consistentes con el día operativo local del sistema.

## Limpieza diaria automática de tablas temporales

Para asegurar que los análisis y reportes reflejen únicamente los datos vigentes del día actual, el backend implementa una limpieza automática diaria en las siguientes tablas:

- **estadistica_aumento_diario**: Solo contiene registros del día actual (campo `fecha_utlimo_precio`). Antes de procesar cada lote de importación de productos, se eliminan todos los registros cuya fecha sea anterior a las 00:00:00 del día en curso.
- **promociones_hoy**: Solo contiene promociones vigentes del día actual (campo `fecha`). Antes de procesar cada lote de importación de ofertas, se eliminan todos los registros cuya fecha sea anterior a las 00:00:00 del día en curso.

**Ventajas de este enfoque:**
- Garantiza que los datos temporales estén siempre actualizados y no se acumulen registros antiguos.
- Simplifica la lógica de consulta y análisis, ya que no es necesario filtrar por fecha en cada consulta.
- El proceso es automático y transparente para el usuario y los sistemas integrados.

**Referencia de implementación:**
- Ver lógica en `back/routes/productos.js`, en los ciclos de procesamiento de productos y ofertas.

---

- [Volver al README del backend](./README.md)
- [Arquitectura](./arquitectura.md)
- [Endpoints](./endpoints.md)