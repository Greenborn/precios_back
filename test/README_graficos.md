# Análisis y Visualización de Incrementos de Precios

Este conjunto de scripts permite analizar la evolución de los precios de productos, generando gráficos claros y útiles para organizaciones que buscan transparencia y medir el impacto de los precios en el poder adquisitivo.

## Metodología de cálculo

**Serie diaria por producto:**
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro.
- Los días intermedios se rellenan con el último precio conocido (forward fill).
- No se extiende el precio más allá de la última fecha registrada para ese producto.

**Cálculo de incrementos:**
- El incremento acumulado se calcula respecto al primer precio registrado de cada producto.
- El incremento interdiario se calcula como el cambio porcentual entre días consecutivos.
- El incremento intermensual se calcula como el cambio porcentual entre el último precio de cada mes y el del mes anterior.

**Cálculo de medias y medianas:**
- Para cada día/mes, la media y mediana se calculan solo con los productos que tienen precio válido ese día/mes (es decir, que tienen datos hasta esa fecha).

**Cobertura de datos:**
- En fechas recientes, si hay pocos productos con datos, la media/mediana puede ser menos representativa. Se recomienda analizar junto al gráfico de cantidad de precios por día.

---

## Ejecución

Para generar todos los gráficos de una vez, ejecuta:

```bash
python ejecutar_todos_los_graficos.py <cantidad_productos>
```

Ejemplo:
```bash
python ejecutar_todos_los_graficos.py 100
```

Esto borra todos los SVG anteriores y genera los nuevos para la cantidad de productos indicada. Los gráficos se guardan en `test/graficos/`.

---

## Scripts y gráficos generados

### 1. incremento_acumulado.py
- **Media y mediana diaria del incremento acumulado**
  - `grafico_media_incremento_acumulado_diario_<N>_productos_2024.svg`
  - `grafico_mediana_incremento_acumulado_diario_<N>_productos_2024.svg`
- **Media y mediana mensual del incremento acumulado**
  - `grafico_media_incremento_acumulado_mensual_<N>_productos_2024.svg`
  - `grafico_mediana_incremento_acumulado_mensual_<N>_productos_2024.svg`

**¿Qué significa?**
> Muestra cómo progresa el precio de todos los productos en porcentaje respecto al primer precio registrado. Es útil para ver la tendencia general y el impacto acumulado de la inflación o aumentos sostenidos.

---

### 2. incremento_interdiario.py
- **Media y mediana diaria del incremento interdiario**
  - `grafico_media_incremento_interdiario_<N>_productos_2024.svg`
  - `grafico_mediana_incremento_interdiario_<N>_productos_2024.svg`

**¿Qué significa?**
> Refleja la variación porcentual de precios de un día a otro. Permite detectar picos, caídas o estabilidad en la variación diaria de los precios.

---

### 3. incremento_intermensual.py
- **Media y mediana mensual del incremento intermensual**
  - `grafico_media_incremento_intermensual_<N>_productos_2024.svg`
  - `grafico_mediana_incremento_intermensual_<N>_productos_2024.svg`

**¿Qué significa?**
> Refleja la variación porcentual de precios de un mes a otro. Es útil para comparar la inflación mensual y detectar meses con aumentos o caídas inusuales.

---

### 4. cantidad_precios_por_dia.py
- **Cantidad de precios registrados por día**
  - `grafico_cantidad_precios_por_dia_<N>_productos_2024.svg`

**¿Qué significa?**
> Permite ver la cobertura de datos: cuántos productos tienen precio registrado cada día. Es importante para evaluar la robustez de las estadísticas y detectar días con poca información.

---

### 5. boxplot_incremento_acumulado_mensual.py
- **Boxplot de incremento acumulado mensual**
  - `boxplot_incremento_acumulado_mensual_<N>_productos_2024.svg`

**¿Qué significa?**
> Muestra la dispersión (variabilidad) de los incrementos acumulados por mes. Permite identificar si la mayoría de los productos suben de precio de manera similar o si hay productos con aumentos mucho mayores (o menores) que la media. Es clave para detectar desigualdades y productos fuera de control.

---

## Interpretación social y utilidad

- **Media vs. Mediana:**
  - Si la media es mucho mayor que la mediana, hay productos con aumentos extremos que afectan el promedio.
  - Si ambas son similares, la mayoría de los productos se comportan de manera parecida.
- **Boxplot:**
  - Un boxplot con bigotes largos o muchos outliers indica desigualdad en los aumentos.
- **Cobertura de datos:**
  - Días con pocos datos pueden sesgar las estadísticas. Es importante tener buena cobertura para conclusiones sólidas.

## Objetivo

Estos gráficos están pensados para organizaciones y movimientos sociales que buscan:
- Transparencia en la evolución de los precios.
- Herramientas para comunicar el impacto real de la inflación en el poder adquisitivo.
- Identificar productos problemáticos o aumentos desmedidos.

## Notas
- Todos los gráficos se guardan en formato SVG en la carpeta `test/graficos/`.
- El parámetro `<N>` en los nombres de archivo corresponde a la cantidad de productos procesados.
- Los scripts descartan productos que no tengan datos desde 2024. 