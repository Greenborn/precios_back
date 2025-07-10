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


cursor.execute("SELECT * FROM enterprice_categorias_menu")
enterprice_mnu_cat = cursor.fetchall()
enterprice_mnu_cat_diccio = {}

for ee_mnu_cat in enterprice_mnu_cat:
    if not ee_mnu_cat[1] in enterprice_mnu_cat_diccio:
        enterprice_mnu_cat_diccio[ee_mnu_cat[1]] = []
    enterprice_mnu_cat_diccio[ee_mnu_cat[1]].append(ee_mnu_cat[2])


diccio_catmenu_cat = {}

cursor.execute("DELETE FROM enterprise_category WHERE 1")
cursor.execute("DELETE FROM category_obtaineds_category_menu WHERE 1")
for ee in empresa_categoria:
    for cc in empresa_categoria[ee]:
        print(ee,cc)
        cursor.execute("INSERT INTO enterprise_category (enterprise_id, category_id) VALUES (%s, %s)", (ee, cc))
        if ee in enterprice_mnu_cat_diccio:
            categorias_ee = enterprice_mnu_cat_diccio[ee]
            
            for cc_ee in categorias_ee:
                if not cc_ee in diccio_catmenu_cat:
                    diccio_catmenu_cat[cc_ee] = {}
                if not cc in diccio_catmenu_cat[cc_ee]:
                    diccio_catmenu_cat[cc_ee][cc] = True
                    cursor.execute("INSERT INTO category_obtaineds_category_menu (category_menu_id, category_id) VALUES (%s, %s)", (cc_ee,cc))
    print("")


conexion.commit()