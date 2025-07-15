# Incremento porcentual intermensual compuesto

**Descripción resumida:**
Este gráfico muestra el aumento total de precios mes a mes, calculado de forma compuesta (teniendo en cuenta el efecto acumulativo real). Incluye barras de error para mostrar la variabilidad diaria dentro de cada mes.

![Ver gráfico](graficos/incremento_intermensual_compuesto.svg)

---

## Detalle metodológico

1. **Obtención de precios:**
   Los precios se recolectan automáticamente mediante bots que consultan fuentes públicas y privadas. Los datos se exportan en archivos `.csv` para su posterior análisis.

2. **Procesamiento de datos:**
   - Limpieza y validación de los `.csv`.
   - Agrupación de precios por producto y día, usando la mediana si hay varios valores.
   - Generación de series diarias completas por producto (relleno forward fill).

3. **Cálculo de incrementos diarios y mensuales:**
   - Se calcula el incremento porcentual entre días consecutivos para cada producto.
   - Se obtiene la media diaria de estos incrementos, aplicando filtros de calidad (≥1000 registros, sin extremos).
   - Para cada mes, se compone el incremento mensual de manera multiplicativa, reflejando el efecto real acumulado.
   - Se calcula la desviación estándar diaria como barra de error.

4. **Construcción del gráfico:**
   - Se grafica el incremento mensual compuesto y sus barras de error para cada mes.

---

## Justificación y utilidad

Este gráfico es útil para analizar la inflación mensual real, considerando el efecto compuesto de los incrementos diarios. Permite comparar meses y detectar períodos de mayor o menor variabilidad en los precios.

---

> _Transparencia:_ El análisis y la generación de este gráfico fueron asistidos mediante herramientas de inteligencia artificial para asegurar rigurosidad y claridad. 