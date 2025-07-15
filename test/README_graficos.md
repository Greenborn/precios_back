# Análisis y Visualización de Incrementos de Precios

> **Ver también:** [Índice de gráficos y explicaciones](INDICE_GRAFICOS.md)

> **Nota metodológica:**
> La justificación estadística y el análisis crítico de la metodología utilizada para estos gráficos se encuentra en el archivo [`ANALISIS_METODOLOGICO.md`](./ANALISIS_METODOLOGICO.md). Se recomienda consultarlo para comprender los fundamentos, alcances y limitaciones de los indicadores y visualizaciones presentados aquí.

Cada gráfico generado cuenta con su propio documento explicativo, accesible desde el índice anterior.

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
  - Script: `graficar_media_incremento_interdiario.py`
  - Archivo: `media_incremento_interdiario.svg`
  - Eje X: Fecha
  - Eje Y: Media diaria de incrementos interdiarios (%)
  - Solo días con ≥1000 registros y sin extremos >200%
  - Uso:
    ```bash
    python graficar_media_incremento_interdiario.py [json_entrada] [svg_salida]
    ```

- **Incremento interdiario acumulado:**
  - Script: `graficar_incremento_acumulado_interdiario.py`
  - Archivo: `incremento_acumulado_interdiario.svg`
  - Eje X: Fecha
  - Eje Y: Suma acumulada de la media diaria de incrementos interdiarios (%)
  - Solo días con ≥1000 registros y sin extremos >200%
  - Uso:
    ```bash
    python graficar_incremento_acumulado_interdiario.py [json_entrada] [svg_salida]
    ```

- **Gráfico combinado (media diaria y acumulado):**
  - Script: `graficar_incrementos_combinados.py`
  - Archivo: `incrementos_combinados.svg`
  - Eje X: Fecha
  - Eje Y: Porcentaje (%)
  - Dos líneas: media diaria de incrementos interdiarios (%) y acumulado (%)
  - Solo días con ≥1000 registros y sin extremos >200%
  - Uso:
    ```bash
    python graficar_incrementos_combinados.py [json_entrada] [svg_salida]
    ```

- **Incremento porcentual intermensual compuesto:**
  - Script: `graficar_incremento_intermensual_compuesto.py`
  - Archivo: `incremento_intermensual_compuesto.svg`
  - Eje X: Mes (YYYY-MM)
  - Eje Y: Incremento porcentual mensual compuesto (%)
  - Metodología: composición multiplicativa de los incrementos diarios del mes:
    \[
    (\prod_{d \in mes} (1 + mean\_inc_d/100)) - 1
    \]
  - Barras de error: desviación estándar de los incrementos diarios del mes.
  - Uso:
    ```bash
    python graficar_incremento_intermensual_compuesto.py [json_entrada] [svg_salida]
    ```

- **Cantidad de registros por día:**
  - Archivo: `cantidad_registros.svg`
  - Eje X: Fecha
  - Eje Y: Cantidad de productos con dato ese día
  - Solo días con ≥1000 registros y sin extremos >200%

- **Aumento intermensual (suma simple):**
  - Archivo: `aumento_intermensual.svg`
  - Eje X: Mes
  - Eje Y: Suma de la media diaria de incrementos interdiarios de cada mes (%)
  - Solo días con ≥1000 registros y sin extremos >200%

- **Ejecución automática de todos los gráficos:**
  - Script: `graficar_todos_los_graficos.py`
  - Ejecuta todos los scripts de graficado relevantes y genera todos los SVGs automáticamente.
  - Uso:
    ```bash
    python graficar_todos_los_graficos.py
    ```

---

## Interpretación social y utilidad

- **Media diaria de incrementos:**
  - Permite ver la tendencia general de variación de precios día a día.
- **Incremento acumulado:**
  - Muestra el efecto compuesto de los incrementos diarios a lo largo del tiempo.
- **Gráfico combinado:**
  - Permite comparar visualmente la variación diaria y el efecto acumulado.
- **Incremento mensual compuesto:**
  - Refleja el efecto real de la inflación mensual, considerando la composición multiplicativa.
- **Aumento intermensual (suma simple):**
  - Permite comparar la inflación mensual de manera agregada, aunque no compuesta.
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