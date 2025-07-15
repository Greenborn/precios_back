import os
import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
from typing import List, Dict, Any, Union

# Paths por defecto
BASE_DIR = os.path.dirname(__file__)
DEFAULT_JSON = os.path.join(BASE_DIR, 'series_compiladas', 'media_incremento_diario.json')
DEFAULT_OUTDIR = os.path.join(BASE_DIR, 'graficos')
DEFAULT_SVG = os.path.join(DEFAULT_OUTDIR, 'incremento_acumulado_interdiario.svg')
DEFAULT_DOLAR_CSV = os.path.join(BASE_DIR, 'USD_ARS Historical Data.csv')

# Argumentos opcionales
json_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_JSON
svg_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SVG
usd_csv_path = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_DOLAR_CSV

os.makedirs(os.path.dirname(svg_path), exist_ok=True)

# Leer JSON de precios
try:
    with open(json_path, 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error al leer el archivo JSON: {e}")
    sys.exit(1)

df = pd.DataFrame(data)  # type: pd.DataFrame

def col_ok(col: str) -> bool:
    return col in df.columns

if not (col_ok('date') and col_ok('mean_inc') and col_ok('count')):
    print("El JSON debe tener las claves: 'date', 'mean_inc', 'count'")
    sys.exit(1)

# Filtros según README_graficos.md
df = df[df['count'] >= 1000]
df = df[df['mean_inc'].abs() <= 200]
df = df.dropna(subset=['date', 'mean_inc'])
df['date'] = pd.to_datetime(df['date'])

# Calcular acumulado compuesto (multiplicativo) para precios
acumulado: List[float] = []
valor = 1.0
for inc in df['mean_inc']:
    valor *= (1 + inc/100)
    acumulado.append((valor - 1) * 100)
df['acumulado_compuesto'] = acumulado

# Leer y procesar CSV del dólar
usd = pd.read_csv(usd_csv_path)  # type: pd.DataFrame
# El archivo está en orden descendente, lo invertimos
usd = usd.iloc[::-1].reset_index(drop=True)
usd['Date'] = pd.to_datetime(usd['Date'], format='%m/%d/%Y')
usd['Price'] = usd['Price'].str.replace(',', '').astype(float)
# Filtrar desde 2024-01-01
usd = usd[usd['Date'] >= pd.to_datetime('2024-01-01')]
# Calcular variación diaria compuesta
usd = usd.sort_values('Date')
usd['pct_change'] = usd['Price'].pct_change().fillna(0) * 100
usd_acum: List[float] = []
valor_usd = 1.0
for inc in usd['pct_change']:
    valor_usd *= (1 + inc/100)
    usd_acum.append((valor_usd - 1) * 100)
usd['acumulado_compuesto'] = usd_acum

# Graficar ambos
plt.figure(figsize=(18, 8))
plt.plot(df['date'], df['acumulado_compuesto'], label='Precios (acumulado compuesto)', color='green', linewidth=2)
plt.plot(usd['Date'], usd['acumulado_compuesto'], label='Dólar (acumulado compuesto)', color='blue', linewidth=2)
plt.xlabel('Fecha', fontsize=12, fontweight='bold')
plt.ylabel('Incremento porcentual acumulado (%)', fontsize=12, fontweight='bold')
plt.title('Incremento porcentual interdiario acumulado (precios vs. dólar)', fontsize=16, fontweight='bold')
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
plt.xticks(rotation=45, ha='right')
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig(svg_path, format='svg', bbox_inches='tight')
print(f'Gráfico guardado: {svg_path}') 