"""
Script: cantidad_precios_por_dia.py
Genera un gráfico de la cantidad de precios registrados por día (cantidad de productos con precio).

Metodología:
- Para cada producto, se construye una serie diaria desde su primer registro de 2024 hasta su último registro.
- Los días intermedios se rellenan con el último precio conocido (forward fill).
- No se extiende el precio más allá de la última fecha registrada para ese producto.
- Para cada día, se cuenta la cantidad de productos que tienen precio válido ese día.

Uso: python cantidad_precios_por_dia.py <cantidad_productos>
"""
import sys
import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import glob

if len(sys.argv) != 2:
    print("Uso: python cantidad_precios_por_dia.py <cantidad_productos>")
    sys.exit(1)

n_productos = int(sys.argv[1])

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
        series_diarias[prod_id] = df['price']

# --- Calcular cantidad de productos con precio válido por día ---
if series_diarias:
    df_all = pd.DataFrame(series_diarias)
    cantidades = df_all.count(axis=1)
    dias_ordenados = df_all.index
    plt.figure(figsize=(18, 8))
    plt.plot(dias_ordenados, cantidades, label='Cantidad de precios por día', color='purple', linewidth=2)
    plt.xlabel('Día', fontsize=12, fontweight='bold')
    plt.ylabel('Cantidad de productos con precio registrado', fontsize=12, fontweight='bold')
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