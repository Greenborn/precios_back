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

# Argumentos opcionales
json_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_JSON
svg_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SVG

os.makedirs(os.path.dirname(svg_path), exist_ok=True)

# Leer JSON
try:
    with open(json_path, 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error al leer el archivo JSON: {e}")
    sys.exit(1)

df = pd.DataFrame(data)

# Verificar columnas necesarias
def col_ok(col):
    return col in df.columns
if not (col_ok('date') and col_ok('mean_inc') and col_ok('count')):
    print("El JSON debe tener las claves: 'date', 'mean_inc', 'count'")
    sys.exit(1)

# Filtros según README_graficos.md
df = df[df['count'] >= 1000]
df = df[df['mean_inc'].abs() <= 200]
df = df.dropna(subset=['date', 'mean_inc'])

# Convertir fechas y agregar columna de mes
df['date'] = pd.to_datetime(df['date'])
df['mes'] = df['date'].dt.to_period('M')

# Calcular incremento mensual compuesto y barras de error
resultados = []
for mes, grupo in df.groupby('mes'):
    incs = grupo['mean_inc'].values
    # Composición multiplicativa
    compuesto = np.prod(1 + incs/100) - 1
    compuesto_pct = compuesto * 100
    # Desviación estándar de los incrementos diarios
    std = np.std(incs)
    resultados.append({
        'mes': str(mes),
        'incremento_compuesto_pct': compuesto_pct,
        'std_diario': std
    })

res_df = pd.DataFrame(resultados)

# Graficar
plt.figure(figsize=(14, 7))
plt.bar(res_df['mes'], res_df['incremento_compuesto_pct'], yerr=res_df['std_diario'], capsize=5, color='orange', alpha=0.8, label='Incremento mensual compuesto (%)')
plt.xlabel('Mes', fontsize=12, fontweight='bold')
plt.ylabel('Incremento mensual compuesto (%)', fontsize=12, fontweight='bold')
plt.title('Incremento porcentual intermensual compuesto (con barras de error)', fontsize=16, fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.grid(True, axis='y', alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig(svg_path, format='svg', bbox_inches='tight')
print(f'Gráfico guardado: {svg_path}') 