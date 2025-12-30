# Diagnóstico de Problemas con Servicio de Colas

## 🔍 Síntomas: "El servicio no acusa recibo de peticiones"

Si el backend no está enviando datos correctamente al servicio externo, sigue esta guía de diagnóstico.

---

## ✅ Paso 1: Verificar que el servicio esté corriendo

```bash
# Verificar si hay algo escuchando en puerto 3501
lsof -i :3501

# O con netstat
netstat -tlnp | grep 3501

# O con ss
ss -tlnp | grep 3501
```

**Resultado esperado:**
```
node    12345 usuario   23u  IPv4 123456      0t0  TCP *:3501 (LISTEN)
```

**Si no hay resultado:** El servicio NO está corriendo.

---

## ✅ Paso 2: Ejecutar test de conectividad

```bash
cd /media/debian/Datos EX4/Trabajo/Greenborn/precios/back
node test_conectividad_servicio.js
```

Este test intentará:
1. Verificar variables de entorno
2. Enviar una petición POST al servicio
3. Mostrar el error específico si falla

**Resultado esperado:**
```
======================================================================
TEST DE CONECTIVIDAD - Servicio de Colas
======================================================================
URL: http://localhost:3501

2. Verificando configuración...
   ✓ Variable QUEUE_SERVICE_URL definida: http://localhost:3501

1. Verificando conectividad...
   Enviando POST a http://localhost:3501/add_data
   ✓ Respuesta recibida:
     Status: 200
     Data: { success: true }

✅ ÉXITO: El servicio está funcionando correctamente
✅ El backend puede comunicarse con el servicio de colas
======================================================================
RESULTADO: Todo OK ✅
```

---

## ✅ Paso 3: Verificar configuración del .env

```bash
cd /media/debian/Datos EX4/Trabajo/Greenborn/precios/back
cat .env | grep QUEUE_SERVICE_URL
```

**Debe mostrar:**
```
QUEUE_SERVICE_URL=http://localhost:3501
```

**Si no existe:** Agregar al archivo `.env`:
```bash
echo "QUEUE_SERVICE_URL=http://localhost:3501" >> .env
```

---

## ✅ Paso 4: Probar manualmente con curl

```bash
# Test simple
curl -X POST http://localhost:3501/add_data \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "test",
    "data": {"test": true}
  }'
```

**Resultado esperado:**
```json
{"success":true}
```

**Errores comunes:**

### Error: `curl: (7) Failed to connect`
```
❌ El servicio NO está corriendo
✅ Solución: Iniciar el servicio
```

### Error: `404 Not Found`
```
❌ El servicio está corriendo pero la ruta /add_data no existe
✅ Solución: Verificar que el servicio tenga implementado el endpoint
```

### Error: `400 Bad Request`
```
❌ El formato de los datos es incorrecto
✅ Solución: Revisar que se envíe { clave, data }
```

---

## ✅ Paso 5: Revisar logs del backend

Al iniciar el backend, debe mostrar:

```bash
cd /media/debian/Datos EX4/Trabajo/Greenborn/precios/back
npm start
```

**En los logs debe aparecer:**
```
======================================================================
[routes/productos] Configuración del servicio de colas:
  URL: http://localhost:3501
  Variable de entorno QUEUE_SERVICE_URL: DEFINIDA
======================================================================
```

---

## ✅ Paso 6: Hacer una importación de prueba

Cuando hagas una petición POST al backend:

```bash
curl -X POST http://localhost:3000/admin/productos/importar \
  -H "Content-Type: application/json" \
  -d '{
    "key": "TU_KEY_AQUI",
    "lst_importa": [
      {
        "name": "Test",
        "price": 100,
        "branch_id": 1,
        "category_name": "Test",
        "fecha_registro": "2025-12-30T00:00:00Z"
      }
    ]
  }'
```

**Logs esperados en el backend:**
```
[importar] Recibida petición con 1 productos
[importar] Enviando 1 productos al servicio de colas...
[importar] URL del servicio: http://localhost:3501
[agregarACola] Enviando a http://localhost:3501/add_data, clave: productos
[Cola productos] ✓ Item agregado exitosamente
[importar] ✓ Completado: 1/1 productos enviados
```

**Logs esperados en el servicio de colas:**
```
[add_data] Recibida petición, clave: productos
[add_data] Item agregado a la cola
```

---

## 🚨 Errores Comunes y Soluciones

### 1. `ECONNREFUSED`

**Logs del backend:**
```
[Cola productos] ✗ ERROR: No se puede conectar al servicio en http://localhost:3501
[Cola productos] ✗ Verificar que el servicio esté corriendo en puerto 3501
```

**Causa:** El servicio de colas NO está corriendo

**Solución:**
```bash
cd extra_services/queue_service
npm start
```

---

### 2. `ETIMEDOUT`

**Logs del backend:**
```
[Cola productos] ✗ ERROR: Timeout al conectar con el servicio
```

**Causa:** El servicio está colgado o muy lento

**Solución:**
- Reiniciar el servicio
- Verificar recursos del sistema (CPU, memoria)
- Revisar logs del servicio para ver qué está bloqueando

---

### 3. Variable no definida

**Logs del backend:**
```
[routes/productos] Configuración del servicio de colas:
  URL: http://localhost:3501
  Variable de entorno QUEUE_SERVICE_URL: NO DEFINIDA (usando default)
```

**Causa:** Falta la variable en .env

**Solución:**
```bash
echo "QUEUE_SERVICE_URL=http://localhost:3501" >> back/.env
```

---

### 4. El servicio responde pero no procesa

**Síntoma:** El backend envía OK pero no pasa nada

**Verificar:**
```bash
# Ver si el servicio tiene logs de procesamiento
# Los logs del servicio deben mostrar:
# - Recepción de items
# - Procesamiento de cola
# - Actualización de BD
```

**Solución:** El servicio está recibiendo pero no procesando. Revisar logs del servicio de colas.

---

### 5. Puerto incorrecto

**Logs del backend:**
```
[agregarACola] Enviando a http://localhost:9999/add_data
```

**Causa:** URL mal configurada

**Solución:**
```bash
# Verificar .env
cat .env | grep QUEUE

# Debe ser:
QUEUE_SERVICE_URL=http://localhost:3501

# NO:
QUEUE_SERVICE_URL=http://localhost:9999
```

---

## 📊 Checklist de Diagnóstico

Marca cada ítem al verificarlo:

- [ ] El servicio está corriendo (puerto 3501 en LISTEN)
- [ ] Variable `QUEUE_SERVICE_URL` definida en `.env`
- [ ] Test de conectividad pasa exitosamente
- [ ] curl manual retorna `{"success":true}`
- [ ] Backend muestra configuración correcta al iniciar
- [ ] Logs del backend muestran "✓ Item agregado exitosamente"
- [ ] Logs del servicio muestran recepción de items
- [ ] Logs del servicio muestran procesamiento de items

---

## 🔧 Comandos Útiles

```bash
# Ver logs del backend en tiempo real
cd back
npm start | grep -E "\[importar\]|\[Cola\]|\[agregarACola\]"

# Test rápido de conectividad
node test_conectividad_servicio.js

# Ver procesos en puerto 3501
lsof -i :3501

# Probar endpoint manualmente
curl -X POST http://localhost:3501/add_data \
  -H "Content-Type: application/json" \
  -d '{"clave":"test","data":{"test":true}}'
```

---

## 📞 Siguiente Paso

Si después de seguir esta guía el problema persiste:

1. Ejecutar: `node test_conectividad_servicio.js`
2. Copiar el output completo
3. Revisar los logs del servicio de colas
4. Comparar ambos outputs para encontrar la discrepancia
