"""
Script: boxplot_incremento_acumulado_mensual.py
Genera un gráfico de dispersión (boxplot) del incremento acumulado mensual de todos los productos.
Uso: python boxplot_incremento_acumulado_mensual.py <cantidad_productos>
"""
import sys
import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
from datetime import datetime
import glob
import numpy as np

if len(sys.argv) != 2:
    print("Uso: python boxplot_incremento_acumulado_mensual.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

# Borrar SVGs anteriores relacionados
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

# --- Boxplot de incremento acumulado mensual ---
data_por_mes = defaultdict(list)
for prod_id in primeros_n_ids:
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    if not df.empty:
        precio_inicial = df['price'].iloc[0]
        if precio_inicial != 0:
            df['mes'] = df['date_time'].dt.to_period('M')
            df['incremento_acumulado'] = (df['price'] - precio_inicial) / precio_inicial * 100
            incremento_acumulado_mensual = df.groupby('mes')['incremento_acumulado'].last()
            for mes, inc in zip(incremento_acumulado_mensual.index, incremento_acumulado_mensual.values):
                data_por_mes[mes].append(inc)

if data_por_mes:
    meses_ordenados = sorted(data_por_mes.keys())
    data = [data_por_mes[m] for m in meses_ordenados]
    plt.figure(figsize=(18, 8))
    plt.boxplot(data, labels=[m.strftime('%Y-%m') for m in meses_ordenados], showfliers=True)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Dispersión mensual del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    output_file = os.path.join(graficos_dir, f'boxplot_incremento_acumulado_mensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_file, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_file}') 