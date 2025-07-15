import os
import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Paths por defecto
BASE_DIR = os.path.dirname(__file__)
DEFAULT_JSON = os.path.join(BASE_DIR, 'series_compiladas', 'media_incremento_diario.json')
DEFAULT_OUTDIR = os.path.join(BASE_DIR, 'graficos')
DEFAULT_SVG = os.path.join(DEFAULT_OUTDIR, 'incremento_acumulado_interdiario.svg')

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

# Convertir fechas
df['date'] = pd.to_datetime(df['date'])

# Calcular suma acumulada de mean_inc
df['acumulado'] = df['mean_inc'].cumsum()

# Graficar
plt.figure(figsize=(18, 8))
plt.plot(df['date'], df['acumulado'], label='Incremento porcentual interdiario acumulado (%)', color='green', linewidth=2)
plt.xlabel('Fecha', fontsize=12, fontweight='bold')
plt.ylabel('Incremento porcentual acumulado (%)', fontsize=12, fontweight='bold')
plt.title('Incremento porcentual interdiario acumulado', fontsize=16, fontweight='bold')
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
plt.xticks(rotation=45, ha='right')
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig(svg_path, format='svg', bbox_inches='tight')
print(f'Gráfico guardado: {svg_path}') 