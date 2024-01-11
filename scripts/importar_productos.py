#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import json
import mysql.connector
from datetime import datetime, timedelta

fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M")
fecha = datetime.now().strftime("%Y%m%d")
path = 'tmp/productos'+fecha+'.json'

# Establecer la conexión con la base de datos
conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

# Realizar operaciones en la base de datos
# Por ejemplo, ejecutar una consulta SQL
cursor = conexion.cursor()

productos_existentes = []
productos_erroneos = []
precios_existentes = []
registros_agregados = []
precios_cambiados = []
fecha_ultimo_precio_upd = []
NO_CAT = 155

def agregar_precio(cursor, reg):
    url_prod = ""
    if "url" in reg:
        url_prod = reg['url']
    text_nuevo_precio = "Se agregó nuevo precio - Carga Masiva - "+reg['name']+" - "+str(reg['price'])
    cursor.execute("INSERT INTO price (product_id, price, date_time, branch_id, es_oferta, confiabilidad, url) VALUES (%s, %s, %s, %s, %s, %s, %s)", (id_producto, reg['price'], fecha_actual, reg['branch_id'], 0, 100, url_prod))
    cursor.execute("INSERT INTO news (text, datetime, type_id) VALUES (%s, %s, %s)", (text_nuevo_precio, fecha_actual, 1))
          
with open(path) as archivo_json:
    precios = json.load(archivo_json)

for reg in precios:
    print(reg)
    #Buscamos en la base de datos en la tabla products si existe un producto con el mismo nombre
    cursor.execute("SELECT * FROM products WHERE name =  %s", (str(reg['name']),))
    resultados = cursor.fetchall()

    if not "category" in reg:
        reg['category'] = NO_CAT

    if reg['category'] == -1 or reg['branch_id'] == -1:
        print("Producto con categoria o local erroneo")
        productos_erroneos.append(reg)
        continue

    if len(resultados) == 0:
        cursor.execute("INSERT INTO products (name, vendor_id, ultimo_precio_conocido) VALUES (%s, %s, %s)", (reg['name'], reg['vendor_id'], fecha_actual))
        id_producto_agregado = cursor.lastrowid
        cursor.execute("INSERT INTO product_category (product_id, category_id) VALUES (%s, %s)", (id_producto_agregado, reg['category']))
        
        text_nuevo_precio = "Se agregó nuevo precio - Carga Masiva - "+reg['name']+" - "+str(reg['price'])
        url_prod = ""
        if "url" in reg:
            url_prod = reg['url']
        cursor.execute("INSERT INTO price (product_id, price, date_time, branch_id, es_oferta, confiabilidad, url) VALUES (%s, %s, %s, %s, %s, %s, %s)", (id_producto_agregado, reg['price'], fecha_actual, reg['branch_id'], 0, 100, url_prod))
        cursor.execute("INSERT INTO news (text, datetime, type_id) VALUES (%s, %s, %s)", (text_nuevo_precio, fecha_actual, 1))
        print("Se inserto el producto")
        registros_agregados.append(reg)
        
    else:
        print("El producto ya existe")
        id_producto = resultados[0][0]
        
        cursor.execute("UPDATE products SET ultimo_precio_conocido = %s WHERE id = %s", (fecha_actual, id_producto))
        cursor.execute("UPDATE products SET last_price = %s WHERE id = %s", (reg['price'], id_producto))
        cursor.execute("SELECT * FROM price WHERE product_id = %s and branch_id = %s AND confiabilidad > 90 ORDER BY date_time DESC LIMIT 1  ", (id_producto, reg['branch_id']))
        precio_db = cursor.fetchone()

        if (precio_db == None):
            print('No se encontro precio, se agrega')
            agregar_precio(cursor, reg)
            registros_agregados.append(reg)
        else:
            id_precio = precio_db[0]
            if abs(round(precio_db[2]) - round(reg['price'])) > 1:
                precios_cambiados.append([ reg,  precio_db ])
                agregar_precio(cursor, reg)
                text_nuevo_precio = "Se actualiza precio - Carga Masiva - "+reg['name']+" - "+str(reg['price'])
                cursor.execute("INSERT INTO news (text, datetime, type_id) VALUES (%s, %s, %s)", (text_nuevo_precio, fecha_actual, 1))
            else:
                url_prod = ""
                if "url" in reg:
                    url_prod = reg['url']
                cursor.execute("UPDATE price SET date_time = %s, url = %s WHERE id = %s", (fecha_actual, url_prod, id_precio))
                print('Ya existe un precio para ese articulo en ese local, se actualiza la fecha')
                #text_nuevo_precio = "Se reafirma precio - Carga Masiva - "+reg['name']+" - "+str(reg['price'])
                #cursor.execute("INSERT INTO news (text, datetime, type_id) VALUES (%s, %s, %s)", (text_nuevo_precio, fecha_actual, 1))
                fecha_ultimo_precio_upd.append(reg)
            precios_existentes.append(reg)

        productos_existentes.append(reg)

sql = "DELETE FROM news WHERE id NOT IN ( SELECT id  FROM ( SELECT id FROM news ORDER BY datetime DESC LIMIT 1000 ) AS subquery)"
#cursor.execute(sql)

sql = "DELETE FROM price WHERE price = 0"
cursor.execute(sql)

sql = "SELECT count(*) as total FROM price"
cantidad_total_precios = cursor.fetchall()

conexion.commit()

for precio in precios_cambiados:
    print(precio[0])
    print(precio[1])
    print("")

print("Cantidad total de precios: ", cantidad_total_precios)
print("Cantidad productos existentes: ", len(productos_existentes))
print("Cantidad total de precios: ", len(precios))
print("Cantidad registros erroneos: ", len(productos_erroneos))
print("Cantidad registros de precios existentes en local: ", len(precios_existentes))
print("Cantidad registros de precios agregados: ", len(registros_agregados))
print("Cantidad de precios cambiados: ", len(precios_cambiados))
print("Cantidad de precios en los que se actualizó su fecha de ultimo precio conocido: ", len(fecha_ultimo_precio_upd))
# Cerrar la conexión con la base de datos
conexion.close()