import json
import matplotlib
matplotlib.use('Agg')  # No mostrar ventana
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
import os
import csv
import sys
from datetime import datetime
from collections import defaultdict
import numpy as np

# Uso: python graficar_incremento_productos.py N
if len(sys.argv) != 2:
    print("Uso: python graficar_incremento_productos.py <cantidad_productos>")
    sys.exit(1)
try:
    n_productos = int(sys.argv[1])
except ValueError:
    print("El parámetro debe ser un número entero.")
    sys.exit(1)

json_path = os.path.join(os.path.dirname(__file__), 'precios_por_producto.json')
products_path = os.path.join(os.path.dirname(__file__), 'products.csv')

with open(json_path, 'r') as f:
    precios_por_producto = json.load(f)

def cargar_nombres_productos(products_path):
    id_a_nombre = {}
    with open(products_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            id_a_nombre[row['id']] = row['name']
    return id_a_nombre

id_a_nombre = cargar_nombres_productos(products_path)

primeros_n_ids = list(precios_por_producto.keys())[:n_productos]

plt.figure(figsize=(max(16, n_productos), 10))

fecha_inicio = datetime(2024, 1, 1)
productos_graficados = 0
# --- NUEVO: Acumuladores para media y mediana ---
incrementos_por_fecha = defaultdict(list)
for i, prod_id in enumerate(primeros_n_ids):
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    if not df.empty:
        fecha_min = df['date_time'].min()
        fecha_max = df['date_time'].max()
        nombre = id_a_nombre.get(prod_id, f'Producto {prod_id}')
        print(f"Procesando: {nombre}")
        print(f"  Fecha mínima: {fecha_min.strftime('%Y-%m-%d')}")
        print(f"  Fecha máxima: {fecha_max.strftime('%Y-%m-%d')}")
        precio_inicial = df['price'].iloc[0]
        if precio_inicial != 0:
            df['incremento_pct'] = (df['price'] - precio_inicial) / precio_inicial * 100
            plt.plot(df['date_time'], df['incremento_pct'], label=nombre[:40], linewidth=2)
            productos_graficados += 1
            # --- NUEVO: Acumular por fecha ---
            for fecha, inc in zip(df['date_time'], df['incremento_pct']):
                incrementos_por_fecha[fecha].append(inc)
    else:
        nombre = id_a_nombre.get(prod_id, f'Producto {prod_id}')
        print(f"Descartado: {nombre} (sin datos desde 2024)")

plt.xlabel('Fecha', fontsize=12, fontweight='bold')
plt.ylabel('Incremento porcentual (%)', fontsize=12, fontweight='bold')
plt.title(f'Incremento porcentual del precio - {productos_graficados} productos (desde 2024)', fontsize=16, fontweight='bold')
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
plt.xticks(rotation=45, ha='right')
plt.grid(True, alpha=0.3)
plt.legend(fontsize=8, ncol=2)
plt.tight_layout()
output_file = f'grafico_incremento_{productos_graficados}_productos_2024.svg'
plt.savefig(output_file, format='svg', bbox_inches='tight')
print(f'Gráfico guardado como {output_file}')

# --- NUEVO: Graficar media y mediana ---
if productos_graficados > 0 and len(incrementos_por_fecha) > 0:
    fechas_ordenadas = sorted(incrementos_por_fecha.keys())
    medias = [np.mean(incrementos_por_fecha[f]) for f in fechas_ordenadas]
    medianas = [np.median(incrementos_por_fecha[f]) for f in fechas_ordenadas]

    # Gráfico de la media
    plt.figure(figsize=(18, 8))
    plt.plot(fechas_ordenadas, medias, label='Media diaria', color='blue', linewidth=2)
    plt.xlabel('Fecha', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento porcentual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media diaria del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = f'grafico_media_incremento_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico de la media guardado como {output_media}')

    # Gráfico de la mediana
    plt.figure(figsize=(18, 8))
    plt.plot(fechas_ordenadas, medianas, label='Mediana diaria', color='green', linewidth=2)
    plt.xlabel('Fecha', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento porcentual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana diaria del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = f'grafico_mediana_incremento_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico de la mediana guardado como {output_mediana}') 