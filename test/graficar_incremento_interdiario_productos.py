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

# Uso: python graficar_incremento_interdiario_productos.py N
if len(sys.argv) != 2:
    print("Uso: python graficar_incremento_interdiario_productos.py <cantidad_productos>")
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

# --- Mantener solo la generación de media y mediana interdiaria ---
fecha_inicio = datetime(2024, 1, 1)
productos_graficados = 0
incrementos_interdiarios_por_dia = defaultdict(list)

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
        precios_diarios = df.groupby('date_time')['price'].last()
        incremento_interdiario = precios_diarios.pct_change() * 100
        incremento_interdiario = incremento_interdiario.dropna()
        if not incremento_interdiario.empty:
            productos_graficados += 1
            for dia, inc in zip(incremento_interdiario.index, incremento_interdiario.values):
                incrementos_interdiarios_por_dia[dia].append(inc)
    else:
        nombre = id_a_nombre.get(prod_id, f'Producto {prod_id}')
        print(f"Descartado: {nombre} (sin datos desde 2024)")

# Graficar media y mediana interdiaria
if productos_graficados > 0 and len(incrementos_interdiarios_por_dia) > 0:
    dias_ordenados = sorted(incrementos_interdiarios_por_dia.keys())
    medias = [np.mean(incrementos_interdiarios_por_dia[d]) for d in dias_ordenados]
    medianas = [np.median(incrementos_interdiarios_por_dia[d]) for d in dias_ordenados]

    # Gráfico de la media interdiaria
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, medias, label='Media interdiaria', color='blue', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Media del incremento interdiario (%)', fontsize=12, fontweight='bold')
    plt.title(f'Media interdiaria del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_media = f'grafico_media_incremento_interdiario_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_media, format='svg', bbox_inches='tight')
    print(f'Gráfico de la media interdiaria guardado como {output_media}')

    # Gráfico de la mediana interdiaria
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, medianas, label='Mediana interdiaria', color='green', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Mediana del incremento interdiario (%)', fontsize=12, fontweight='bold')
    plt.title(f'Mediana interdiaria del incremento porcentual ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_mediana = f'grafico_mediana_incremento_interdiario_{productos_graficados}_productos_2024.svg'
    plt.savefig(output_mediana, format='svg', bbox_inches='tight')
    print(f'Gráfico de la mediana interdiaria guardado como {output_mediana}')

# Calcular y graficar media y mediana del precio absoluto interdiario
if productos_graficados > 0 and len(incrementos_interdiarios_por_dia) > 0:
    # Ahora, calcular media y mediana de precios absolutos por día
    precios_por_dia = defaultdict(list)
    for i, prod_id in enumerate(primeros_n_ids):
        precios = precios_por_producto[prod_id]
        df = pd.DataFrame(precios)
        df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
        df = df.dropna(subset=['date_time', 'price'])
        df = df[df['date_time'] >= fecha_inicio]
        df = df.sort_values(by='date_time')
        if not df.empty:
            precios_diarios = df.groupby('date_time')['price'].last()
            for dia, precio in zip(precios_diarios.index, precios_diarios.values):
                precios_por_dia[dia].append(precio)
    if precios_por_dia:
        dias_ordenados = sorted(precios_por_dia.keys())
        medias_precio = [np.mean(precios_por_dia[d]) for d in dias_ordenados]
        medianas_precio = [np.median(precios_por_dia[d]) for d in dias_ordenados]
        # Gráfico de la media de precios absolutos
        plt.figure(figsize=(18, 8))
        plt.plot(dias_ordenados, medias_precio, label='Media precio interdiario', color='orange', linewidth=2)
        plt.xlabel('Día', fontsize=12, fontweight='bold')
        plt.ylabel('Media del precio', fontsize=12, fontweight='bold')
        plt.title(f'Media interdiaria del precio ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_media_precio = f'grafico_media_incremento_precio_interdiario_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_media_precio, format='svg', bbox_inches='tight')
        print(f'Gráfico de la media de precio interdiario guardado como {output_media_precio}')
        # Gráfico de la mediana de precios absolutos
        plt.figure(figsize=(18, 8))
        plt.plot(dias_ordenados, medianas_precio, label='Mediana precio interdiario', color='red', linewidth=2)
        plt.xlabel('Día', fontsize=12, fontweight='bold')
        plt.ylabel('Mediana del precio', fontsize=12, fontweight='bold')
        plt.title(f'Mediana interdiaria del precio ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_mediana_precio = f'grafico_mediana_incremento_precio_interdiario_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_mediana_precio, format='svg', bbox_inches='tight')
        print(f'Gráfico de la mediana de precio interdiario guardado como {output_mediana_precio}') 

# Calcular y graficar media y mediana del incremento porcentual acumulado respecto al primer precio (interdiario)
if productos_graficados > 0:
    incrementos_acumulados_por_dia = defaultdict(list)
    for i, prod_id in enumerate(primeros_n_ids):
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
                df['incremento_acumulado'] = (df['price'] - precio_inicial) / precio_inicial * 100
                incremento_acumulado_diario = df.groupby('date_time')['incremento_acumulado'].last()
                for dia, inc in zip(incremento_acumulado_diario.index, incremento_acumulado_diario.values):
                    incrementos_acumulados_por_dia[dia].append(inc)
    if incrementos_acumulados_por_dia:
        dias_ordenados = sorted(incrementos_acumulados_por_dia.keys())
        medias_acumulado = [np.mean(incrementos_acumulados_por_dia[d]) for d in dias_ordenados]
        medianas_acumulado = [np.median(incrementos_acumulados_por_dia[d]) for d in dias_ordenados]
        # Gráfico de la media acumulada
        plt.figure(figsize=(18, 8))
        plt.plot(dias_ordenados, medias_acumulado, label='Media incremento acumulado interdiario', color='purple', linewidth=2)
        plt.xlabel('Día', fontsize=12, fontweight='bold')
        plt.ylabel('Media del incremento acumulado (%)', fontsize=12, fontweight='bold')
        plt.title(f'Media interdiaria del incremento acumulado ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_media_acumulado = f'grafico_media_incremento_acumulado_interdiario_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_media_acumulado, format='svg', bbox_inches='tight')
        print(f'Gráfico de la media de incremento acumulado interdiario guardado como {output_media_acumulado}')
        # Gráfico de la mediana acumulada
        plt.figure(figsize=(18, 8))
        plt.plot(dias_ordenados, medianas_acumulado, label='Mediana incremento acumulado interdiario', color='brown', linewidth=2)
        plt.xlabel('Día', fontsize=12, fontweight='bold')
        plt.ylabel('Mediana del incremento acumulado (%)', fontsize=12, fontweight='bold')
        plt.title(f'Mediana interdiaria del incremento acumulado ({productos_graficados} productos, desde 2024)', fontsize=16, fontweight='bold')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        output_mediana_acumulado = f'grafico_mediana_incremento_acumulado_interdiario_{productos_graficados}_productos_2024.svg'
        plt.savefig(output_mediana_acumulado, format='svg', bbox_inches='tight')
        print(f'Gráfico de la mediana de incremento acumulado interdiario guardado como {output_mediana_acumulado}') 