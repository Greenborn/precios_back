"""
Script: boxplot_incremento_acumulado_mensual.py
Genera un gráfico de dispersión (boxplot) del incremento acumulado mensual de todos los productos.

Metodología:
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro.
- Los días intermedios se rellenan con el último precio conocido (forward fill).
- No se extiende el precio más allá de la última fecha registrada para ese producto.
- El incremento acumulado se calcula respecto al primer precio registrado de cada producto.
- Para cada mes, el boxplot muestra la dispersión de los incrementos acumulados de todos los productos válidos ese mes (último valor de cada mes).

Uso: python boxplot_incremento_acumulado_mensual.py <cantidad_productos>
"""
import sys
import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import glob
import numpy as np

if len(sys.argv) != 2:
    print("Uso: python boxplot_incremento_acumulado_mensual.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

graficos_dir = os.path.join(os.path.dirname(__file__), 'graficos')
os.makedirs(graficos_dir, exist_ok=True)
for f in glob.glob(os.path.join(graficos_dir, "boxplot_incremento_acumulado_mensual_*.svg")):
    try:
        os.remove(f)
        print(f"Borrado: {f}")
    except Exception as e:
        print(f"No se pudo borrar {f}: {e}")

# Cargar datos
json_path = os.path.join(os.path.dirname(__file__), 'precios_por_producto.json')
with open(json_path, 'r') as f:
    precios_por_producto = json.load(f)

primeros_n_ids = list(precios_por_producto.keys())[:n_productos]
fecha_inicio = datetime(2024, 1, 1)

# --- Construir series diarias completas por producto ---
series_diarias = {}
for prod_id in primeros_n_ids:
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    if not df.empty:
        # Eliminar duplicados por fecha, quedando el último precio del día
        df = df.groupby('date_time', as_index=False).last()
        primer_fecha = df['date_time'].iloc[0].date()
        ultima_fecha = df['date_time'].iloc[-1].date()
        idx = pd.date_range(primer_fecha, ultima_fecha, freq='D')
        df = df.set_index('date_time').reindex(idx)
        df['price'] = df['price'].ffill()
        df = df.loc[:ultima_fecha]
        precio_inicial = df['price'].iloc[0]
        if precio_inicial != 0:
            df['incremento_acumulado'] = (df['price'] - precio_inicial) / precio_inicial * 100
            df['mes'] = df.index.to_period('M')
            series_diarias[prod_id] = df['incremento_acumulado']

# --- Preparar datos para boxplot mensual ---
data_por_mes = {}
if series_diarias:
    df_all = pd.DataFrame(series_diarias)
    df_all['mes'] = df_all.index.to_period('M')
    for mes, grupo in df_all.groupby('mes'):
        # Excluir la columna 'mes' y tomar el último valor de cada producto en el mes
        if 'mes' in grupo.columns:
            grupo = grupo.drop(columns=['mes'])
        valores = grupo.iloc[-1].dropna().values
        if len(valores) > 0:
            data_por_mes[mes] = valores

if data_por_mes:
    meses_ordenados = sorted(data_por_mes.keys())
    data = [data_por_mes[m] for m in meses_ordenados]
    plt.figure(figsize=(18, 8))
    plt.boxplot(data, positions=range(len(meses_ordenados)), showfliers=True)
    plt.xticks(range(len(meses_ordenados)), [m.strftime('%Y-%m') for m in meses_ordenados], rotation=45, ha='right')
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Dispersión mensual del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    output_file = os.path.join(graficos_dir, f'boxplot_incremento_acumulado_mensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_file, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_file}') 