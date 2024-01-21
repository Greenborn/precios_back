import mysql.connector

conexion = mysql.connector.connect(
    host="localhost",
    user="precios",
    password="precios",
    database="precios"
)

cursor = conexion.cursor()

cursor.execute("SELECT * FROM product_category")
product_category = cursor.fetchall()

cursor.execute("SELECT * FROM branch")
branches = cursor.fetchall()

branch_diccio = {}
for br in branches:
    branch_diccio[br[0]] = br

empresa_categoria = {}
for pc in product_category:
    cursor.execute("SELECT * FROM price WHERE product_id = %s", (pc[1],))
    price_product = cursor.fetchall()
    for price in price_product:
        if not branch_diccio[price[5]][6] in empresa_categoria:
            empresa_categoria[branch_diccio[price[5]][6]] = {}
        empresa_categoria[branch_diccio[price[5]][6]][pc[2]] = True

cursor.execute("DELETE FROM enterprise_category WHERE 1")
for ee in empresa_categoria:
    for cc in empresa_categoria[ee]:
        print(ee,cc)
        cursor.execute("INSERT INTO enterprise_category (enterprise_id, category_id) VALUES (%s, %s)", (ee, cc))
    print("")

conexion.commit()