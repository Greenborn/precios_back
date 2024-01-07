#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import json
import mysql.connector
import argparse

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()

parser = argparse.ArgumentParser()
parser.add_argument("--producto", type=str, help="Nombre de producto")
parser.add_argument("--alias", type=str, help="Nombre de producto")
parser.add_argument("--refiere", type=str, help="Nombre de producto refiere")
args = parser.parse_args()

producto = args.producto
alias = args.alias
refiere_nombre = args.refiere
print("Buscando producto: ", producto, "alias: ", alias, "refiere: ", refiere_nombre)

cursor.execute(f"SELECT * FROM products WHERE name LIKE  '%{producto}%'")
productos = cursor.fetchall()

for reg in productos:
    print(reg)

if (alias != None):
    print("Buscando Alias", alias)
    cursor.execute(f"SELECT * FROM products_alias WHERE alias LIKE  '%{alias}%'")
    res_alias = cursor.fetchall()
    for reg_alias in res_alias:
        print(reg_alias)

if (len(productos) > 1):
    print("Hay multiples coincidencias")
    exit()
id_prod_adquirido = productos[0][0]

if (alias == None or refiere_nombre == None):
    print("No hay alias o  refiere nombre")
    exit()

cursor.execute("SELECT * FROM productos_estadisticas WHERE name =  %s", (refiere_nombre,))
existe = cursor.fetchone()

id_refiere_prod = 0
if (existe != None):
    id_refiere_prod = existe[0]
    print("Ya existe el producto en productos_estadisticas")
else:
    insert = (refiere_nombre, productos[0][2], productos[0][3])
    cursor.execute("INSERT INTO productos_estadisticas (name, vendor_id, fecha_actualizacion ) VALUES (%s, %s, %s)", insert)
    id_refiere_prod = cursor.lastrowid
    print("Se crea el producto en productos_estadisticas: ", id_refiere_prod)

insert_alias = (alias, id_refiere_prod, id_prod_adquirido)
cursor.execute("INSERT INTO products_alias (alias, product_id, id_adquirido ) VALUES (%s, %s, %s)", insert_alias)

conexion.commit()

print("Alias relacionado a producto")

conexion.close()