#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import json
import mysql.connector
import argparse
import csv

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()


cursor.execute("SELECT * FROM price ORDER BY date_time ASC")
precios = cursor.fetchall()

cursor.execute("SELECT * FROM products")
productos = cursor.fetchall()

diccio_productos = {}
for prod in productos:
    diccio_productos[prod[0]] = prod

cursor.execute("SELECT * FROM branch")
locales = cursor.fetchall()

diccio_locales = {}
for loc in locales:
    diccio_locales[loc[0]] = loc

cursor.execute("SELECT * FROM enterprice")
empresas = cursor.fetchall()
diccio_empresas = {}
for emp in empresas:
    diccio_empresas[emp[0]] = emp

with open('exportacion_precios.csv', 'w', newline='') as csvfile:
    fieldnames = ['fecha', 'producto', 'precio', 'comercio', 'url']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for precio in precios:

        if (not precio[1] in diccio_productos):
            continue
        
        prod_info = { 
            "fecha":precio[3], 
            "producto": diccio_productos[precio[1]][1], 
            "precio": precio[2], 
            "comercio":diccio_empresas[diccio_locales[precio[5]][6]][1], 
            "url": precio[9]  
        }

        print(prod_info)
        print("")

        
        writer.writerow(prod_info)