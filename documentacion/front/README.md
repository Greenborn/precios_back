# 🎨 Documentación del Frontend

Guía completa de la interfaz web del proyecto Precios.

## 🎯 Propósito

El frontend de Precios es una aplicación web moderna que permite:
- ✅ Búsqueda rápida de productos y precios
- ✅ Comparación de precios entre sucursales
- ✅ Visualización de gráficos de tendencias
- ✅ Análisis de incrementos de precios
- ✅ Interfaz responsiva y amigable

## 📁 Estructura

```
front/
├── src/                  # Código fuente
│   ├── components/       # Componentes Vue.js reutilizables
│   ├── views/            # Vistas principales
│   ├── assets/           # Recursos estáticos
│   ├── App.vue           # Componente raíz
│   └── main.js           # Entry point
├── public/               # Archivos públicos estáticos
├── index.html            # HTML principal
├── vite.config.js        # Config de Vite (build tool)
├── vue.config.js         # Config de Vue.js
├── package.json
└── README.md
```

## 🛠️ Tech Stack

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Vue.js** | 3.x | Framework UI |
| **Vite** | 4.x | Build tool moderno |
| **Axios** | 1.x | Cliente HTTP |
| **Tailwind CSS** | 3.x | Estilos (si aplica) |

## 📚 Documentación

- [Arquitectura](./arquitectura.md) - Estructura de componentes y flujos
- [Definición Técnica](./definicion_tecnica.md) - Stack, configuración, instalación

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
cd front
npm install

# Desarrollo (con hot reload)
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

## 🔗 Comunicación con Backend

El frontend se comunica con el backend mediante:

```javascript
// Búsqueda
GET /publico/busqueda/precios?product_name=TÉRMINO

// Obtener categorías
GET /publico/categorias/all

// Actualizar precio
PUT /publico/productos/cargar_nuevo_precio
```

**Base URL configurada en**: `.env` o `vite.config.js`

## ✨ Características Principales

### 1. Búsqueda de Productos
- Búsqueda en tiempo real (case-insensitive)
- Autocompletado
- Filtros por categoría y sucursal

### 2. Comparación de Precios
- Vista de precio actual por sucursal
- Histórico de cambios
- Estadísticas

### 3. Gráficos
- Tendencia de precios
- Incremento acumulado
- Volatilidad por producto

### 4. Responsive Design
- Desktop (1920px+)
- Tablet (768px-1919px)
- Mobile (< 768px)

## 🔄 Ciclo de Vida

```
Usuario → Componente → API Request → Backend
                     ↓
             Response JSON
                     ↓
         Componente actualiza estado
                     ↓
              Vue.js re-renderiza
                     ↓
           Usuario ve resultado
```

## 🎯 Estándares de Código

- **Lenguaje**: ES6+ con async/await
- **Estructura**: Componentes funcionales (Composition API)
- **Estilos**: Scoped (por componente)
- **Naming**: camelCase para variables/métodos, PascalCase para componentes

## 📡 Endpoints Utilizados

Ver [Endpoints Backend](../back/endpoints.md) para documentación completa.

Principales:
- `GET /publico/busqueda/precios` - Búsqueda
- `GET /publico/categorias/all` - Categorías
- `PUT /publico/productos/cargar_nuevo_precio` - Cargar precio
- `GET /publico/estadisticas/incremento_acumulado_mensual` - Estadísticas

## 🧪 Testing

```bash
# (Si aplica)
npm run test
npm run test:coverage
```

## 📦 Build y Despliegue

**Desarrollo**:
```bash
npm run dev
# → Servidor local en http://localhost:3000
```

**Producción**:
```bash
npm run build
# → Genera dist/ con archivos optimizados
```

## 🔐 Variables de Entorno

Archivo: `.env.local` o `.env`

```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
```

## 📝 Convenciones

### Nombres de Componentes
- PascalCase: `SearchBar.vue`, `ProductCard.vue`
- Ubicación: `src/components/`

### Nombres de Vistas
- PascalCase: `SearchView.vue`, `StatsView.vue`
- Ubicación: `src/views/`

### Estado Global (si aplica)
- Pinia Store o Vuex
- Modules: `store/modules/`

## 🐛 Debugging

### Herramientas
1. **Vue DevTools**: Extensión del navegador
2. **Network Tab**: Inspector de requests HTTP
3. **Console**: Logs de errores

### Logs Recomendados
```javascript
console.log('API Response:', response);
console.error('Error en búsqueda:', error);
```

## 🚀 Optimizaciones

- ✅ Lazy loading de componentes
- ✅ Code splitting automático con Vite
- ✅ Caché de respuestas API
- ✅ Minificación y compresión en build

## 📚 Recursos Adicionales

- [Documentación oficial Vue.js](https://vuejs.org)
- [Documentación Vite](https://vitejs.dev)
- [Axios Documentation](https://axios-http.com)

## 📞 Soporte

Para problemas o sugerencias:
1. Revisar logs del navegador (F12)
2. Verificar conectividad con backend
3. Consultar documentación
4. Contactar equipo de desarrollo

---

**Versión**: 1.0  
**Última actualización**: 30 de noviembre de 2025  
**Mantenedor**: Equipo de Frontend

[← Volver a documentación principal](../README.md)
