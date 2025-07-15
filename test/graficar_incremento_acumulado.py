import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Ruta de la serie compilada
SERIE_COMPILADA = os.path.join(os.path.dirname(__file__), 'series_compiladas', 'media_incremento_diario.json')
GRAFICOS_DIR = os.path.join(os.path.dirname(__file__), 'graficos')
SVG_OUT = os.path.join(GRAFICOS_DIR, 'incremento_acumulado.svg')
SVG_OUT_MEDIANA = os.path.join(GRAFICOS_DIR, 'mediana_incremento_diario.svg')
SVG_OUT_MEDIA_BANDAS = os.path.join(GRAFICOS_DIR, 'media_incremento_bandas.svg')

if not os.path.exists(GRAFICOS_DIR):
    os.makedirs(GRAFICOS_DIR)

# Leer la serie compilada
with open(SERIE_COMPILADA, 'r') as f:
    serie = json.load(f)

df = pd.DataFrame(serie)
df = df.dropna(subset=['mean_inc'])
df['date'] = pd.to_datetime(df['date'])

# Filtrar solo días con al menos 1000 registros
df = df[df['count'] >= 1000]
# Excluir valores extremos de mean_inc (mayores a 200 en valor absoluto)
df = df[df['mean_inc'].abs() <= 200]

# --- 1. Acumulado compuesto ---
# El acumulado compuesto se calcula como:
# acumulado_t = (prod_{i=1}^t (1 + inc_i/100) - 1) * 100
acumulado = (np.cumprod(1 + df['mean_inc'].values / 100) - 1) * 100

plt.figure(figsize=(14,6))
plt.plot(df['date'], acumulado, marker='.', color='tab:green')
plt.title('Incremento interdiario acumulado compuesto (media diaria, ≥1000 registros, sin extremos >200%)')
plt.xlabel('Fecha')
plt.ylabel('Incremento acumulado (%)')
plt.xticks(rotation=45, fontsize=8)
plt.grid(True)
plt.tight_layout()
plt.savefig(SVG_OUT, format='svg')
print(f'Gráfico guardado en {SVG_OUT}')

# --- 2. Mediana diaria de incrementos interdiarios ---
# (Requiere tener la mediana diaria en la serie compilada. Si no está, solo graficamos la media)
if 'median_inc' in df.columns:
    plt.figure(figsize=(14,6))
    plt.plot(df['date'], df['median_inc'], marker='.', color='tab:red')
    plt.title('Mediana diaria de incrementos interdiarios (≥1000 registros, sin extremos >200%)')
    plt.xlabel('Fecha')
    plt.ylabel('Mediana incremento interdiario (%)')
    plt.xticks(rotation=45, fontsize=8)
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(SVG_OUT_MEDIANA, format='svg')
    print(f'Gráfico guardado en {SVG_OUT_MEDIANA}')

# --- 3. Bandas de dispersión (±1 desvío estándar) sobre la media diaria ---
if 'std_inc' in df.columns:
    plt.figure(figsize=(14,6))
    plt.plot(df['date'], df['mean_inc'], marker='.', color='tab:blue', label='Media')
    plt.fill_between(df['date'], df['mean_inc']-df['std_inc'], df['mean_inc']+df['std_inc'], color='tab:blue', alpha=0.2, label='±1 Desvío estándar')
    plt.title('Media diaria de incrementos interdiarios con bandas de dispersión (≥1000 registros, sin extremos >200%)')
    plt.xlabel('Fecha')
    plt.ylabel('Incremento interdiario (%)')
    plt.xticks(rotation=45, fontsize=8)
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(SVG_OUT_MEDIA_BANDAS, format='svg')
    print(f'Gráfico guardado en {SVG_OUT_MEDIA_BANDAS}') 