# Análisis y Visualización de Incrementos de Precios

Este conjunto de scripts permite analizar la evolución de los precios de productos, generando gráficos claros y útiles para organizaciones que buscan transparencia y medir el impacto de los precios en el poder adquisitivo.

## Metodología de cálculo (actualizada)

### 1. Generación de series diarias por producto
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro.
- Los días intermedios se rellenan con el último precio conocido (forward fill).
- Si hay varios precios para un producto en un mismo día, se utiliza la mediana de esos precios.
- No se extiende el precio más allá de la última fecha registrada para ese producto.

### 2. Cálculo de incrementos interdiarios
- Para cada producto, el incremento interdiario se calcula como el cambio porcentual entre días consecutivos:
  
  `(precio_dia_actual / precio_dia_anterior - 1) * 100`

### 3. Compilación de la serie media diaria de incrementos
- Se genera una serie única llamada `media_incremento_diario.json`:
  - Para cada día, se calcula la media de los incrementos interdiarios de todos los productos que tienen dato ese día.
  - Se almacena también la cantidad de productos (registros) que aportaron dato ese día (`count`).
  - La serie compilada abarca desde el 1 de enero de 2024 hasta la última fecha con datos.

### 4. Filtros aplicados para los gráficos
- Solo se consideran los días donde la cantidad de registros es mayor o igual a 1000 (`count >= 1000`).
- Se excluyen los días donde la media de incremento interdiario supera el 200% en valor absoluto (`abs(mean_inc) <= 200`).

### 5. Gráficos generados a partir de la serie compilada

- **Media diaria de incrementos interdiarios:**
  - Archivo: `serie_compilada.svg`
  - Eje X: Fecha
  - Eje Y: Media diaria de incrementos interdiarios (%)
  - Solo días con ≥1000 registros y sin extremos >200%

- **Cantidad de registros por día:**
  - Archivo: `cantidad_registros.svg`
  - Eje X: Fecha
  - Eje Y: Cantidad de productos con dato ese día
  - Solo días con ≥1000 registros y sin extremos >200%

- **Incremento interdiario acumulado:**
  - Archivo: `incremento_acumulado.svg`
  - Eje X: Fecha
  - Eje Y: Suma acumulada de la media diaria de incrementos interdiarios (%)
  - Solo días con ≥1000 registros y sin extremos >200%

- **Aumento intermensual:**
  - Archivo: `aumento_intermensual.svg`
  - Eje X: Mes
  - Eje Y: Suma de la media diaria de incrementos interdiarios de cada mes (%)
  - Solo días con ≥1000 registros y sin extremos >200%

---

## Interpretación social y utilidad

- **Media diaria de incrementos:**
  - Permite ver la tendencia general de variación de precios día a día.
- **Incremento acumulado:**
  - Muestra el efecto compuesto de los incrementos diarios a lo largo del tiempo.
- **Aumento intermensual:**
  - Permite comparar la inflación mensual y detectar meses con aumentos o caídas inusuales.
- **Cantidad de registros:**
  - Es fundamental para evaluar la robustez de las estadísticas y detectar días con poca información.

## Objetivo

Estos gráficos están pensados para organizaciones y movimientos sociales que buscan:
- Transparencia en la evolución de los precios.
- Herramientas para comunicar el impacto real de la inflación en el poder adquisitivo.
- Identificar productos problemáticos o aumentos desmedidos.

## Notas
- Todos los gráficos se guardan en formato SVG en la carpeta `test/graficos/`.
- La serie compilada y los gráficos aplican los filtros de cobertura y exclusión de valores extremos para asegurar la calidad de la información. 