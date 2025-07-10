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

while True:
    nombre_cat = input("Ingresar nombre categoria: ")

    cursor.execute("SELECT * FROM category WHERE name = %s", (nombre_cat,))
    category = cursor.fetchall()

    if (len(category) == 0):
        print("No existe categoria")
        exit()

    category = category[0]

    print(category)
    alias = input("Ingresar alias: ")

    cursor.execute("SELECT * FROM category_alias WHERE alias = %s", (nombre_cat,))
    alias_exist = cursor.fetchall()
    if (len(alias_exist) == 0):
        print("No existe alias, se crea")
        cursor.execute("INSERT INTO category_alias (category_id, alias) VALUES (%s, %s)", (category[0], alias,))
    else:
        print("Ya existe alias, se elimina anterior, se crea nuevo")
        cursor.execute("DELETE FROM category_alias WHERE alias = %s", (alias,))
        cursor.execute("INSERT INTO category_alias (category_id, alias) VALUES (%s, %s)", (category[0], alias,))

    conexion.commit()

