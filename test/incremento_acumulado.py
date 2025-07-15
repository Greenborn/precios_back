"""
Script: incremento_acumulado.py
Genera gráficos de la media y mediana diaria y mensual del incremento acumulado porcentual respecto al primer precio registrado de cada producto.

Metodología:
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro.
- Los días intermedios se rellenan con el último precio conocido (forward fill).
- No se extiende el precio más allá de la última fecha registrada para ese producto.
- El incremento acumulado se calcula respecto al primer precio registrado de cada producto.
- Para cada día/mes, la media y mediana se calculan solo con los productos que tienen precio válido ese día/mes.

Uso: python incremento_acumulado.py <cantidad_productos>
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
    print("Uso: python incremento_acumulado.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

graficos_dir = os.path.join(os.path.dirname(__file__), 'graficos')
os.makedirs(graficos_dir, exist_ok=True)
for f in glob.glob(os.path.join(graficos_dir, "grafico_*incremento_acumulado*_*.svg")):
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

# --- Construir series diarias completas por producto ---
series_diarias = {}
for prod_id in primeros_n_ids:
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    if not df.empty and 'date_time' in df.columns:
        df = df.sort_values(by='date_time')
        # Obtener primer y última fecha ANTES del groupby
        primer_fecha = df['date_time'].iloc[0].date()
        ultima_fecha = df['date_time'].iloc[-1].date()
        # Calcular la media diaria entre todos los precios de ese día (de distintos comercios)
        df = df.groupby('date_time', as_index=False)['price'].mean()
        idx = pd.date_range(primer_fecha, ultima_fecha, freq='D')
        df = df.set_index('date_time').reindex(idx)
        df['price'] = df['price'].ffill()
        # Solo forward fill hasta la última fecha real
        df = df.loc[:ultima_fecha]
        precio_inicial = df['price'].iloc[0]
        if precio_inicial != 0:
            df['incremento_acumulado'] = (df['price'] - precio_inicial) / precio_inicial * 100
            series_diarias[prod_id] = df['incremento_acumulado']

# --- Calcular media y mediana diaria ---
if series_diarias:
    df_all = pd.DataFrame(series_diarias)
    medias = df_all.mean(axis=1, skipna=True)
    medianas = df_all.median(axis=1, skipna=True)
    dias_ordenados = df_all.index
    # Media diaria
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, medias, label='Media diaria', color='blue', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media diaria del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = os.path.join(graficos_dir, f'grafico_media_incremento_acumulado_diario_{n_productos}_productos_2024.svg')
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_media}')
    # Mediana diaria
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, medianas, label='Mediana diaria', color='green', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana diaria del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = os.path.join(graficos_dir, f'grafico_mediana_incremento_acumulado_diario_{n_productos}_productos_2024.svg')
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_mediana}')

# --- Calcular media y mediana mensual ---
if series_diarias:
    df_all = pd.DataFrame(series_diarias)
    # Asegurarse de que el índice es DatetimeIndex
    if not isinstance(df_all.index, pd.DatetimeIndex):
        df_all.index = pd.to_datetime(df_all.index)
    # Agrupar por mes usando resample
    medias_mensual = df_all.resample('M').mean().mean(axis=1, skipna=True)
    medianas_mensual = df_all.resample('M').median().median(axis=1, skipna=True)
    meses_ordenados = medias_mensual.index
    # Media mensual
    plt.figure(figsize=(18, 8))
    plt.plot(meses_ordenados, medias_mensual, label='Media mensual', color='blue', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media mensual del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = os.path.join(graficos_dir, f'grafico_media_incremento_acumulado_mensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_media}')
    # Mediana mensual
    plt.figure(figsize=(18, 8))
    plt.plot(meses_ordenados, medianas_mensual, label='Mediana mensual', color='green', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento acumulado (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana mensual del incremento acumulado ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = os.path.join(graficos_dir, f'grafico_mediana_incremento_acumulado_mensual_{n_productos}_productos_2024.svg')
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_mediana}') 