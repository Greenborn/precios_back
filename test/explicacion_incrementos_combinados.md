# Gráfico combinado: media diaria y acumulado de incrementos interdiarios

**Descripción resumida:**
En este gráfico podés ver juntos el cambio promedio diario y el acumulado a lo largo del tiempo. Es útil para comparar la tendencia diaria con el efecto total acumulado.

![Ver gráfico](graficos/incrementos_combinados.svg)

---

## Detalle metodológico

1. **Obtención de precios:**
   Los precios se recolectan automáticamente mediante bots que consultan fuentes públicas y privadas. Los datos se exportan en archivos `.csv` para su posterior análisis.

2. **Procesamiento de datos:**
   - Limpieza y validación de los `.csv`.
   - Agrupación de precios por producto y día, usando la mediana si hay varios valores.
   - Generación de series diarias completas por producto (relleno forward fill).

3. **Cálculo de incrementos diarios:**
   - Se calcula el incremento porcentual entre días consecutivos para cada producto.
   - Se obtiene la media diaria de estos incrementos, aplicando filtros de calidad (≥1000 registros, sin extremos).

4. **Construcción del gráfico:**
   - Se grafican en la misma figura la media diaria de incrementos y su acumulado, permitiendo comparar ambas tendencias.

---

## Justificación y utilidad

Este gráfico es útil para visualizar simultáneamente la variación diaria y el efecto acumulado, facilitando la interpretación de la dinámica de precios y su impacto a corto y largo plazo.

---

> _Transparencia:_ El análisis y la generación de este gráfico fueron asistidos mediante herramientas de inteligencia artificial para asegurar rigurosidad y claridad. 