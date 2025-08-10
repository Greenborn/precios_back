# Metodología de Exportación de Precios por Periodo

Este documento describe la metodología utilizada por el script `exportar_precios_por_fecha.js` para generar un archivo CSV con los precios registrados en un periodo determinado.

## Objetivo
Exportar todos los precios registrados entre dos fechas, asegurando que el primer día del periodo tenga precios para todos los productos presentes en el periodo, incluso si no fueron registrados ese día.

## Proceso

1. **Selección de productos**
   - Se identifican todos los productos que tienen al menos un precio registrado entre la fecha de inicio y la fecha de fin indicadas.

2. **Extracción de precios**
   - Se obtienen todos los precios registrados para esos productos en el periodo seleccionado.

3. **Completado de precios del primer día**
   - Para cada producto y sucursal, se verifica si existe un precio registrado el primer día del periodo.
   - Si no existe, se busca el último precio anterior a la fecha de inicio y se agrega al CSV como precio del primer día.
   - En estos casos, el campo `notas` indica la fecha real en que fue registrado el precio, con el formato: `registrado el: <fecha_real>`.

4. **Generación del archivo CSV**
   - El archivo generado se llama `precios_exportados_<fecha_inicio>_<fecha_fin>.csv`.
   - Los campos del archivo son:
     - **nombre producto**
     - **fecha** (formato YYYY-MM-DD)
     - **comercio** (nombre de la empresa)
     - **url**
     - **notas**

## Ejemplo de uso

```bash
node exportar_precios_por_fecha.js 2025-07-01 2025-07-31
```

## Consideraciones
- El archivo CSV no se incluye en el control de versiones (`.gitignore`).
- El script requiere conexión a la base de datos MySQL, configurada en el archivo `.env`.
- Los precios completados para el primer día permiten análisis comparativos y series temporales completas.
- Precios con primera fecha muy antiguos, pueden deberse a que por algún motivo no han tenido seguimiento.

## Contacto
Para dudas o mejoras, contactar al equipo de desarrollo del proyecto Precios.
