# Incremento acumulado interdiario

**Descripción resumida:**
Este gráfico te muestra, día a día, cómo se van sumando los aumentos promedio de precios. Así podés ver de un vistazo cuánto subieron (o bajaron) los precios en total a lo largo del tiempo.

![Ver gráfico](graficos/incremento_acumulado_interdiario.svg)

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
   - El incremento acumulado se obtiene sumando día a día los incrementos porcentuales promedio.
   - El resultado se grafica para mostrar la evolución total de los precios a lo largo del tiempo.

---

## Justificación y utilidad

Este gráfico es útil porque permite visualizar el efecto acumulativo de los pequeños cambios diarios en los precios, mostrando el impacto real de la inflación o deflación en el tiempo. Es una herramienta clave para entender tendencias de largo plazo y comunicar de manera clara el comportamiento agregado de los precios.

---

> _Transparencia:_ El análisis y la generación de este gráfico fueron asistidos mediante herramientas de inteligencia artificial para asegurar rigurosidad y claridad. 