import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
import os
import csv
import sys
from datetime import datetime
from collections import defaultdict
import numpy as np

# Uso: python graficar_incremento_intermensual_productos.py N
if len(sys.argv) != 2:
    print("Uso: python graficar_incremento_intermensual_productos.py <cantidad_productos>")
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

# --- Eliminar la generación del gráfico con N líneas ---
# (Eliminar o comentar el bloque que crea la figura y plotea cada producto)
# --- Fin del bloque a eliminar ---

# --- Mantener solo la generación de media y mediana intermensual ---

fecha_inicio = datetime(2024, 1, 1)
productos_graficados = 0
incrementos_intermensuales_por_mes = defaultdict(list)

for i, prod_id in enumerate(primeros_n_ids):
    precios = precios_por_producto[prod_id]
    df = pd.DataFrame(precios)
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['date_time', 'price'])
    df = df[df['date_time'] >= fecha_inicio]
    df = df.sort_values(by='date_time')
    if not df.empty:
        nombre = id_a_nombre.get(prod_id, f'Producto {prod_id}')
        df['mes'] = df['date_time'].dt.to_period('M')
        precios_mensuales = df.groupby('mes')['price'].last()
        incremento_intermensual = precios_mensuales.pct_change() * 100
        incremento_intermensual = incremento_intermensual.dropna()
        if not incremento_intermensual.empty:
            productos_graficados += 1
            for mes, inc in zip(incremento_intermensual.index, incremento_intermensual.values):
                incrementos_intermensuales_por_mes[mes].append(inc)
    else:
        nombre = id_a_nombre.get(prod_id, f'Producto {prod_id}')
        print(f"Descartado: {nombre} (sin datos desde 2024)")

# Graficar media y mediana intermensual
if productos_graficados > 0 and len(incrementos_intermensuales_por_mes) > 0:
    meses_ordenados = sorted(incrementos_intermensuales_por_mes.keys())
    medias = [np.mean(incrementos_intermensuales_por_mes[m]) for m in meses_ordenados]
    medianas = [np.median(incrementos_intermensuales_por_mes[m]) for m in meses_ordenados]

    # Gráfico de la media intermensual
    plt.figure(figsize=(18, 8))
    plt.plot([m.to_timestamp() for m in meses_ordenados], medias, label='Media intermensual', color='blue', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento intermensual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media intermensual del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = f'grafico_media_incremento_intermensual_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico de la media intermensual guardado como {output_media}')

    # Gráfico de la mediana intermensual
    plt.figure(figsize=(18, 8))
    plt.plot([m.to_timestamp() for m in meses_ordenados], medianas, label='Mediana intermensual', color='green', linewidth=2)
    plt.xlabel('Mes', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento intermensual (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana intermensual del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = f'grafico_mediana_incremento_intermensual_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico de la mediana intermensual guardado como {output_mediana}') 

# Calcular y graficar media y mediana del precio absoluto intermensual
if productos_graficados > 0 and len(incrementos_intermensuales_por_mes) > 0:
    # Ahora, calcular media y mediana de precios absolutos por mes
    precios_por_mes = defaultdict(list)
    for i, prod_id in enumerate(primeros_n_ids):
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
            for mes, precio in zip(precios_mensuales.index, precios_mensuales.values):
                precios_por_mes[mes].append(precio)
    if precios_por_mes:
        meses_ordenados = sorted(precios_por_mes.keys())
        medias_precio = [np.mean(precios_por_mes[m]) for m in meses_ordenados]
        medianas_precio = [np.median(precios_por_mes[m]) for m in meses_ordenados]
        # Gráfico de la media de precios absolutos
        plt.figure(figsize=(18, 8))
        plt.plot([m.to_timestamp() for m in meses_ordenados], medias_precio, label='Media precio intermensual', color='orange', linewidth=2)
        plt.xlabel('Mes', fontsize=12, fontweight='bold')
        plt.ylabel('Media del precio', fontsize=12, fontweight='bold')
        plt.title(f'Media intermensual del precio ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_media_precio = f'grafico_media_incremento_precio_intermensual_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_media_precio, format='svg', bbox_inches='tight')
        print(f'Gráfico de la media de precio intermensual guardado como {output_media_precio}')
        # Gráfico de la mediana de precios absolutos
        plt.figure(figsize=(18, 8))
        plt.plot([m.to_timestamp() for m in meses_ordenados], medianas_precio, label='Mediana precio intermensual', color='red', linewidth=2)
        plt.xlabel('Mes', fontsize=12, fontweight='bold')
        plt.ylabel('Mediana del precio', fontsize=12, fontweight='bold')
        plt.title(f'Mediana intermensual del precio ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_mediana_precio = f'grafico_mediana_incremento_precio_intermensual_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_mediana_precio, format='svg', bbox_inches='tight')
        print(f'Gráfico de la mediana de precio intermensual guardado como {output_mediana_precio}') 

# Calcular y graficar media y mediana del incremento porcentual acumulado respecto al primer precio (intermensual)
if productos_graficados > 0:
    incrementos_acumulados_por_mes = defaultdict(list)
    for i, prod_id in enumerate(primeros_n_ids):
        precios = precios_por_producto[prod_id]
        df = pd.DataFrame(precios)
        df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
        df = df.dropna(subset=['date_time', 'price'])
        df = df[df['date_time'] >= fecha_inicio]
        df = df.sort_values(by='date_time')
        if not df.empty:
            df['mes'] = df['date_time'].dt.to_period('M')
            precio_inicial = df['price'].iloc[0]
            if precio_inicial != 0:
                df['incremento_acumulado'] = (df['price'] - precio_inicial) / precio_inicial * 100
                incremento_acumulado_mensual = df.groupby('mes')['incremento_acumulado'].last()
                for mes, inc in zip(incremento_acumulado_mensual.index, incremento_acumulado_mensual.values):
                    incrementos_acumulados_por_mes[mes].append(inc)
    if incrementos_acumulados_por_mes:
        meses_ordenados = sorted(incrementos_acumulados_por_mes.keys())
        medias_acumulado = [np.mean(incrementos_acumulados_por_mes[m]) for m in meses_ordenados]
        medianas_acumulado = [np.median(incrementos_acumulados_por_mes[m]) for m in meses_ordenados]
        # Gráfico de la media acumulada
        plt.figure(figsize=(18, 8))
        plt.plot([m.to_timestamp() for m in meses_ordenados], medias_acumulado, label='Media incremento acumulado intermensual', color='purple', linewidth=2)
        plt.xlabel('Mes', fontsize=12, fontweight='bold')
        plt.ylabel('Media del incremento acumulado (%)', fontsize=12, fontweight='bold')
        plt.title(f'Media intermensual del incremento acumulado ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_media_acumulado = f'grafico_media_incremento_acumulado_intermensual_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_media_acumulado, format='svg', bbox_inches='tight')
        print(f'Gráfico de la media de incremento acumulado intermensual guardado como {output_media_acumulado}')
        # Gráfico de la mediana acumulada
        plt.figure(figsize=(18, 8))
        plt.plot([m.to_timestamp() for m in meses_ordenados], medianas_acumulado, label='Mediana incremento acumulado intermensual', color='brown', linewidth=2)
        plt.xlabel('Mes', fontsize=12, fontweight='bold')
        plt.ylabel('Mediana del incremento acumulado (%)', fontsize=12, fontweight='bold')
        plt.title(f'Mediana intermensual del incremento acumulado ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_mediana_acumulado = f'grafico_mediana_incremento_acumulado_intermensual_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_mediana_acumulado, format='svg', bbox_inches='tight')
        print(f'Gráfico de la mediana de incremento acumulado intermensual guardado como {output_mediana_acumulado}') 