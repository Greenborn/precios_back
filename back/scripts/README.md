# Scripts de Mantenimiento

Este directorio contiene scripts para tareas de mantenimiento de la base de datos.

## recrear_price_today.js

Script para recrear completamente la tabla `price_today` con los últimos precios de cada artículo.

### ¿Qué hace?

- Vacía la tabla `price_today`
- Recalcula los últimos precios de cada producto por sucursal
- Solo incluye precios válidos (mayores a 0)
- Solo incluye precios de máximo un mes de antigüedad
- Procesa en chunks para evitar sobrecarga de memoria

### ¿Cuándo ejecutarlo?

- Después de importaciones masivas de datos históricos
- Cuando se detecten inconsistencias en la tabla `price_today`
- Como tarea de mantenimiento periódico
- Después de migraciones de base de datos

### Uso

```bash
cd back
node scripts/recrear_price_today.js
```

### Notas importantes

- El proceso puede tomar varios minutos dependiendo del volumen de datos
- Durante la ejecución, la tabla `price_today` quedará temporalmente vacía
- Se recomienda ejecutar en horarios de bajo tráfico
- El script muestra el progreso en tiempo real

### Configuración

El tamaño del chunk se puede configurar mediante la variable de entorno:

```bash
PRICE_TODAY_CHUNK_SIZE=5000 node scripts/recrear_price_today.js
```

## actualizar_price_today.js

Script que actualiza incrementalmente la tabla `price_today` (usado internamente, no ejecutar manualmente).

## definir_ultimo_precio.js

Script legacy para definir últimos precios (usar `recrear_price_today.js` en su lugar).

## set_name_price_today.js

Script para actualizar los nombres de productos en `price_today`.
