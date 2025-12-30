#!/bin/bash

# Script para configurar entorno virtual, instalar dependencias y ejecutar actualizar_precios.py

set -e  # Detener en caso de error

echo "=================================================="
echo "  Configuración de Servicio de Actualización"
echo "  de Precios desde Cola"
echo "=================================================="
echo ""

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Directorio de trabajo: $SCRIPT_DIR"
echo ""

# Verificar que Python3 esté instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 no está instalado"
    echo "   Instálalo con: sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✓ Python encontrado: $PYTHON_VERSION"
echo ""

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
    echo "✓ Entorno virtual creado"
else
    echo "✓ Entorno virtual ya existe"
fi
echo ""

# Activar entorno virtual
echo "🔌 Activando entorno virtual..."
source venv/bin/activate
echo "✓ Entorno virtual activado"
echo ""

# Actualizar pip
echo "⬆️  Actualizando pip..."
pip install --upgrade pip --quiet
echo "✓ pip actualizado"
echo ""

# Instalar dependencias
echo "📥 Instalando dependencias..."

# Lista de paquetes necesarios
PACKAGES=(
    "requests"
    "python-dotenv"
    "mysql-connector-python"
)

for package in "${PACKAGES[@]}"; do
    echo "  - Instalando $package..."
    pip install "$package" --quiet
done

echo "✓ Todas las dependencias instaladas"
echo ""

# Verificar que el archivo .env existe
ENV_FILE="../back/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Advertencia: No se encontró el archivo $ENV_FILE"
    echo "   Asegúrate de configurar las variables de entorno de la base de datos"
    echo ""
fi

# Verificar que actualizar_precios.py existe
if [ ! -f "actualizar_precios.py" ]; then
    echo "❌ Error: No se encontró actualizar_precios.py"
    exit 1
fi

echo "=================================================="
echo "  Configuración completada exitosamente"
echo "=================================================="
echo ""
echo "🚀 Iniciando procesador de productos..."
echo ""
echo "=================================================="
echo ""

# Ejecutar el script Python
python3 actualizar_precios.py

# Desactivar entorno virtual al terminar (normalmente no se llega aquí por el bucle infinito)
deactivate
