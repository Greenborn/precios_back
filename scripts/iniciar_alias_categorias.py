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

cursor.execute("SELECT * FROM category")
categorias = cursor.fetchall()

cursor.execute("DELETE FROM category_alias WHERE 1")

for cat in categorias:
    print(cat[0], cat[2])
    cursor.execute("INSERT INTO category_alias (category_id, alias) VALUES (%s, %s)", (cat[0], cat[2]))

conexion.commit()