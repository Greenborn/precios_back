#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para procesar productos desde el servicio de colas
Realiza peticiones periódicas al servicio de colas y procesa los productos
según el esquema de importar_productos.js
"""

import os
import sys
import time
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
import uuid
from dateutil import parser


# Cargar variables de entorno desde back/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'back', '.env')
load_dotenv(dotenv_path=env_path)


# Configuración de la base de datos desde .env
DB_CONFIG = {
    'host': os.getenv('mysql_host', 'localhost'),
    'user': os.getenv('mysql_user', 'usuario'),
    'password': os.getenv('mysql_password', 'contraseña'),
    'database': os.getenv('mysql_database', 'precios_db'),
    'port': int(os.getenv('mysql_port', 3306)),
}

# Configuración del servicio de colas
QUEUE_SERVICE_URL = os.getenv('QUEUE_SERVICE_URL', 'http://localhost:3501')
GET_DATA_ENDPOINT = f"{QUEUE_SERVICE_URL}/get_data"
INTERVALO_VERIFICACION = 1  # 1 segundo

# Caches globales para evitar consultas repetidas
cache_productos = {}
cache_categorias = {}
cache_branch_enterprise = {}


def generar_uuid_v7():
    """Genera un UUID v7"""
    return str(uuid.uuid1())


def limpiar_texto(texto):
    """Limpia y normaliza texto eliminando espacios extras"""
    if not texto:
        return texto
    return ' '.join(texto.strip().split())


def obtener_conexion():
    """Obtiene una conexión a la base de datos MySQL"""
    try:
        conexion = mysql.connector.connect(**DB_CONFIG)
        if conexion.is_connected():
            return conexion
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None


def obtener_elemento_cola(clave='productos'):
    """Obtiene un elemento de la cola desde el servicio de colas"""
    try:
        response = requests.get(
            GET_DATA_ENDPOINT,
            params={'clave': clave},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            # El servicio retorna { data: <valor> }
            if 'data' in data and data['data'] is not None:
                return data['data']
            return None
        elif response.status_code == 404:
            # No hay datos en la cola
            return None
        else:
            print(f"Error del servicio de colas: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener elemento de la cola: {e}")
        return None


def get_categoria(cursor, conexion, articulo):
    """Obtiene o crea una categoría"""
    nombre_cat = articulo.get('category_name')
    if not nombre_cat:
        return None
    
    # Verificar caché
    if nombre_cat in cache_categorias:
        return cache_categorias[nombre_cat]
    
    # Buscar en base de datos
    cursor.execute("SELECT * FROM category WHERE name = %s LIMIT 1", (nombre_cat,))
    categoria = cursor.fetchone()
    
    if categoria:
        cat_dict = {
            'id': categoria[0],
            'name': categoria[1]
        }
        cache_categorias[nombre_cat] = cat_dict
        return cat_dict
    else:
        # Crear nueva categoría
        id_nueva_cat = generar_uuid_v7()
        cursor.execute(
            "INSERT INTO category (id, name) VALUES (%s, %s)",
            (id_nueva_cat, nombre_cat)
        )
        conexion.commit()
        
        cat_dict = {'id': id_nueva_cat, 'name': nombre_cat}
        cache_categorias[nombre_cat] = cat_dict
        return cat_dict


def get_producto(cursor, conexion, articulo):
    """Obtiene o crea un producto"""
    nombre = articulo.get('name')
    if not nombre:
        return None
    
    # Verificar caché
    if nombre in cache_productos:
        producto = cache_productos[nombre]
    else:
        # Buscar por alias
        cursor.execute("""
            SELECT p.* FROM products p
            JOIN alias_productos ap ON p.id = ap.product_id
            WHERE ap.alias = %s
            LIMIT 1
        """, (nombre,))
        
        result = cursor.fetchone()
        
        if result:
            producto = {
                'id': result[0],
                'name': result[1],
                'vendor_id': result[2],
                'barcode': result[3] if len(result) > 3 else None,
                'description': result[4] if len(result) > 4 else None
            }
            cache_productos[nombre] = producto
        else:
            # Crear nuevo producto
            id_nuevo_prod = generar_uuid_v7()
            insert_data = {
                'id': id_nuevo_prod,
                'name': nombre,
                'vendor_id': articulo.get('vendor_id'),
                'barcode': articulo.get('barcode'),
                'description': articulo.get('description')
            }
            
            # Insertar producto
            fields = ['id', 'name']
            values = [id_nuevo_prod, nombre]
            
            if insert_data.get('vendor_id'):
                fields.append('vendor_id')
                values.append(insert_data['vendor_id'])
            if insert_data.get('barcode'):
                fields.append('barcode')
                values.append(insert_data['barcode'])
            if insert_data.get('description'):
                fields.append('description')
                values.append(insert_data['description'])
            
            placeholders = ', '.join(['%s'] * len(fields))
            query = f"INSERT INTO products ({', '.join(fields)}) VALUES ({placeholders})"
            cursor.execute(query, values)
            
            # Insertar alias
            cursor.execute(
                "INSERT INTO alias_productos (alias, product_id) VALUES (%s, %s)",
                (nombre, id_nuevo_prod)
            )
            
            conexion.commit()
            
            producto = insert_data
            cache_productos[nombre] = producto
    
    # Actualizar barcode y description si vienen en el artículo
    actualizar = False
    updates = []
    params = []
    
    if articulo.get('barcode') and producto.get('barcode') != articulo.get('barcode'):
        updates.append("barcode = %s")
        params.append(articulo['barcode'])
        actualizar = True
    
    if articulo.get('description') and producto.get('description') != articulo.get('description'):
        updates.append("description = %s")
        params.append(articulo['description'])
        actualizar = True
    
    if actualizar:
        params.append(producto['id'])
        query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        conexion.commit()
    
    return producto


def nuevo_reg_precio(cursor, conexion, articulo, producto_db, fecha_registro):
    """Crea un nuevo registro de precio"""
    # Validar precio
    if not articulo.get('price') or articulo['price'] <= 0:
        return False
    
    # Validar fecha_registro
    fecha = articulo.get('fecha_registro') or fecha_registro
    if not fecha:
        print('Error: fecha_registro es obligatorio')
        return False
    
    # Preparar insert
    id_precio = generar_uuid_v7()
    insert_data = {
        'id': id_precio,
        'product_id': producto_db['id'],
        'price': articulo['price'],
        'date_time': fecha,
        'branch_id': articulo['branch_id'],
        'es_oferta': 0,
        'confiabilidad': 100,
        'notas': articulo.get('nota'),
        'url': articulo.get('url'),
        'time': fecha
    }
    
    # Insertar en price
    cursor.execute("""
        INSERT INTO price (id, product_id, price, date_time, branch_id, es_oferta, 
                          confiabilidad, notas, url, time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        insert_data['id'], insert_data['product_id'], insert_data['price'],
        insert_data['date_time'], insert_data['branch_id'], insert_data['es_oferta'],
        insert_data['confiabilidad'], insert_data['notas'], insert_data['url'],
        insert_data['time']
    ))
    
    # Preparar registro para price_today
    id_precio_hoy = generar_uuid_v7()
    
    # Verificar si ya existe en price_today
    cursor.execute("""
        SELECT * FROM price_today 
        WHERE product_id = %s AND branch_id = %s 
        LIMIT 1
    """, (producto_db['id'], articulo['branch_id']))
    
    existe = cursor.fetchone()
    
    if not existe:
        # Insertar
        cursor.execute("""
            INSERT INTO price_today (id, product_id, price, date_time, branch_id, 
                                    es_oferta, confiabilidad, notas, url, time, 
                                    product_name, price_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            id_precio_hoy, producto_db['id'], articulo['price'], fecha,
            articulo['branch_id'], 0, 100, insert_data['notas'], insert_data['url'],
            fecha, articulo['name'], id_precio
        ))
    else:
        # Actualizar
        cursor.execute("""
            UPDATE price_today 
            SET price = %s, date_time = %s, es_oferta = %s, confiabilidad = %s,
                notas = %s, url = %s, time = %s, product_name = %s, price_id = %s
            WHERE product_id = %s AND branch_id = %s
        """, (
            articulo['price'], fecha, 0, 100, insert_data['notas'],
            insert_data['url'], fecha, articulo['name'], id_precio,
            producto_db['id'], articulo['branch_id']
        ))
    
    conexion.commit()
    return insert_data


def procesar_variacion(cursor, conexion, reg_anterior, reg_nuevo, fecha_registro):
    """Procesa la variación de precio"""
    if not reg_anterior or not reg_nuevo:
        return
    
    precio_anterior = reg_anterior.get('price', 0)
    precio_nuevo = reg_nuevo.get('price', 0)
    
    if precio_anterior == 0 or precio_nuevo == 0:
        return
    
    if precio_anterior == precio_nuevo:
        return
    
    branch_id_anterior = reg_anterior.get('branch_id')
    branch_id_nuevo = reg_nuevo.get('branch_id')
    
    if branch_id_anterior != branch_id_nuevo:
        return
    
    # Calcular porcentaje
    porcentaje = ((precio_nuevo - precio_anterior) / (precio_anterior / 100))
    
    # Filtrar variaciones extremas
    if porcentaje > 50 or porcentaje < -50:
        print(f"Variación extrema detectada: {porcentaje}%")
        return
    
    # Obtener nombre del comercio (simplificado)
    nombre_comercio = "Comercio"  # Se podría obtener de la BD si es necesario
    
    # Insertar estadística
    cursor.execute("""
        INSERT INTO estadistica_aumento_diario 
        (id_producto, branch_id, porcentaje_aumento, precio_ayer, precio_hoy,
         nombre_producto, nombre_comercio, fecha_utlimo_precio)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        reg_anterior.get('product_id'),
        branch_id_anterior,
        porcentaje,
        precio_anterior,
        precio_nuevo,
        reg_nuevo.get('name'),
        nombre_comercio,
        datetime.now()
    ))
    
    conexion.commit()


def procesa_precio(cursor, conexion, producto_db, articulo, fecha_registro):
    """Procesa el precio de un artículo"""
    # Buscar último precio del mismo producto y misma sucursal
    cursor.execute("""
        SELECT * FROM price 
        WHERE product_id = %s AND branch_id = %s 
        ORDER BY time DESC 
        LIMIT 1
    """, (producto_db['id'], articulo['branch_id']))
    
    result = cursor.fetchone()
    
    if result:
        ultimo_precio = {
            'id': result[0],
            'product_id': result[1],
            'price': float(result[2]),
            'date_time': result[3],
            'branch_id': result[4],
            'url': result[7] if len(result) > 7 else None
        }
        
        diferencia = abs(ultimo_precio['price'] - articulo.get('price', 0))
        
        if diferencia > 1:
            # Precio cambió significativamente
            nuevo_precio = nuevo_reg_precio(cursor, conexion, articulo, producto_db, fecha_registro)
            if nuevo_precio:
                # Procesar variación
                reg_nuevo = {
                    'price': articulo['price'],
                    'branch_id': articulo['branch_id'],
                    'name': articulo['name'],
                    'product_id': producto_db['id']
                }
                procesar_variacion(cursor, conexion, ultimo_precio, reg_nuevo, fecha_registro)
                return True
            return False
        else:
            # Precio igual o cambio insignificante, actualizar timestamp
            cursor.execute("""
                UPDATE price 
                SET date_time = %s, time = %s, url = %s 
                WHERE id = %s
            """, (datetime.now(), datetime.now(), articulo.get('url'), ultimo_precio['id']))
            
            # Verificar si ya existe en price_today
            cursor.execute("""
                SELECT * FROM price_today WHERE price_id = %s LIMIT 1
            """, (ultimo_precio['id'],))
            
            repetido = cursor.fetchone()
            
            if not repetido:
                # Insertar en price_today
                id_precio_hoy = generar_uuid_v7()
                cursor.execute("""
                    INSERT INTO price_today 
                    (id, product_id, price, date_time, branch_id, es_oferta, 
                     confiabilidad, notas, url, time, product_name, price_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    id_precio_hoy, producto_db['id'], ultimo_precio['price'],
                    datetime.now(), articulo['branch_id'], 0, 100, None,
                    articulo.get('url'), datetime.now(), articulo['name'],
                    ultimo_precio['id']
                ))
            
            conexion.commit()
            return True
    else:
        # No hay precio anterior, crear nuevo
        nuevo_precio = nuevo_reg_precio(cursor, conexion, articulo, producto_db, fecha_registro)
        return nuevo_precio is not False


def procesar_articulo(articulo, fecha_registro=None):
    """
    Procesa un artículo completo siguiendo el esquema de importar_productos.js
    """
    # Validaciones básicas
    if not articulo.get('category_name'):
        print('Error: No se especifica categoría')
        return {'stat': False, 'text': 'No se especifica categoria!'}
    
    fecha_final = articulo.get('fecha_registro') or fecha_registro
    if not fecha_final:
        print('Error: fecha_registro es obligatorio')
        return {'stat': False, 'text': 'El campo fecha_registro es obligatorio'}
    
    # Validar campos requeridos
    campos_requeridos = ['name', 'price', 'branch_id']
    for campo in campos_requeridos:
        if not articulo.get(campo):
            return {'stat': False, 'text': f'Campo {campo} es obligatorio'}
    
    # Obtener conexión
    conexion = obtener_conexion()
    if not conexion:
        return {'stat': False, 'text': 'Error de conexión a la base de datos'}
    
    try:
        cursor = conexion.cursor()
        
        # Limpiar textos
        articulo['name'] = limpiar_texto(articulo['name'])
        articulo['category_name'] = limpiar_texto(articulo['category_name'])
        
        # Limitar longitud del nombre
        if len(articulo['name']) > 500:
            articulo['name'] = articulo['name'][:500]
        
        # Obtener o crear producto
        producto = get_producto(cursor, conexion, articulo)
        
        # Obtener o crear categoría
        categoria = get_categoria(cursor, conexion, articulo)
        
        if not producto:
            cursor.close()
            conexion.close()
            return {'stat': False, 'text': 'No se pudo obtener/crear el producto'}
        
        if not categoria:
            cursor.close()
            conexion.close()
            return {'stat': False, 'text': 'No se pudo obtener/crear la categoría'}
        
        # Verificar relación producto-categoría
        cursor.execute("""
            SELECT * FROM product_category 
            WHERE product_id = %s AND category_id = %s 
            LIMIT 1
        """, (producto['id'], categoria['id']))
        
        hay_cat = cursor.fetchone()
        
        if not hay_cat:
            # Crear relación
            cursor.execute("""
                INSERT INTO product_category (id, product_id, category_id) 
                VALUES (%s, %s, %s)
            """, (generar_uuid_v7(), producto['id'], categoria['id']))
            conexion.commit()
        
        # Procesar precio
        resultado = procesa_precio(cursor, conexion, producto, articulo, fecha_registro)
        
        cursor.close()
        conexion.close()
        
        if resultado:
            return {'stat': True, 'text': 'Artículo procesado exitosamente'}
        else:
            return {'stat': False, 'text': 'Error al procesar el precio'}
    
    except Exception as e:
        print(f"Error al procesar artículo: {e}")
        if conexion and conexion.is_connected():
            conexion.rollback()
            conexion.close()
        return {'stat': False, 'text': str(e)}


def procesar_oferta(oferta):
    """
    Procesa una oferta siguiendo el esquema requerido
    """
    # Validar campos requeridos
    campos_requeridos = ['titulo', 'precio', 'branch_id', 'url', 'fecha_registro']
    for campo in campos_requeridos:
        if not oferta.get(campo):
            return {'stat': False, 'text': f'Campo {campo} es obligatorio'}
    
    # Obtener conexión
    conexion = obtener_conexion()
    if not conexion:
        return {'stat': False, 'text': 'Error de conexión a la base de datos'}
    
    try:
        cursor = conexion.cursor()
        
        # Convertir fecha_registro a datetime
        fecha_registro = oferta.get('fecha_registro')
        if isinstance(fecha_registro, str):
            from dateutil import parser
            fecha_registro = parser.parse(fecha_registro)
        
        # Verificar que la fecha sea de hoy o ayer
        hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ayer = hoy - timedelta(days=1)
        
        if fecha_registro < ayer:
            cursor.close()
            conexion.close()
            return {'stat': False, 'text': 'Fecha de registro es anterior a ayer, oferta descartada'}
        
        # Limpiar ofertas antiguas (anteriores al día de ayer)
        cursor.execute("DELETE FROM promociones_hoy WHERE fecha < %s", (ayer,))
        
        # Verificar si ya existe por título
        cursor.execute("""
            SELECT * FROM promociones_hoy WHERE titulo = %s LIMIT 1
        """, (oferta['titulo'],))
        
        existe = cursor.fetchone()
        
        if existe:
            cursor.close()
            conexion.close()
            return {'stat': False, 'text': 'Oferta duplicada (título ya existe)'}
        
        # Preparar datos para insertar
        datos_extra = oferta.get('datos_extra', {})
        if isinstance(datos_extra, dict):
            datos_extra = json.dumps(datos_extra)
        
        insert_data = {
            'orden': oferta.get('orden', 0),
            'fecha': fecha_registro,
            'titulo': oferta['titulo'],
            'id_producto': oferta.get('id_producto', -1),
            'precio': oferta['precio'],
            'datos_extra': datos_extra,
            'branch_id': oferta['branch_id'],
            'url': oferta['url']
        }
        
        # Insertar en promociones_hoy
        cursor.execute("""
            INSERT INTO promociones_hoy 
            (orden, fecha, titulo, id_producto, precio, datos_extra, branch_id, url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            insert_data['orden'], insert_data['fecha'], insert_data['titulo'],
            insert_data['id_producto'], insert_data['precio'], insert_data['datos_extra'],
            insert_data['branch_id'], insert_data['url']
        ))
        
        # Insertar en promociones (tabla histórica)
        cursor.execute("""
            INSERT INTO promociones 
            (orden, fecha, titulo, id_producto, precio, datos_extra, branch_id, url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            insert_data['orden'], insert_data['fecha'], insert_data['titulo'],
            insert_data['id_producto'], insert_data['precio'], insert_data['datos_extra'],
            insert_data['branch_id'], insert_data['url']
        ))
        
        conexion.commit()
        cursor.close()
        conexion.close()
        
        return {'stat': True, 'text': 'Oferta procesada exitosamente'}
    
    except Exception as e:
        print(f"Error al procesar oferta: {e}")
        if conexion and conexion.is_connected():
            conexion.rollback()
            conexion.close()
        return {'stat': False, 'text': str(e)}


def actualizar_estadisticas():
    """Actualiza las estadísticas incrementales"""
    conexion = obtener_conexion()
    if not conexion:
        return
    
    try:
        cursor = conexion.cursor()
        
        # Actualizar cant_price
        cursor.execute("SELECT COUNT(id) FROM price")
        cant_price = cursor.fetchone()[0]
        cursor.execute("""
            UPDATE incremental_stats SET value = %s WHERE `key` = 'cant_price'
        """, (cant_price,))
        
        # Actualizar precios_hoy
        cursor.execute("SELECT COUNT(id) FROM price_today")
        cant_price_today = cursor.fetchone()[0]
        cursor.execute("""
            UPDATE incremental_stats SET value = %s WHERE `key` = 'precios_hoy'
        """, (cant_price_today,))
        
        # Actualizar cant_promos
        cursor.execute("SELECT COUNT(id) FROM promociones_hoy")
        cant_promos = cursor.fetchone()[0]
        cursor.execute("""
            UPDATE incremental_stats SET value = %s WHERE `key` = 'cant_promos'
        """, (cant_promos,))
        
        conexion.commit()
        cursor.close()
        conexion.close()
    except Exception as e:
        print(f"Error al actualizar estadísticas: {e}")
        if conexion and conexion.is_connected():
            conexion.close()


def main():
    """Función principal del script"""
    print("=" * 60)
    print("Iniciando procesador de productos desde servicio de colas")
    print("=" * 60)
    print(f"Servicio de colas: {QUEUE_SERVICE_URL}")
    print(f"Base de datos: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print(f"Intervalo de verificación: {INTERVALO_VERIFICACION} segundo(s)")
    print("=" * 60)
    
    # Verificar conectividad con el servicio de colas
    print("\n⚙️  Verificando conectividad con servicio de colas...")
    try:
        response = requests.get(f"{QUEUE_SERVICE_URL}/health", timeout=3)
        print("✓ Servicio de colas conectado")
    except:
        try:
            # Intentar con el endpoint add_data
            response = requests.post(
                f"{QUEUE_SERVICE_URL}/add_data",
                json={"clave": "test", "data": {}},
                timeout=3
            )
            print("✓ Servicio de colas respondiendo")
        except Exception as e:
            print(f"⚠️  ADVERTENCIA: No se puede conectar al servicio de colas")
            print(f"   Error: {e}")
            print(f"   Asegúrate de que el servicio esté corriendo en {QUEUE_SERVICE_URL}")
            print(f"   El script continuará verificando...")
    
    print()
    ductos_procesados = 0
    ofertas_procesadas = 0
    errores_total = 0
    
    while True:
        try:
            # Obtener elemento de la cola de productos
            elemento_producto = obtener_elemento_cola('productos')
            
            if elemento_producto:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Producto obtenido de la cola")
                print(f"Producto: {elemento_producto.get('name', 'N/A')}")
                
                # Procesar producto
                resultado = procesar_articulo(elemento_producto)
                
                if resultado['stat']:
                    productos_procesados += 1
                    print(f"✓ Producto procesado (Total: {productos_procesados})")
                    
                    # Actualizar estadísticas cada 10 productos
                    if productos_procesados % 10 == 0:
                        actualizar_estadisticas()
                        print("  → Estadísticas actualizadas")
                else:
                    errores_total += 1
                    print(f"✗ Error al procesar producto: {resultado.get('text', 'Error desconocido')}")
                
                # Procesar siguiente inmediatamente
                continue
            
            # Obtener elemento de la cola de ofertas
            elemento_oferta = obtener_elemento_cola('ofertas')
            
            if elemento_oferta:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Oferta obtenida de la cola")
                print(f"Oferta: {elemento_oferta.get('titulo', 'N/A')}")
                
                # Procesar oferta
                resultado = procesar_oferta(elemento_oferta)
                
                if resultado['stat']:
                    ofertas_procesadas += 1
                    print(f"✓ Oferta procesada (Total: {ofertas_procesadas})")
                    
                    # Actualizar estadísticas cada 10 ofertas
                    if ofertas_procesadas % 10 == 0:
                        actualizar_estadisticas()
                        print("  → Estadísticas actualizadas")
                else:
                    if 'duplicada' not in resultado.get('text', '').lower() and 'anterior a ayer' not in resultado.get('text', '').lower():
                        errores_total += 1
                        print(f"✗ Error al procesar oferta: {resultado.get('text', 'Error desconocido')}")
                    else:
                        print(f"⊘ Oferta descartada: {resultado.get('text', '')}")
                
                # Procesar siguiente inmediatamente
                continue
            
            # Si no hay elementos en ninguna cola, esperar
            if not elemento_producto and not elemento_oferta:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Colas vacías
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Cola vacía, esperando...", end='\r')
                time.sleep(INTERVALO_VERIFICACION)
        
        except KeyboardInterrupt:
            print("\n\n" + "=" * 60)
            print("Deteniendo procesador...")
            print(f"Total procesados: {procesados_total}")
            print(f"Total errores: {errores_total}")
            print("=" * 60)
            sys.exit(0)
        
        except Exception as e:
            print(f"\n✗ Error inesperado: {e}")
            errores_total += 1
            time.sleep(INTERVALO_VERIFICACION)


if __name__ == "__main__":
    main()
