#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import json
import mysql.connector

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

