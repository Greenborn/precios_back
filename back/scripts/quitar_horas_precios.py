import mysql.connector
from datetime import datetime, timedelta

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()

cursor.execute("SELECT * FROM price")
resultados = cursor.fetchall()

for precio in resultados:
    fecha_reg = precio[3]
    fecha_reg = fecha_reg.strftime("%Y-%m-%d")
    id = precio[0]

    sql = "UPDATE price SET date_time = %s WHERE id = %s"
    cursor.execute(sql, (fecha_reg, id,))

    print(fecha_reg, id)
    
conexion.commit()