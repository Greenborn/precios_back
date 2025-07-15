"""
Script: ejecutar_todos_los_graficos.py
Borra todos los archivos SVG de la carpeta y ejecuta todos los scripts de generación de gráficos, pasando la cantidad de productos como argumento.
Uso: python ejecutar_todos_los_graficos.py <cantidad_productos>
"""
import sys
import subprocess
import glob
import os

if len(sys.argv) != 2:
    print("Uso: python ejecutar_todos_los_graficos.py <cantidad_productos>")
    sys.exit(1)

cantidad = sys.argv[1]

# Borrar todos los SVG
graficos_dir = os.path.join(os.path.dirname(__file__), 'graficos')
os.makedirs(graficos_dir, exist_ok=True)
for svg_file in glob.glob(os.path.join(graficos_dir, "*.svg")):
    try:
        os.remove(svg_file)
        print(f"Borrado: {svg_file}")
    except Exception as e:
        print(f"No se pudo borrar {svg_file}: {e}")

scripts = [
    "incremento_acumulado.py",
    "incremento_interdiario.py",
    "incremento_intermensual.py",
    "cantidad_precios_por_dia.py",
    "boxplot_incremento_acumulado_mensual.py",
]

for script in scripts:
    print(f"Ejecutando {script} con {cantidad} productos...")
    try:
        proceso = subprocess.Popen([
            sys.executable, script, cantidad
        ], stdout=sys.stdout, stderr=sys.stderr)
        proceso.communicate()
        if proceso.returncode == 0:
            print(f"\u2714 {script} ejecutado correctamente.")
        else:
            print(f"\u274C Error al ejecutar {script} (código {proceso.returncode})")
            sys.exit(1)
    except Exception as e:
        print(f"\u274C Error al ejecutar {script}: {e}")
        sys.exit(1) 