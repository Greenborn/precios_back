import os
import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

# Paths por defecto
BASE_DIR = os.path.dirname(__file__)
DEFAULT_JSON = os.path.join(BASE_DIR, 'series_compiladas', 'media_incremento_diario.json')
DEFAULT_OUTDIR = os.path.join(BASE_DIR, 'graficos')
DEFAULT_SVG = os.path.join(DEFAULT_OUTDIR, 'incremento_intermensual_compuesto.svg')
DEFAULT_DOLAR_CSV = os.path.join(BASE_DIR, 'USD_ARS Historical Data.csv')

# Argumentos opcionales
json_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_JSON
svg_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SVG
usd_csv_path = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_DOLAR_CSV

os.makedirs(os.path.dirname(svg_path), exist_ok=True)

# Leer JSON
try:
    with open(json_path, 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error al leer el archivo JSON: {e}")
    sys.exit(1)

df = pd.DataFrame(data)

def col_ok(col):
    return col in df.columns
if not (col_ok('date') and col_ok('mean_inc') and col_ok('count')):
    print("El JSON debe tener las claves: 'date', 'mean_inc', 'count'")
    sys.exit(1)

# Filtros según README_graficos.md
df = df[df['count'] >= 1000]
df = df[df['mean_inc'].abs() <= 200]
df = df.dropna(subset=['date', 'mean_inc'])
df['date'] = pd.to_datetime(df['date'])
df['mes'] = df['date'].dt.to_period('M')

# Calcular incremento mensual compuesto y barras de error para precios
resultados = []
for mes, grupo in df.groupby('mes'):
    incs = grupo['mean_inc'].values
    compuesto = np.prod(1 + incs/100) - 1
    compuesto_pct = compuesto * 100
    std = np.std(incs)
    resultados.append({
        'mes': str(mes),
        'incremento_compuesto_pct': compuesto_pct,
        'std_diario': std
    })
res_df = pd.DataFrame(resultados)

# Leer y procesar CSV del dólar
usd = pd.read_csv(usd_csv_path)
usd = usd.iloc[::-1].reset_index(drop=True)
usd['Date'] = pd.to_datetime(usd['Date'], format='%m/%d/%Y')
usd['Price'] = usd['Price'].str.replace(',', '').astype(float)
usd = usd[usd['Date'] >= pd.to_datetime('2024-01-01')]
usd = usd.sort_values('Date')
usd['mes'] = usd['Date'].dt.to_period('M')
# Calcular incremento mensual compuesto para el dólar
usd_meses = []
usd_valores = []
for mes, grupo in usd.groupby('mes'):
    precios = grupo['Price'].values
    if len(precios) > 1:
        compuesto = precios[-1] / precios[0] - 1
        usd_meses.append(str(mes))
        usd_valores.append(compuesto * 100)
    else:
        usd_meses.append(str(mes))
        usd_valores.append(0)

# Graficar ambos
plt.figure(figsize=(14, 7))
plt.bar(res_df['mes'], res_df['incremento_compuesto_pct'], yerr=res_df['std_diario'], capsize=5, color='orange', alpha=0.8, label='Precios (mensual compuesto)')
plt.plot(usd_meses, usd_valores, color='blue', marker='o', linewidth=2, label='Dólar (mensual compuesto)')
plt.xlabel('Mes', fontsize=12, fontweight='bold')
plt.ylabel('Incremento mensual compuesto (%)', fontsize=12, fontweight='bold')
plt.title('Incremento porcentual intermensual compuesto (precios vs. dólar)', fontsize=16, fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.grid(True, axis='y', alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig(svg_path, format='svg', bbox_inches='tight')
print(f'Gráfico guardado: {svg_path}') 