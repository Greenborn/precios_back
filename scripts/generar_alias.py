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
parser.add_argument("--termino_busqueda", type=str, help="Termino de búsqueda producto")
args = parser.parse_args()

termino_busqueda = args.termino_busqueda

offset = 0
if (termino_busqueda == None):
    while True:
        print("No se indico termino_busqueda, se muestra sugerencia del primer producto sin alias \n")
        cursor.execute(f"SELECT * FROM products WHERE alias is null or alias = '' limit 1 offset "+str(offset))
        sugerencia = cursor.fetchone()
        print(sugerencia)

        acepta = input("¿Acepta Sugerencia? (s/n): \n")

        if (acepta == 'n'):
            print("Se avanza al siguiente \n")
            offset = offset + 1
            continue

        if (acepta == 's'):
            termino_busqueda = input("Ingrese termino de búsqueda: \n")
            break

while True:
    print("Buscando producto: ", termino_busqueda)
    cursor.execute(f"SELECT * FROM products WHERE name LIKE  '%{termino_busqueda}%'")
    productos = cursor.fetchall()

    numero = 1
    for reg in productos:
        print(numero, ' - ', reg)
        numero = numero + 1

    referenciado = input("Indicar numero de producto referenciado: (-1 para repetir búsqueda) \n")

    if (referenciado != '-1'):
        break
    else:
        termino_busqueda = input("Ingrese termino de búsqueda: \n")

prod_ref = productos[int(referenciado) - 1]
alias = input("Indicar alias ("+prod_ref[1]+"): \n")

pos_actual = 0
for reg in productos:
    print("Registro encontrado: \n")
    entrada = input("¿'"+alias+"' es alias del producto '"+reg[1]+"' ? (s/n/a): ("+str(pos_actual)+"/"+str(len(productos))+") \n")
    print("Se ingresó: ", entrada)
    pos_actual = pos_actual + 1
    if (entrada == 'a'):
        print("saliendo \n")
        exit()

    if (entrada == 'n'):
        print("Ignorando \n")
        continue

    if (entrada == 's'):
        print('Agregando alias \n')

    print("")


"""
insert_alias = (alias, id_refiere_prod, id_prod_adquirido)
cursor.execute("INSERT INTO products_alias (alias, product_id, id_adquirido ) VALUES (%s, %s, %s)", insert_alias)

conexion.commit()

print("Alias relacionado a producto")
"""
conexion.close()