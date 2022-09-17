# Datos relacionales

## Precio
- id
- id_producto
- monto
- id_sucursal_comercio
- fecha (time-stamp)

## Comercio
- id
- nombre
- cargado_el
- modificado_el

## Sucursales
- id
- id_comercio
- calle
- numero
- cargado_el
- modificado_el

## Tipo de producto
Por ej: Pure de tomate, Manzana, etc
- id
- nombre
- cargado_el
- modificado_el

## Marca
- id
- id_empresa
- nombre 
- cargado_el
- modificado_el

## Producto
- id
- id_marca
- id_tipo_producto
- id_unidad_medida
- cargado_el
- modificado_el

## Unidad de medida
Por ej: kilo, unidad, litro
- id
- nombre
- cargado_el
- modificado_el

## Categoria prodcuto
- id
- id_padre
- nombre
- cargado_el
- modificado_el

## Categoria comercio
- id 
- id_padre
- nombre 
- cargado_el
- modificado_el

## Producto Categoria producto
- id
- id_producto
- id_categoria_producto
- cargado_el
- modificado_el

## Comercio Categoria comercio
- id
- id_comercio
- id_categoria_producto
- cargado_el
- modificado_el

------------------------------------

## usuario
- id
- nombre
- email
- pass
- cargado_el
- modificado_el

## permisos
- id
- nombre 
- cargado_el
- modificado_el

## rol
- id 
- nombre
- cargado_el
- modificado_el

## permiso rol
- id
- id_rol
- id_permiso
- cargado_el
- modificado_el

## usuario rol
- id
- id_usuario
- id_rol
- cargado_el
- modificado_el

# Datos no relacionales
Se usa para:
- almacenamiento de datos estadisticos, precalculados
- almacenamiento de logs