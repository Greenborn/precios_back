"""
Script: cantidad_precios_por_dia.py
Genera un gráfico de la cantidad de precios registrados por día (cantidad de productos con precio).
Uso: python cantidad_precios_por_dia.py <cantidad_productos>
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

if len(sys.argv) != 2:
    print("Uso: python cantidad_precios_por_dia.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

# Borrar SVGs anteriores relacionados
graficos_dir = os.path.join(os.path.dirname(__file__), 'graficos')
os.makedirs(graficos_dir, exist_ok=True)
for f in glob.glob(os.path.join(graficos_dir, "grafico_cantidad_precios_por_dia_*.svg")):
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

# --- Cantidad de precios por día ---
cantidades_por_dia = defaultdict(int)
for prod_id in primeros_n_ids:
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    for dia in df['date_time']:
        cantidades_por_dia[dia.date()] += 1

if cantidades_por_dia:
    dias_ordenados = sorted(cantidades_por_dia.keys())
    cantidades = [cantidades_por_dia[d] for d in dias_ordenados]
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, cantidades, label='Cantidad de precios por día', color='purple', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Cantidad de precios registrados', fontsize=12, fontweight='bold')
    plt.title(f'Cantidad de precios registrados por día ({n_productos} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_file = os.path.join(graficos_dir, f'grafico_cantidad_precios_por_dia_{n_productos}_productos_2024.svg')
    plt.savefig(output_file, format='svg', bbox_inches='tight')
    print(f'Gráfico guardado: {output_file}') 