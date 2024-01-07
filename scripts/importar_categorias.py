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

cant_categorias_nuevas = 0
cant_categorias_existentes = 0
cant_categorias_total = 0

with open('tmp/categorias.json') as archivo_json:
    categorias = json.load(archivo_json)

for categoria in categorias:
    categoria = categoria.strip()
    print("Procesado categoria Nivel 0: ",categoria)

    cursor.execute("SELECT * FROM category WHERE name =  %s", (str(categoria),))
    categoria_db = cursor.fetchone()
    cant_categorias_total = cant_categorias_total + 1
    
    if categoria_db == None:
        print("No existe la categoria, se insertara nueva")
        insert = (str(categoria), None)
        print("Se insertara ",  insert)
        cursor.execute("INSERT INTO category (name, root_category_id) VALUES (%s, %s)", insert)
        id_categoria_agregada = cursor.lastrowid
        categorias[categoria]["category"] = id_categoria_agregada
        cant_categorias_nuevas = cant_categorias_nuevas + 1
    else:
        cant_categorias_existentes = cant_categorias_existentes + 1
        print("Ya existe la categoria, se actualiza JSON")
        id_categoria = categoria_db[0]
        categorias[categoria]["category"] = id_categoria
        print(id_categoria)

    for sub_categoria in categorias[categoria]['sub_items']:
        cant_categorias_total = cant_categorias_total + 1
        texto_sub_cat = sub_categoria['texto']
        print("----> Procesando sub categoría: ",texto_sub_cat)

        cursor.execute("SELECT * FROM category WHERE name =  %s", (str(texto_sub_cat),))
        categoria_db = cursor.fetchone()

        if categoria_db == None:
            print("No existe la sub categoria, se insertara nueva")
            insert = (str(texto_sub_cat), categorias[categoria]['category'])
            print('Se insertara ',insert)
            cursor.execute("INSERT INTO category (name, root_category_id) VALUES (%s, %s)", insert)
            id_categoria_agregada = cursor.lastrowid
            sub_categoria['category'] = id_categoria_agregada
            cant_categorias_nuevas = cant_categorias_nuevas + 1
        else:
            cant_categorias_existentes = cant_categorias_existentes + 1
            print("Ya existe la categoria, se actualiza JSON")
            id_categoria = categoria_db[0]
            sub_categoria['category'] = id_categoria
            print(id_categoria)


conexion.commit()

with open('tmp/categorias.json', 'w') as file:
    json.dump(categorias, file)
    print('categorias.json actualizado!')

print("Cantidad de categorias nuevas: ", cant_categorias_nuevas)
print("Categorias existentes: ", cant_categorias_existentes)
print("Total de categorias: ", cant_categorias_total)
