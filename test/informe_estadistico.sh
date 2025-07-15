#!/bin/bash

# Script para generar informe estadístico completo de precios
# Autor: Asistente de IA
# Fecha: 2024
# 
# Este script automatiza todo el proceso de generación del informe:
# 1. Instalación de dependencias
# 2. Carga de datos CSV
# 3. Compilación de series
# 4. Generación de gráficos
# 5. Creación del informe final

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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