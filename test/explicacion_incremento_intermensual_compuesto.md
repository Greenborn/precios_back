# Incremento porcentual intermensual compuesto (precios vs. dólar)

**Descripción resumida:**
Este gráfico muestra el aumento total de precios y del dólar mes a mes, calculado de forma compuesta (teniendo en cuenta el efecto acumulativo real). Incluye barras de error para los precios y permite comparar ambas curvas.

![Ver gráfico](graficos/incremento_intermensual_compuesto.svg)

---

## Detalle metodológico

1. **Obtención de precios y dólar:**
   - Los precios se recolectan automáticamente mediante bots y se exportan en archivos `.csv`.
   - El precio del dólar se obtuvo de [Investing.com](https://www.investing.com/currencies/usd-ars-historical-data) y se importó como CSV histórico.

2. **Procesamiento de datos:**
   - Limpieza y validación de los `.csv`.
   - Agrupación de precios por producto y día (mediana), generación de series diarias completas (forward fill).
   - El dólar se ordena y se calcula su variación diaria.

3. **Cálculo de incrementos mensuales compuestos:**
   - Para ambos, se calcula el incremento porcentual diario y luego se compone multiplicativamente para cada mes.
   - Para los precios, se calcula además la desviación estándar diaria como barra de error.

4. **Construcción del gráfico:**
   - Se grafican ambas curvas mensuales compuestas: precios (naranja, con barras de error) y dólar (azul), permitiendo la comparación directa.

---

## Justificación y utilidad

Comparar la evolución mensual compuesta de precios y dólar permite analizar si la inflación sigue, supera o queda por debajo de la devaluación. Es fundamental para entender la dinámica de precios y su relación con el tipo de cambio en períodos de alta volatilidad.

---

> _Transparencia:_ El análisis y la generación de este gráfico fueron asistidos mediante herramientas de inteligencia artificial para asegurar rigurosidad y claridad. 