#!/usr/local/bin/python
# -*- coding: utf-8 -*-
import simplejson as json
import mysql.connector
import argparse
from decimal import Decimal

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()

print("Consultando precios canasta: ")
cursor.execute(f"SELECT * FROM productos_canasta_basica")
productos = cursor.fetchall()


for producto in productos:
    id_producto = producto[1]
    cursor.execute(f"SELECT * FROM price WHERE product_id = '{id_producto}' AND date_time >= '2025-03-01'")
    precios_ = cursor.fetchall()
    precios_ = json.dumps(precios_, use_decimal=True, default=str)
    cursor.execute(f"UPDATE productos_canasta_basica SET precios='{precios_}' WHERE id_producto='{id_producto}'")
    print(id_producto)
    print("")

conexion.commit()