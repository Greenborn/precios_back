#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import json
import mysql.connector
from datetime import datetime, timedelta, time

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()


print("Generando lista de precios por comercio")

comercios_diccio = {}
cursor.execute("SELECT * FROM enterprice")
comercios = cursor.fetchall()
for comercio in comercios:
    comercios_diccio[comercio[0]] = {} 
    comercios_diccio[comercio[0]]['data_db'] = comercio
    comercios_diccio[comercio[0]]['sumatoria_precios'] = 0
    comercios_diccio[comercio[0]]['precios'] = []

cursor.execute("SELECT * FROM branch")
locales = cursor.fetchall()


for local in locales:
    id_comercio = local[6]
    comercio = comercios_diccio[id_comercio]

    id_local = local[0]
    cursor.execute("SELECT * FROM price WHERE branch_id = %s", (id_local,))
    precios = cursor.fetchall()
    comercio['precios'] = comercio['precios'] + precios
    comercio['sumatoria_precios'] = comercio['sumatoria_precios'] + len(precios)
    
for comercio in comercios_diccio:
    comercio = comercios_diccio[comercio]
    print(comercio['data_db'][1], comercio['sumatoria_precios'])

    cursor.execute("DELETE FROM sumatoria_cant_precios_negocio WHERE enterprice_id = %s", (comercio['data_db'][0],))
    cursor.execute("INSERT INTO sumatoria_cant_precios_negocio (enterprice_id, cantidad, nombre) VALUES (%s, %s, %s)", (comercio['data_db'][0], comercio['sumatoria_precios'], comercio['data_db'][1]))

print("")
print("generando trending topic de terminos")
cursor.execute("DELETE FROM estadistica_trending_terminos WHERE 1")
cursor.execute("SELECT query, COUNT(*) AS total_consultas FROM search_query_history WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK) GROUP BY query ORDER BY total_consultas DESC LIMIT 10")
trendings = cursor.fetchall()


for trending in trendings:
    print(trending)
    cursor.execute("INSERT INTO estadistica_trending_terminos (termino, cantidad) VALUES (%s, %s)", (trending[0], trending[1]))
conexion.commit()

print("Generando lista de precios precios que mas aumentaron")
fecha_hoy =  datetime.now().today()

hoy_inicio_dia = datetime.combine(fecha_hoy,  time(0, 0, 0))

cursor.execute("SELECT * FROM products")
todos_productos = cursor.fetchall()

cursor.execute("SELECT * FROM branch")
branches = cursor.fetchall()

cursor.execute("SELECT * FROM enterprice")
enterprices = cursor.fetchall()

dicc_enterprice = {}
for enterprice in enterprices:
    dicc_enterprice[enterprice[0]] = enterprice

dicc_branches = {}
for branch in branches:
    dicc_branches[branch[0]] = branch

variacion_precios = []

menos_dos_precios = 0
for producto in todos_productos:
    cursor.execute("SELECT * FROM price WHERE product_id = %s ORDER BY date_time DESC LIMIT 2", (producto[0],))
    precios = cursor.fetchall()

    if len(precios) != 2:
        menos_dos_precios = menos_dos_precios + 1
        continue

    ultimo_precio = precios[0]
    anteultimo_precio = precios[1] 
    
    #print(ultimo_precio[3], hoy_inicio_dia)
    
    if (ultimo_precio[3] > hoy_inicio_dia):
        porcentaje =  abs(ultimo_precio[2] - anteultimo_precio[2]) / (anteultimo_precio[2] / 100)
        if (porcentaje > 0):
            variacion = {
                'id_producto':        ultimo_precio[1],
                'branch_id':          ultimo_precio[5],
                'porcentaje_aumento': porcentaje,
                'precio_ayer':        anteultimo_precio[2],
                'precio_hoy':         ultimo_precio[2],
                'nombre_producto':    producto[1],
                'nombre_comercio':    dicc_enterprice[ dicc_branches[ultimo_precio[5]][6] ][1],
                'fecha_ultimo':       ultimo_precio[3]
            }
            variacion_precios.append( variacion )

cursor.execute("DELETE FROM estadistica_aumento_diario WHERE 1")
for variacion in variacion_precios:
    print(variacion)
    cursor.execute("INSERT INTO estadistica_aumento_diario (id_producto, branch_id, porcentaje_aumento, precio_ayer, precio_hoy,nombre_producto,nombre_comercio, fecha_utlimo_precio) VALUES (%s, %s,%s, %s, %s, %s, %s, %s)", 
                   (variacion['id_producto'], variacion['branch_id'], variacion['porcentaje_aumento'], variacion['precio_ayer'], variacion['precio_hoy'], variacion['nombre_producto'], variacion['nombre_comercio'], variacion['fecha_ultimo'],))
conexion.commit()

print("Menos de dos precios ", menos_dos_precios, " precios totales ",len(todos_productos) )