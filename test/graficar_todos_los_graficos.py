import subprocess
import os

BASE_DIR = os.path.dirname(__file__)
SCRIPTS = [
    'graficar_media_incremento_interdiario.py',
    'graficar_incremento_acumulado_interdiario.py',
    'graficar_incrementos_combinados.py',
    'graficar_incremento_intermensual_compuesto.py',
]

for script in SCRIPTS:
    print(f'\nEjecutando: {script}')
    result = subprocess.run(['python', os.path.join(BASE_DIR, script)], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print('Error:', result.stderr) 