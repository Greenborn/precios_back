#!/bin/bash

# Script para generar informe estadístico completo de precios
# Autor: Asistente de IA
# Fecha: 2024
# 
# Este script automatiza todo el proceso de generación del informe:
# 1. Descarga y descompresión de datos del Drive
# 2. Instalación de dependencias
# 3. Carga de datos CSV
# 4. Compilación de series
# 5. Generación de gráficos
# 6. Creación del informe final

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL del archivo en Google Drive
DRIVE_URL="https://drive.google.com/file/d/1w5xGHJHUMhzh8emskconj1vYGm0ZiqEa/view?usp=drive_link"
FILE_ID="1w5xGHJHUMhzh8emskconj1vYGm0ZiqEa"

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para descargar y descomprimir datos del Drive
descargar_datos_drive() {
    print_status "Descargando datos del Google Drive..."
    
    # Verificar si wget está disponible
    if ! command_exists wget; then
        print_status "Instalando wget..."
        sudo apt update && sudo apt install -y wget
    fi
    
    # Crear directorio temporal si no existe
    mkdir -p temp_download
    
    # Intentar diferentes métodos de descarga
    print_status "Intentando descargar archivo del Drive..."
    
    # Método 1: Intentar con curl y cookies
    if command_exists curl; then
        print_status "Intentando con curl..."
        
        # Crear archivo de cookies temporal
        COOKIE_FILE="temp_download/cookies.txt"
        
        # Obtener la página de confirmación
        curl -c "$COOKIE_FILE" -L "https://drive.google.com/uc?export=download&id=$FILE_ID" > temp_download/confirm.html
        
        # Extraer el token de confirmación
        CONFIRM_TOKEN=$(grep -o 'name="confirm" value="[^"]*"' temp_download/confirm.html | sed 's/.*value="\([^"]*\)".*/\1/')
        
        if [ ! -z "$CONFIRM_TOKEN" ]; then
            print_status "Token de confirmación encontrado, descargando archivo..."
            curl -Lb "$COOKIE_FILE" "https://drive.google.com/uc?export=download&confirm=$CONFIRM_TOKEN&id=$FILE_ID" -o temp_download/datos_completos.zip
        else
            print_warning "No se encontró token de confirmación, intentando descarga directa..."
            curl -L "https://drive.google.com/uc?export=download&id=$FILE_ID" -o temp_download/datos_completos.zip
        fi
        
        # Limpiar archivos temporales
        rm -f temp_download/confirm.html temp_download/cookies.txt
    else
        print_status "Instalando curl..."
        sudo apt install -y curl
        
        # Crear archivo de cookies temporal
        COOKIE_FILE="temp_download/cookies.txt"
        
        # Obtener la página de confirmación
        curl -c "$COOKIE_FILE" -L "https://drive.google.com/uc?export=download&id=$FILE_ID" > temp_download/confirm.html
        
        # Extraer el token de confirmación
        CONFIRM_TOKEN=$(grep -o 'name="confirm" value="[^"]*"' temp_download/confirm.html | sed 's/.*value="\([^"]*\)".*/\1/')
        
        if [ ! -z "$CONFIRM_TOKEN" ]; then
            print_status "Token de confirmación encontrado, descargando archivo..."
            curl -Lb "$COOKIE_FILE" "https://drive.google.com/uc?export=download&confirm=$CONFIRM_TOKEN&id=$FILE_ID" -o temp_download/datos_completos.zip
        else
            print_warning "No se encontró token de confirmación, intentando descarga directa..."
            curl -L "https://drive.google.com/uc?export=download&id=$FILE_ID" -o temp_download/datos_completos.zip
        fi
        
        # Limpiar archivos temporales
        rm -f temp_download/confirm.html temp_download/cookies.txt
    fi
    
    # Verificar que el archivo se descargó correctamente
    if [ ! -f "temp_download/datos_completos.zip" ] || [ ! -s "temp_download/datos_completos.zip" ]; then
        print_error "No se pudo descargar el archivo del Drive"
        print_status "Verificando si los archivos CSV ya existen localmente..."
        
        # Verificar si los archivos CSV ya existen
        if [ -f "products.csv" ] && [ -f "USD_ARS Historical Data.csv" ]; then
            print_success "Archivos CSV encontrados localmente, continuando..."
            return 0
        else
            print_error "No se encontraron archivos CSV. Por favor, descarga manualmente el archivo del Drive y colócalo en este directorio."
            print_status "URL del archivo: $DRIVE_URL"
            exit 1
        fi
    fi
    
    # Verificar si el archivo descargado es realmente un ZIP
    if file temp_download/datos_completos.zip | grep -q "HTML"; then
        print_warning "El archivo descargado parece ser HTML (página de Google Drive)"
        print_status "Verificando si los archivos CSV ya existen localmente..."
        
        # Verificar si los archivos CSV ya existen
        if [ -f "products.csv" ] && [ -f "USD_ARS Historical Data.csv" ]; then
            print_success "Archivos CSV encontrados localmente, continuando..."
            rm -rf temp_download
            return 0
        else
            print_error "No se encontraron archivos CSV. Por favor, descarga manualmente el archivo del Drive y colócalo en este directorio."
            print_status "URL del archivo: $DRIVE_URL"
            exit 1
        fi
    fi
    
    print_success "Archivo descargado exitosamente"
    
    # Descomprimir archivo
    print_status "Descomprimiendo archivo..."
    
    if command_exists unzip; then
        unzip -o temp_download/datos_completos.zip -d .
        print_success "Archivo descomprimido exitosamente"
    else
        print_status "Instalando unzip..."
        sudo apt install -y unzip
        unzip -o temp_download/datos_completos.zip -d .
        print_success "Archivo descomprimido exitosamente"
    fi
    
    # Limpiar archivo temporal
    rm -rf temp_download
    
    # Verificar que los archivos CSV están presentes
    if [ -f "products.csv" ]; then
        print_success "Archivo products.csv encontrado"
    else
        print_warning "Archivo products.csv no encontrado después de la descompresión"
    fi
    
    if [ -f "USD_ARS Historical Data.csv" ]; then
        print_success "Archivo USD_ARS Historical Data.csv encontrado"
    else
        print_warning "Archivo USD_ARS Historical Data.csv no encontrado después de la descompresión"
    fi
}

# Función para instalar dependencias
instalar_dependencias() {
    print_status "Verificando e instalando dependencias..."
    
    # Verificar Node.js
    if ! command_exists node; then
        print_error "Node.js no está instalado. Por favor, instálalo primero."
        exit 1
    fi
    
    # Verificar Python
    if ! command_exists python3; then
        print_error "Python3 no está instalado. Por favor, instálalo primero."
        exit 1
    fi
    
    # Instalar dependencias de Python
    print_status "Instalando dependencias de Python..."
    
    # Lista de paquetes Python necesarios
    python_packages=(
        "pandas"
        "matplotlib"
        "numpy"
        "reportlab"
    )
    
    for package in "${python_packages[@]}"; do
        if python3 -c "import $package" 2>/dev/null; then
            print_success "$package ya está instalado"
        else
            print_status "Instalando $package..."
            if sudo apt install -y "python3-$package" 2>/dev/null; then
                print_success "$package instalado via apt"
            else
                print_warning "No se pudo instalar $package via apt, intentando con pip..."
                if python3 -m pip install --user "$package" 2>/dev/null; then
                    print_success "$package instalado via pip"
                else
                    print_error "No se pudo instalar $package"
                    exit 1
                fi
            fi
        fi
    done
    
    print_success "Todas las dependencias están instaladas"
}

# Función para cargar datos CSV
cargar_datos_csv() {
    print_status "Cargando datos CSV..."
    
    if [ -f "cargar_csvs.js" ]; then
        if node cargar_csvs.js; then
            print_success "Datos CSV cargados exitosamente"
        else
            print_error "Error al cargar datos CSV"
            exit 1
        fi
    else
        print_warning "Archivo cargar_csvs.js no encontrado, saltando paso..."
    fi
}

# Función para compilar series
compilar_series() {
    print_status "Compilando series de incrementos..."
    
    if [ -f "compilar_serie_media_incremento.js" ]; then
        if node compilar_serie_media_incremento.js; then
            print_success "Series compiladas exitosamente"
        else
            print_error "Error al compilar series"
            exit 1
        fi
    else
        print_error "Archivo compilar_serie_media_incremento.js no encontrado"
        exit 1
    fi
}

# Función para generar gráficos
generar_graficos() {
    print_status "Generando gráficos..."
    
    if [ -f "generar_graficos_completos.py" ]; then
        if python3 generar_graficos_completos.py; then
            print_success "Gráficos generados exitosamente"
        else
            print_error "Error al generar gráficos"
            exit 1
        fi
    else
        print_error "Archivo generar_graficos_completos.py no encontrado"
        exit 1
    fi
}

# Función para verificar resultados
verificar_resultados() {
    print_status "Verificando resultados..."
    
    # Verificar que existe la serie compilada
    if [ -f "series_compiladas/media_incremento_diario.json" ]; then
        print_success "Serie compilada encontrada"
    else
        print_error "Serie compilada no encontrada"
        exit 1
    fi
    
    # Verificar que existen los gráficos
    if [ -d "graficos" ]; then
        svg_count=$(find graficos -name "*.svg" | wc -l)
        if [ "$svg_count" -gt 0 ]; then
            print_success "Se encontraron $svg_count gráficos SVG"
        else
            print_warning "No se encontraron gráficos SVG"
        fi
    else
        print_warning "Carpeta de gráficos no encontrada"
    fi
    
    # Verificar que existe el informe
    if [ -f "INFORME_COMPLETO_GRAFICOS.md" ]; then
        print_success "Informe completo encontrado"
    else
        print_warning "Informe completo no encontrado"
    fi
}

# Función para mostrar resumen
mostrar_resumen() {
    echo ""
    echo "=========================================="
    echo "           RESUMEN DEL INFORME"
    echo "=========================================="
    echo ""
    
    if [ -f "series_compiladas/media_incremento_diario.json" ]; then
        echo "✅ Serie compilada: OK"
    else
        echo "❌ Serie compilada: FALTANTE"
    fi
    
    if [ -d "graficos" ]; then
        svg_count=$(find graficos -name "*.svg" | wc -l)
        echo "✅ Gráficos generados: $svg_count archivos SVG"
    else
        echo "❌ Gráficos: CARPETA NO ENCONTRADA"
    fi
    
    if [ -f "INFORME_COMPLETO_GRAFICOS.md" ]; then
        echo "✅ Informe completo: OK"
    else
        echo "❌ Informe completo: FALTANTE"
    fi
    
    echo ""
    echo "📁 Archivos generados:"
    echo "   - series_compiladas/media_incremento_diario.json"
    echo "   - graficos/*.svg"
    echo "   - INFORME_COMPLETO_GRAFICOS.md"
    echo ""
    echo "📖 Para ver el informe completo:"
    echo "   cat INFORME_COMPLETO_GRAFICOS.md"
    echo "   o abrir en un editor de Markdown"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "    GENERADOR DE INFORME ESTADÍSTICO"
    echo "=========================================="
    echo ""
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "README_graficos.md" ]; then
        print_error "No se encontró README_graficos.md. Asegúrate de estar en el directorio correcto."
        exit 1
    fi
    
    # Ejecutar pasos en orden
    descargar_datos_drive
    instalar_dependencias
    cargar_datos_csv
    compilar_series
    generar_graficos
    verificar_resultados
    mostrar_resumen
    
    print_success "¡Informe estadístico generado exitosamente!"
    echo ""
    print_status "Nota: Este análisis fue asistido por inteligencia artificial para la generación de código, documentación y visualizaciones."
}

# Ejecutar función principal
main "$@" 