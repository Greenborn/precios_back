"""
Script: incremento_intermensual.py
Genera gráficos de la media y mediana mensual del incremento intermensual porcentual de los productos.
Uso: python incremento_intermensual.py <cantidad_productos>
"""
import sys
import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
from datetime import datetime
import glob

if len(sys.argv) != 2:
    print("Uso: python incremento_intermensual.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

# Borrar SVGs anteriores relacionados
graficos_dir = os.path.join(os.path.dirname(__file__), 'graficos')
os.makedirs(graficos_dir, exist_ok=True)
for f in glob.glob(os.path.join(graficos_dir, "grafico_*incremento_intermensual*_*.svg")):
    try:
        os.remove(f)
        print(f"Borrado: {f}")
    except Exception as e:
        print(f"No se pudo borrar {f}: {e}")

# Cargar datos
json_path = os.path.join(os.path.dirname(__file__), 'precios_por_producto.json')
products_path = os.path.join(os.path.dirname(__file__), 'products.csv')
with open(json_path, 'r') as f:
    precios_por_producto = json.load(f)

def cargar_nombres_productos(products_path):
    id_a_nombre = {}
    import csv
    with open(products_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            id_a_nombre[row['id']] = row['name']
    return id_a_nombre

id_a_nombre = cargar_nombres_productos(products_path)
primeros_n_ids = list(precios_por_producto.keys())[:n_productos]
fecha_inicio = datetime(2024, 1, 1)

# --- Incremento intermensual ---
incrementos_intermensuales_por_mes = defaultdict(list)
for prod_id in primeros_n_ids:
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    if not df.empty:
        df['mes'] = df['date_time'].dt.to_period('M')
        precios_mensuales = df.groupby('mes')['price'].last()
        incremento_intermensual = precios_mensuales.pct_change() * 100
        incremento_intermensual = incremento_intermensual.dropna()
        for mes, inc in zip(incremento_intermensual.index, incremento_intermensual.values):
            incrementos_intermensuales_por_mes[mes].append(inc)

if incrementos_intermensuales_por_mes:
    meses_ordenados = sorted(incrementos_intermensuales_por_mes.keys())
    medias = [np.mean(incrementos_intermensuales_por_mes[m]) for m in meses_ordenados]
    medianas = [np.median(incrementos_intermensuales_por_mes[m]) for m in meses_ordenados]
    # Media mensual
    plt.figure(figsize=(18, 8))
    plt.plot([m.to_timestamp() for m in meses_ordenados], medias, label='Media intermensual', color='blue', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento intermensual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media intermensual del incremento porcentual ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = os.path.join(graficos_dir, f'grafico_media_incremento_intermensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_media}')
    # Mediana mensual
    plt.figure(figsize=(18, 8))
    plt.plot([m.to_timestamp() for m in meses_ordenados], medianas, label='Mediana intermensual', color='green', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento intermensual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana intermensual del incremento porcentual ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = os.path.join(graficos_dir, f'grafico_mediana_incremento_intermensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_mediana}') 