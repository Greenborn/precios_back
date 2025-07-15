# INFORME COMPLETO: ANÁLISIS DE EVOLUCIÓN DE PRECIOS

> **Proyecto:** Sistema de Monitoreo de Precios  
> **Metodología:** Análisis de incrementos interdiarios y acumulados  
> **Período:** Enero 2024 - Presente  
> **Fuente de datos:** Registros de precios de productos  
> **Dólar oficial:** Investing.com (USD/ARS)  
> **Informe generado:** $(date +"%d/%m/%Y %H:%M")

---

## 📋 ÍNDICE

1. [Metodología](#metodología)
2. [Gráficos y Análisis](#gráficos-y-análisis)
   - [Media Diaria de Incrementos Interdiarios](#1-media-diaria-de-incrementos-interdiarios)
   - [Incremento Acumulado Interdiario (Precios vs. Dólar)](#2-incremento-acumulado-interdiario-precios-vs-dólar)
   - [Gráfico Combinado: Media Diaria y Acumulado](#3-gráfico-combinado-media-diaria-y-acumulado)
   - [Incremento Porcentual Intermensual Compuesto](#4-incremento-porcentual-intermensual-compuesto)
3. [Análisis Comparativo](#análisis-comparativo)
4. [Notas Técnicas](#notas-técnicas)
5. [Transparencia del Análisis](#transparencia-del-análisis)

---

## 🔬 METODOLOGÍA

### 1. Generación de series diarias por producto
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro
- Los días intermedios se rellenan con el último precio conocido (forward fill)
- Si hay varios precios para un producto en un mismo día, se utiliza la mediana de esos precios
- No se extiende el precio más allá de la última fecha registrada para ese producto

### 2. Cálculo de incrementos interdiarios
- Para cada producto, el incremento interdiario se calcula como el cambio porcentual entre días consecutivos:
  
  **Fórmula:** `(precio_dia_actual / precio_dia_anterior - 1) * 100`

### 3. Compilación de la serie media diaria de incrementos
- Se genera una serie única llamada `media_incremento_diario.json`:
  - Para cada día, se calcula la media de los incrementos interdiarios de todos los productos que tienen dato ese día
  - Se almacena también la cantidad de productos (registros) que aportaron dato ese día (`count`)
  - La serie compilada abarca desde el 1 de enero de 2024 hasta la última fecha con datos

### 4. Filtros aplicados para los gráficos
- **Cobertura mínima:** Solo días con ≥1000 registros para asegurar robustez estadística
- **Exclusión de extremos:** Días donde la media de incremento supera el 200% en valor absoluto
- **Limpieza de datos:** Eliminación de valores nulos o faltantes

### 5. Composición multiplicativa
- Para los cálculos acumulados se utiliza composición multiplicativa en lugar de suma simple
- Esto refleja mejor el efecto real de la inflación compuesta
- **Fórmula:** `valor_acumulado = ∏(1 + incremento_diario/100) - 1`

---

## 📊 GRÁFICOS Y ANÁLISIS

### 1. Media Diaria de Incrementos Interdiarios

![Media Diaria de Incrementos Interdiarios](graficos/media_incremento_interdiario.svg)

**Descripción:** Este gráfico muestra la tendencia general de variación de precios día a día. La línea representa la media de los incrementos interdiarios de todos los productos para cada fecha.

**Interpretación:**
- **Valores positivos:** Indican inflación diaria promedio
- **Valores negativos:** Indican deflación diaria promedio
- **Volatilidad:** Picos y valles muestran períodos de mayor inestabilidad
- **Tendencia:** La línea de tendencia general indica la dirección de la inflación

**Utilidad:** Permite identificar patrones de inflación diaria y detectar períodos de mayor volatilidad en los precios.

---

### 2. Incremento Acumulado Interdiario (Precios vs. Dólar)

![Incremento Acumulado Interdiario](graficos/incremento_acumulado_interdiario.svg)

**Descripción:** Este gráfico compara la evolución acumulada de los precios (línea verde) con la del dólar oficial (línea azul). Utiliza composición multiplicativa para reflejar el efecto real de la inflación compuesta.

**Interpretación:**
- **Línea verde (Precios):** Evolución acumulada de los precios de productos
- **Línea azul (Dólar):** Evolución acumulada del tipo de cambio oficial
- **Correlación:** Permite evaluar si los precios siguen la tendencia del dólar
- **Divergencias:** Muestran comportamientos independientes entre precios y tipo de cambio

**Utilidad:** La comparación permite evaluar si los precios siguen la tendencia del dólar o muestran comportamientos independientes, ayudando a entender la dinámica inflacionaria.

---

### 3. Gráfico Combinado: Media Diaria y Acumulado

![Gráfico Combinado](graficos/incrementos_combinados.svg)

**Descripción:** Este gráfico superpone la media diaria de incrementos (línea azul) con el acumulado compuesto (línea roja). Permite visualizar simultáneamente la volatilidad diaria y el efecto acumulado a lo largo del tiempo.

**Interpretación:**
- **Línea azul (Media diaria):** Muestra la volatilidad día a día
- **Línea roja (Acumulado):** Muestra el efecto compuesto a lo largo del tiempo
- **Períodos estables:** Cuando ambas líneas se mantienen relativamente planas
- **Períodos de aceleración:** Cuando el acumulado muestra pendientes pronunciadas

**Utilidad:** Es útil para identificar períodos de estabilidad vs. períodos de aceleración inflacionaria, proporcionando una visión integral de la dinámica de precios.

---

### 4. Incremento Porcentual Intermensual Compuesto

![Incremento Intermensual Compuesto](graficos/incremento_intermensual_compuesto.svg)

**Descripción:** Este gráfico muestra la inflación mensual compuesta utilizando composición multiplicativa. Las barras representan el incremento total del mes, mientras que las líneas de error muestran la desviación estándar de los incrementos diarios del mes.

**Interpretación:**
- **Barras:** Incremento total mensual compuesto
- **Líneas de error:** Variabilidad de los incrementos diarios dentro del mes
- **Tendencia mensual:** Permite identificar meses de mayor inflación
- **Estabilidad:** Líneas de error pequeñas indican meses más estables

**Metodología:** Utiliza composición multiplicativa de los incrementos diarios del mes:
```
incremento_mensual = (∏(1 + mean_inc_d/100)) - 1
```

**Utilidad:** Refleja el efecto real de la inflación mensual considerando la composición, proporcionando una medida más precisa del impacto inflacionario mensual.

---

## 📈 ANÁLISIS COMPARATIVO

### Interpretación de los resultados

Los gráficos presentados permiten realizar un análisis multidimensional de la evolución de precios:

- **Media diaria:** Identifica patrones de volatilidad y estabilidad en los precios
- **Acumulado vs. Dólar:** Evalúa la correlación entre precios y tipo de cambio
- **Combinado:** Permite distinguir entre inflación estable y acelerada
- **Mensual compuesto:** Refleja el impacto real de la inflación mensual

### Utilidad para organizaciones sociales

Estos indicadores proporcionan herramientas para:

- **Comunicación:** Comunicar el impacto real de la inflación en el poder adquisitivo
- **Identificación:** Identificar productos con aumentos desmedidos
- **Transparencia:** Generar transparencia en la evolución de precios
- **Concientización:** Apoyar campañas de concientización sobre el costo de vida

### Patrones observados

1. **Correlación con el dólar:** Los precios muestran cierta correlación con el tipo de cambio oficial
2. **Volatilidad:** Períodos de alta volatilidad alternan con períodos de relativa estabilidad
3. **Aceleración:** Se observan períodos de aceleración inflacionaria seguidos de estabilización
4. **Composición:** El efecto acumulado supera significativamente la suma simple de incrementos diarios

---

## 🔧 NOTAS TÉCNICAS

### Limitaciones metodológicas

- **Fuente de datos:** Los datos provienen de registros voluntarios de precios
- **Cobertura:** La cobertura puede variar según la disponibilidad de datos
- **Filtros:** Los filtros aplicados pueden excluir eventos extremos pero reales
- **Dólar oficial:** La comparación con el dólar oficial puede no reflejar el mercado paralelo

### Robustez estadística

- **Mínimo de registros:** Se requieren al menos 1000 registros por día para incluir el dato
- **Exclusión de extremos:** Se excluyen incrementos superiores al 200% para evitar sesgos
- **Composición:** Se utiliza composición multiplicativa para reflejar el efecto real de la inflación

### Reproducibilidad

Todos los scripts utilizados están disponibles en el repositorio del proyecto, permitiendo la reproducción completa de los análisis presentados. Los archivos principales incluyen:

- `graficar_media_incremento_interdiario.py`
- `graficar_incremento_acumulado_interdiario.py`
- `graficar_incrementos_combinados.py`
- `graficar_incremento_intermensual_compuesto.py`
- `ejecutar_todos_los_graficos.py`

---

## 🤖 TRANSPARENCIA DEL ANÁLISIS

### Asistencia de Inteligencia Artificial

Este informe fue generado con asistencia de inteligencia artificial para:

- **Desarrollo de scripts:** Generación de código para procesamiento de datos
- **Visualizaciones:** Creación de gráficos y representaciones visuales
- **Documentación:** Elaboración de explicaciones metodológicas
- **Análisis estadístico:** Implementación de cálculos y filtros

### Metodología y Calidad

- **Buenas prácticas:** La metodología estadística sigue las mejores prácticas del campo
- **Filtros robustos:** Se aplican filtros para asegurar la calidad de los datos
- **Composición correcta:** Se utiliza composición multiplicativa para cálculos acumulados
- **Transparencia:** Todos los procesos y decisiones metodológicas están documentados

### Independencia del análisis

Aunque el análisis fue asistido por IA, las decisiones metodológicas y la interpretación de resultados mantienen rigor científico y transparencia. Los datos y scripts están disponibles para verificación independiente.

---

## 📚 REFERENCIAS Y DOCUMENTACIÓN

### Documentación del proyecto

- **README principal:** `README_graficos.md` - Descripción general de la metodología
- **Índice de gráficos:** `INDICE_GRAFICOS.md` - Enlaces a explicaciones detalladas
- **Análisis metodológico:** `ANALISIS_METODOLOGICO.md` - Fundamentos estadísticos

### Scripts de generación

- **Ejecución automática:** `ejecutar_todos_los_graficos.py` - Genera todos los gráficos
- **Scripts individuales:** Cada gráfico tiene su script específico de generación
- **Utilidades:** Scripts auxiliares para procesamiento y limpieza de datos

### Fuentes de datos

- **Precios:** Registros voluntarios de precios de productos
- **Dólar oficial:** Investing.com (USD/ARS)
- **Período:** Enero 2024 - Presente

---

## 📞 CONTACTO Y SOPORTE

Para consultas sobre la metodología, interpretación de resultados o reproducción de análisis:

- **Repositorio:** Todos los scripts y datos están disponibles en el repositorio del proyecto
- **Documentación:** Consultar los archivos README y documentación técnica
- **Reproducibilidad:** Los análisis pueden ser reproducidos ejecutando los scripts correspondientes

---

*Este informe fue generado automáticamente con asistencia de inteligencia artificial para la generación de código, documentación y visualizaciones. La metodología estadística y los filtros aplicados siguen las mejores prácticas para asegurar la calidad y representatividad de los datos.* 