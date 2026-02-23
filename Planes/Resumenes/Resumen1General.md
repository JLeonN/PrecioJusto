# RESUMEN GENERAL - PRECIO JUSTO

## PROPÓSITO
Este documento proporciona una visión general completa de Precio Justo, incluyendo su arquitectura, tecnologías, estructura de archivos y funcionalidades principales. Está diseñado para que desarrolladores y asistentes de IA comprendan rápidamente el proyecto.

---

## 1. DESCRIPCIÓN DEL PROYECTO
**Precio Justo** es una aplicación móvil para Android que permite a los usuarios uruguayos:
- Registrar precios de productos en diferentes comercios
- Comparar precios entre comercios
- Encontrar las mejores ofertas
- Contribuir a una base de datos colaborativa de precios

La app está desarrollada con **Vue.js 3**, **Quasar Framework** y **Capacitor**, siguiendo una arquitectura modular y escalable.

---

## 2. TECNOLOGÍAS Y STACK

### Frontend
- **Vue.js 3** (Composition API con `<script setup>`)
- **Quasar Framework v2** (componentes UI y utilidades)
- **JavaScript** (sin TypeScript)

### Mobile
- **Capacitor** (wrapper para Android)
- **Capacitor Storage** (almacenamiento local)

### Estado y Datos
- **Pinia** (gestión de estado global)
- **Patrón Strategy** (adaptadores de almacenamiento)

### APIs Externas
- **Open Food Facts API** (información de productos por código de barras)

### Iconos
- **Tabler Icons** (sistema de iconos consistente)

---

## 3. ARQUITECTURA

### Patrón de 3 Capas
```
┌─────────────────────────────────────┐
│   Capa de Presentación (Vue)        │  ← Componentes, Páginas
├─────────────────────────────────────┤
│   Capa de Estado (Pinia Stores)     │  ← Estado reactivo global
├─────────────────────────────────────┤
│   Capa de Negocio (Services)        │  ← Lógica, validaciones
├─────────────────────────────────────┤
│   Capa de Datos (Adapters)          │  ← Abstracción de storage
└─────────────────────────────────────┘
```

### Flujo de Datos
1. **Usuario interactúa** con componente Vue
2. **Componente llama** a método del Store (Pinia)
3. **Store ejecuta** lógica en Service
4. **Service usa** Adapter para persistir datos
5. **Adapter interactúa** con Capacitor Storage
6. **Estado se actualiza** reactivamente en la UI

---

## 4. ESTRUCTURA DE ARCHIVOS
```
PrecioJusto/
│
├── public/                                 # Archivos públicos estáticos
│   ├── favicon.ico                        # Ícono oficial (generado con @quasar/icongenie)
│   └── icons/                             # Iconos de la app
│       ├── PrecioJusto-Icono.png          # Fuente original PNG (alta resolución)
│       ├── favicon-128x128.png            # Generados con: npx @quasar/icongenie generate
│       ├── favicon-96x96.png              #   -i public/icons/PrecioJusto-Icono.png -m spa
│       ├── favicon-32x32.png
│       └── favicon-16x16.png
│
src/
├── almacenamiento/
│   ├── adaptadores/
│   │   ├── LocalStorageAdapter.js          # Implementación con localStorage (dev/testing)
│   │   ├── CapacitorAdapter.js             # Implementación con Capacitor Preferences
│   │   └── FirestoreAdapter.js             # Implementación con Firebase (futuro)
│   │
│   ├── constantes/                          # 🆕 Constantes globales
│   │   └── Monedas.js                       # Lista completa de monedas del mundo (20+ opciones)
│   │
│   ├── servicios/
│   │   ├── ProductosService.js             # CRUD de productos + cálculos automáticos
│   │   ├── ComerciosService.js             # CRUD de comercios + validación duplicados
│   │   ├── ConfirmacionesService.js        # Gestión de confirmaciones de precios
│   │   ├── PreferenciasService.js          # Preferencias del usuario (moneda, unidad)
│   │   └── OpenFoodFactsService.js         # Integración con API Open Food Facts
│   │
│   └── stores/
│       ├── productosStore.js               # Estado global de productos (Pinia)
│       ├── comerciosStore.js               # Estado global de comercios (Pinia)
│       └── confirmacionesStore.js          # Estado global de confirmaciones (Pinia)
│
├── components/
│   ├── Compartidos/                         # Componentes reutilizables entre secciones
│   │   ├── BarraSeleccion.vue              # Barra sticky con contador de seleccionados
│   │   ├── BarraAccionesSeleccion.vue      # Barra fixed bottom con botones (eliminar, cancelar)
│   │   └── InputBusqueda.vue              # 🆕 Input de búsqueda reutilizable con prop color
│   │
│   ├── Comercios/                           # Componentes de comercios
│   │   ├── ListaComercios.vue              # Contenedor con grid responsivo Quasar
│   │   └── TarjetaComercioYugioh.vue       # Tarjeta expandible de comercio con direcciones
│   │
│   ├── DetalleProducto/                     # Componentes de detalle de producto
│   │   ├── InfoProducto.vue                # Cabecera con imagen, nombre, marca, código
│   │   ├── EstadisticasProducto.vue        # Métricas en cards (promedio, tendencia, comercios)
│   │   ├── FiltrosHistorial.vue            # Filtros de comercio, período y ordenamiento
│   │   ├── HistorialPrecios.vue            # Contenedor y agrupador por comercio
│   │   ├── ItemComercioHistorial.vue       # Comercio expandible con precios agrupados
│   │   └── ItemPrecioHistorial.vue         # Precio individual con confirmaciones
│   │
│   ├── Formularios/                         # Formularios modulares
│   │   ├── FormularioProducto.vue          # Datos del producto (sin categoría)
│   │   ├── FormularioPrecio.vue            # Datos del precio con selectores de comercio/dirección
│   │   ├── FormularioComercio.vue          # Datos del comercio completo
│   │   └── Dialogos/                        # Diálogos modales
│   │       ├── DialogoAgregarProducto.vue           # Modal para agregar producto + precio
│   │       ├── DialogoAgregarComercio.vue           # Modal para agregar comercio completo
│   │       ├── DialogoAgregarPrecio.vue             # Modal rápido para agregar precio a producto
│   │       ├── DialogoResultadosBusqueda.vue        # Modal con resultados de Open Food Facts
│   │       ├── DialogoCoincidencias.vue             # Alerta de comercios similares (agregar sucursal)
│   │       ├── DialogoDuplicadoExacto.vue           # Confirmación de duplicado exacto
│   │       ├── DialogoAgregarSucursal.vue           # 🆕 Modal para agregar sucursal a comercio
│   │       ├── DialogoMismaUbicacion.vue            # Alerta de misma dirección
│   │       └── DialogoMotivoEliminacion.vue         # Confirmación con motivo de eliminación
│   │
│   ├── MisProductos/                        # Componentes de productos
│   │   └── ListaProductos.vue              # Contenedor con grid responsivo Quasar
│   │
│   ├── EditarComercio/                     # 🆕 Componentes de edición de comercio
│   │   ├── SelectorSucursales.vue         # 🆕 Mini-tarjetas con calle, barrio, artículos por sucursal
│   │   ├── CampoEditable.vue              # Campo inline editable (texto + lápiz → input)
│   │   ├── EstadisticasComercio.vue       # Grid de mini-cards con estadísticas
│   │   └── ListaProductosComercio.vue     # Lista de productos asociados al comercio
│   │
│   └── Tarjetas/                            # Componentes de tarjetas
│       ├── TarjetaBase.vue                 # 🆕 Tarjeta base reutilizable estilo Yu-Gi-Oh
│       ├── TarjetaProductoYugioh.vue       # Tarjeta de producto (usa TarjetaBase)
│       └── TarjetaComercioYugioh.vue       # Tarjeta de comercio (usa TarjetaBase)
│
├── composables/
│   ├── useSeleccionMultiple.js             # Lógica de selección múltiple reutilizable
│   ├── useDialogoAgregarPrecio.js          # Lógica reutilizable del modal agregar precio
│   ├── useFechaRelativa.js                 # Formato de fechas relativas y cortas
│   └── useBotonAtras.js                   # 🆕 Botón back nativo Android (drawer/detalle/salir)
├── css/
│   ├── app.css                              # Clases CSS globales del Design System
│   ├── quasar.variables.scss               # Variables de Quasar (colores, fuentes)
│   └── Variables.css                        # Variables CSS custom del proyecto
│
├── layouts/
│   └── MainLayout.vue                       # Layout principal con header + drawer + router-view
│
├── pages/
│   ├── ComerciosPage.vue                    # Página de gestión de comercios
│   ├── EditarComercioPage.vue               # 🆕 Página de edición de comercio individual
│   ├── DetalleProductoPage.vue              # Página de detalle individual de producto
│   └── MisProductosPage.vue                 # Página principal de productos
│
├── router/
│   ├── index.js                             # Configuración del router de Vue
│   └── routes.js                            # Definición de rutas (/, /comercios, /comercios/:nombre, /producto/:id)
│
├── App.vue                                  # Componente raíz de Vue
└── main.js                                  # Punto de entrada de la aplicación

android/                                      # Carpeta generada por Capacitor para Android nativo
├── app/                                     # Código nativo Android
│   ├── src/                                 # Fuentes de la app nativa
│   └── build.gradle                         # Configuración de build de Android
└── capacitor.config.json                    # Configuración de Capacitor

.editorconfig                                # Configuración de editor
.eslintrc.cjs                                # Configuración de ESLint
.gitignore                                   # Archivos ignorados por Git
.prettierrc                                  # Configuración de Prettier
.vscode/                                     # Configuración de VS Code
├── extensions.json                          # Extensiones recomendadas
└── settings.json                            # Configuración del workspace
babel.config.cjs                             # Configuración de Babel
jsconfig.json                                # Configuración de JavaScript
package.json                                 # Dependencias y scripts del proyecto
package-lock.json                            # Lock de versiones de dependencias
quasar.config.js                             # Configuración principal de Quasar
README.md                                    # Documentación del proyecto

CLAUDE.md                                    # Instrucciones para Claude IA (carga automática)

Resúmenes de Documentación/                  # En raíz del proyecto
├── Resumen1General.md                       # Documentación general del proyecto
├── Resumen2Tarjetas.md                      # Documentación de componentes de tarjetas
├── Resumen3DetalleProducto.md               # Documentación de detalle de producto
├── Resumen4FormularioAgregar.md             # Documentación de formularios
├── Resumen5Comercios.md                     # Documentación de sección comercios
├── Resumen6OpenFoodFacts.md                 # Documentación de integración API
└── Resumen7LocalStorage.md                  # Documentación de almacenamiento

Planes/                                      # Planes de trabajo e implementación
├── PlanSistemaSucursales.md                 # Sistema de comercios con cadenas y sucursales
├── PlanTrabajoActualizacionPrecios.md       # Plan de actualización de precios
└── PlanTrabajoComercio.md                   # Plan de trabajo de comercios
```

---

## 5. SISTEMA DE DISEÑO (DESIGN SYSTEM)

### Filosofía
Precio Justo utiliza un **sistema de diseño centralizado** basado en clases CSS globales reutilizables. Esto garantiza:
- ✅ Consistencia visual en toda la app
- ✅ Mantenimiento centralizado
- ✅ DRY (Don't Repeat Yourself)
- ✅ Escalabilidad para futuras secciones

### Estructura CSS
```
src/css/
├── Variables.css    # Variables CSS (colores, espaciados, sombras)
└── app.css          # Clases globales del sistema de diseño
```

### Clases Globales Implementadas

#### **CONTENEDORES**
```css
.contenedor-pagina {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
```
**Uso:** Envuelve todo el contenido de una página
**Aplicado en:** MisProductosPage.vue, ComerciosPage.vue, DetalleProductoPage.vue

#### **HEADERS DE PÁGINA**
```css
.header-pagina {
  margin-bottom: 16px;
}

.titulo-pagina {
  margin: 0;
  font-weight: bold;
}

.contador-items {
  color: var(--texto-secundario);
  margin-bottom: 0;
}
```
**Uso:** Headers consistentes con título + contador
**Ejemplo:**
```vue
<div class="header-pagina">
  <h5 class="titulo-pagina">Mis Productos</h5>
  <p class="contador-items">4 productos guardados</p>
</div>
```

#### **BUSCADORES**
```css
.buscador-centrado {
  margin-top: 24px;
  margin-bottom: 24px;
}
```
**Uso:** Input de búsqueda reutilizable (sin max-width, ocupa ancho completo)
**Implementado via:** `InputBusqueda.vue` (componente compartido, prop `color`)
**Aplicado en:** MisProductosPage.vue (color default) y ComerciosPage.vue (color="orange")

#### **TARJETAS**
```css
.tarjeta {
  background-color: var(--fondo-tarjeta);
  border-radius: var(--borde-radio);
  box-shadow: var(--sombra-ligera);
  padding: var(--espaciado-md);
}
```
**Uso:** Tarjetas genéricas (alternativa a componentes específicos)

#### **BOTONES**
```css
.boton-primario {
  background-color: var(--color-primario);
  color: var(--texto-sobre-primario);
}

.boton-secundario {
  background-color: var(--color-secundario);
  color: var(--texto-sobre-primario);
}
```
**Uso:** Botones personalizados fuera de Quasar

### Variables CSS Principales

#### **Colores**
```css
--color-primario: #2196f3;        /* Azul principal */
--color-secundario: #4caf50;      /* Verde */
--color-acento: #ff9800;          /* Naranja */
--color-exito: #4caf50;
--color-advertencia: #ff9800;
--color-error: #f44336;
--color-info: #2196f3;
```

#### **Fondos**
```css
--fondo-app: #eeeeee;             /* Gris medio */
--fondo-tarjeta: #ffffff;         /* Blanco */
--fondo-drawer: #f5f5f5;          /* Gris claro */
```

#### **Texto**
```css
--texto-primario: #212121;
--texto-secundario: #757575;
--texto-deshabilitado: #bdbdbd;
--texto-sobre-primario: #ffffff;
```

#### **Espaciados**
```css
--espaciado-xs: 4px;
--espaciado-sm: 8px;
--espaciado-md: 16px;
--espaciado-lg: 24px;
--espaciado-xl: 32px;
```

#### **Sombras**
```css
--sombra-ligera: 0 1px 3px rgba(0, 0, 0, 0.12);
--sombra-media: 0 2px 8px rgba(0, 0, 0, 0.15);
--sombra-fuerte: 0 4px 16px rgba(0, 0, 0, 0.2);
```

### Sistema de Grid Responsivo

Precio Justo utiliza el **sistema de columnas de Quasar** para layouts responsivos:
```vue
<div class="row q-col-gutter-md">
  <div class="col-12 col-sm-6 col-md-4 col-xl-3">
    <!-- Contenido -->
  </div>
</div>
```

**Breakpoints:**
- `col-12`: Móvil (1 columna)
- `col-sm-6`: Tablet pequeña (2 columnas)
- `col-md-4`: Tablet/PC (3 columnas)
- `col-xl-3`: PC grande (4 columnas)

**Aplicado en:**
- ListaProductos.vue
- ListaComercios.vue

---

## 6. FUNCIONALIDADES IMPLEMENTADAS

A. Gestión de Productos

✅ Registro manual de productos (nombre, marca, código de barras, cantidad, unidad)
✅ Campo categoría eliminado (simplificación del formulario)
✅ Búsqueda por código de barras (Open Food Facts API)
✅ Búsqueda por nombre y marca (Open Food Facts API)
✅ Autocompletado de datos desde API (nombre, marca, imagen, cantidad, unidad)
✅ Registro de precios con múltiples monedas (20+ opciones: UYU, USD, EUR, ARS, BRL, etc.)
✅ Monedas centralizadas en constantes (fácil agregar nuevas)
✅ Validación de cantidades y unidades (kg, g, L, mL, unidades, pack, metro)
✅ Sistema de confirmaciones comunitarias para precios
✅ Visualización de top 3 precios más bajos por producto
✅ Tarjetas expandibles con detalles completos
✅ Formato de fechas relativo (hace 2 días, hace 1 mes)
✅ Click-to-copy en códigos de barras con notificación
✅ Selección múltiple con long-press (vibración háptica)
✅ Eliminación múltiple con deshacer (5 segundos)
✅ Detalle de producto con historial completo por comercio
✅ Filtros de historial (comercio, período, orden precio/fecha)
✅ Confirmaciones de precios con validación de usuario único
✅ Estadísticas: precio promedio, tendencia, total de comercios
✅ 🆕 Buscador inline en Mis Productos (por nombre, marca, categoría, código de barras)
✅ 🆕 Categoría editable en detalle del producto (heredada de API, editable con CampoEditable)
✅ 🆕 Foto del producto más grande en detalle (desktop: 180px, móvil: 45vw)
✅ 🆕 Registro de última interacción por producto (registrarInteraccion + productosPorInteraccion)
✅ 🆕 Título "Historial de precios" visible en DetalleProductoPage

B. Gestión de Comercios y Sucursales

✅ Registro de comercios con formulario completo (nombre, tipo opcional, dirección, barrio, ciudad)
✅ 🆕 Creación rápida de comercios desde formulario de precio (solo nombre obligatorio)
✅ 🆕 Diálogo reutilizable DialogoAgregarComercioRapido.vue
✅ 🆕 Pre-llenado de datos escritos por el usuario en diálogo rápido
✅ 🆕 Auto-selección del comercio recién creado (flujo sin interrupciones)
✅ Validación de duplicados con algoritmo inteligente (3 niveles)
✅ Detección de nombres similares (Levenshtein distance)
✅ Detección de direcciones cercanas con normalización
✅ 🆕 Sistema de sucursales: agrupación automática de cadenas por nombre normalizado
✅ 🆕 Getter `comerciosAgrupados` con dirección principal, top 3, contadores
✅ 🆕 Diálogo de duplicado exacto con confirmación (DialogoDuplicadoExacto.vue)
✅ 🆕 Diálogo de coincidencias con opción "agregar sucursal"
✅ 🆕 Overlay de dirección principal dentro de la imagen de tarjeta
✅ 🆕 TarjetaBase con sistema de slots genéricos (#overlay-info)
✅ 🆕 Botón expandir: derecha cuando cerrado, centro cuando abierto
✅ Tipos de comercio predefinidos (campo opcional)
✅ Múltiples direcciones por comercio (agregar/eliminar)
✅ Tarjetas expandibles con sucursales (top 3 + indicador "más...")
✅ Búsqueda en tiempo real con datos agrupados
✅ Selección múltiple con long-press (vibración háptica)
✅ Eliminación múltiple con deshacer (5 segundos)
✅ Sistema de uso reciente (ordenamiento inteligente)
✅ Registro automático de uso al agregar precio
✅ Diálogos de confirmación: coincidencias, duplicado exacto, misma ubicación, motivo eliminación
✅ 🆕 Página de edición de comercio con edición inline de campos
✅ 🆕 Selector de sucursales como mini-tarjetas (calle, barrio/ciudad, artículos registrados)
✅ 🆕 Agregar/eliminar sucursales desde página de edición
✅ 🆕 Fusionar sucursales (transferir precios entre sucursales)
✅ 🆕 Estadísticas del comercio (registro, último uso, productos, sucursales)
✅ 🆕 Lista de productos asociados con último precio, filtrada por sucursal seleccionada
✅ 🆕 Composable reutilizable de fechas relativas (useFechaRelativa.js)
✅ 🆕 Conteo de usos calculado desde productos reales (no desde cantidadUsos del store)

C. Integración Comercios + Productos

✅ Selectores de comercio y dirección en FormularioPrecio.vue
✅ Autocompletado de comercios ordenados por uso reciente
✅ Auto-selección de dirección más usada del comercio
✅ 🆕 Botón "Agregar comercio rápido" debajo del selector de dirección (FormularioPrecio y DialogoAgregarPrecio)
✅ Captura de texto escrito por usuario (nombre comercio + dirección)
✅ Guardado de comercioId y direccionId en precios
✅ Retrocompatibilidad con precios legacy (solo strings)
✅ Registro de uso al guardar precio (actualiza orden)

D. Preferencias de Usuario

✅ Configuración de moneda preferida (UYU por defecto)
✅ Configuración de unidad preferida (unidad por defecto)
✅ Persistencia automática de preferencias en Capacitor Storage
✅ Sincronización reactiva con toda la UI
✅ Carga automática al abrir formularios

E. Sistema de Almacenamiento

✅ Patrón Strategy con adaptadores intercambiables
✅ Implementación actual: CapacitorStorageAdapter (almacenamiento local)
✅ Preparado para migración futura a Firebase/Firestore
✅ Métodos estándar: obtenerTodos, obtenerPorId, crear, actualizar, eliminar, existe
✅ Prefijos de clave organizados: producto_, comercio_, confirmaciones_, preferencias_
✅ Manejo de errores consistente con logs detallados

F. Sistema de Diseño (Design System)

✅ Clases CSS globales centralizadas en app.css
✅ Variables CSS custom en Variables.css
✅ Contenedor de página reutilizable (.contenedor-pagina)
✅ Headers estandarizados (.header-pagina, .titulo-pagina, .contador-items)
✅ Buscador centrado estilo Google (.buscador-centrado)
✅ Grid responsivo Quasar (4 breakpoints: xs, sm, md, xl)
✅ Sistema de colores consistente (primary, secondary, accent, warning, info, negative)
✅ Animaciones y transiciones estandarizadas
✅ Componentes compartidos reutilizables (BarraSeleccion, BarraAccionesSeleccion)

G. UX y Accesibilidad

✅ Vibración háptica en interacciones clave (long-press, confirmaciones)
✅ Notificaciones Quasar con feedback visual claro
✅ Estados de carga con spinners
✅ Estados vacíos con mensajes amigables
✅ Botones deshabilitados con tooltips explicativos
✅ Validaciones en tiempo real con mensajes de error
✅ Confirmaciones con opción de deshacer (5 segundos)
✅ Scroll automático al expandir tarjetas
✅ Formato de números con separadores de miles
✅ Formato de fechas en español uruguayo

H. Arquitectura y Código

✅ Composition API de Vue 3 en todos los componentes
✅ State management con Pinia
✅ Componentes modulares y reutilizables
✅ Separation of concerns (servicios, stores, componentes)
✅ Código limpio con nombres descriptivos en español
✅ ESLint + Prettier configurados
✅ Logs estructurados con emojis para debugging
✅ Manejo de errores robusto con try-catch
✅ Constantes centralizadas (evita duplicación)

---

## 7. STORES DE PINIA

### productosStore.js
**Estado:**
- `productos`: Array de productos
- `cargando`: Boolean de estado de carga
- `error`: String de mensaje de error

**Acciones:**
- `cargarProductos()`: Carga todos los productos desde storage
- `agregarProducto(producto)`: Agrega un nuevo producto
- `agregarPrecioAProducto(productoId, precio)`: Agrega precio a producto existente
- `actualizarProducto(id, datos)`: Actualiza producto existente
- `eliminarProducto(id)`: Elimina un producto

**Getters:**
- `productosOrdenados`: Productos ordenados alfabéticamente
- `productosOrdenadosPorFecha`: Productos ordenados por fecha (más reciente primero)
- `obtenerProductoPorId(id)`: Busca producto por ID
- `tieneProductos`: Boolean si hay productos

### comerciosStore.js
**Estado:**
- `comercios`: Array de comercios
- `cargando`: Boolean de estado de carga
- `error`: String de mensaje de error

**Acciones:**
- `cargarComercios()`: Carga todos los comercios desde storage
- `agregarComercio(comercio)`: Agrega un nuevo comercio
- `actualizarComercio(id, datos)`: Actualiza comercio existente
- `eliminarComercio(id)`: Elimina un comercio
- `eliminarComercios(ids)`: Elimina múltiples comercios
- `agregarDireccion(comercioId, direccion)`: Agrega dirección a comercio
- `eliminarDireccion(comercioId, direccionId)`: Elimina dirección de comercio
- `editarDireccion(comercioId, direccionId, datos)`: 🆕 Edita dirección existente

**Getters:**
- `comerciosOrdenados`: Comercios ordenados alfabéticamente
- `comerciosPorUso`: Comercios ordenados por uso reciente
- `comerciosAgrupados`: 🆕 Comercios agrupados por nombre (cadenas como una sola tarjeta)
- `obtenerComercioPorId(id)`: Busca comercio por ID
- `totalComercios`: Cantidad total de comercios
- `totalDirecciones`: Suma de todas las direcciones
- `comerciosPorTipo`: Comercios agrupados por tipo

### confirmacionesStore.js
**Estado:**
- `usuarioActualId`: ID del usuario actual (hardcodeado temporalmente)
- `preciosConfirmados`: Set de IDs de precios confirmados
- `cargando`: Boolean de estado de carga
- `error`: String de mensaje de error

**Acciones:**
- `cargarConfirmaciones()`: Carga confirmaciones del usuario
- `confirmarPrecio(productoId, precioId)`: Confirma un precio
- `eliminarConfirmacion(productoId, precioId)`: Des-confirma un precio
- `obtenerEstadisticas()`: Estadísticas del usuario
- `limpiarTodasLasConfirmaciones()`: Reset completo

**Getters:**
- `totalConfirmaciones`: Cantidad de precios confirmados
- `precioEstaConfirmado(precioId)`: Verifica si precio está confirmado
- `listaConfirmaciones`: Array de IDs confirmados

### preferenciaStore.js
**Estado:**
- `idioma`: String del idioma seleccionado ('es' o 'en')
- `moneda`: String de la moneda preferida ('UYU', 'USD', 'EUR', etc.)
- `unidad`: String de la unidad preferida ('unidad', 'litro', 'kilo', etc.)

**Acciones:**
- `cargarPreferencias()`: Carga preferencias desde storage
- `actualizarPreferencia(clave, valor)`: Actualiza una preferencia específica

---

## 8. SERVICIOS

### ProductosService.js
**Responsabilidades:**
- CRUD completo de productos
- Validaciones de datos (nombre, precio, cantidad, unidad)
- Gestión de precios asociados a productos
- Cálculo de campos automáticos (precioMejor, tendencias)
- Integración con productosStore

**Métodos principales:**
- `obtenerTodos()`: Obtiene todos los productos
- `obtenerPorId(id)`: Obtiene un producto específico
- `crear(producto)`: Crea un nuevo producto
- `actualizar(id, datos)`: Actualiza producto existente
- `eliminar(id)`: Elimina un producto
- `agregarPrecio(productoId, precio)`: Agrega precio a producto
- `buscarPorCodigoBarras(codigo)`: Busca producto por código

### ComerciosService.js
**Responsabilidades:**
- CRUD completo de comercios
- Validación de duplicados con algoritmo de similitud (3 niveles)
- Detección de nombres similares (Levenshtein distance < 3)
- Detección de direcciones cercanas (similitud > 80%)
- Agrupación de cadenas por nombre normalizado
- Gestión de múltiples direcciones por comercio
- Acepta comercios opcionales en validación (evita queries innecesarias)
- Integración con comerciosStore

**Métodos principales:**
- `obtenerTodos()`: Obtiene todos los comercios
- `obtenerPorId(id)`: Obtiene un comercio específico
- `crear(comercio)`: Crea un nuevo comercio (con validación de duplicados)
- `actualizar(id, datos)`: Actualiza comercio existente
- `eliminar(id)`: Elimina un comercio
- `buscarSimilares(nombre, direccion)`: Detecta comercios similares
- `agregarDireccion(comercioId, direccion)`: Agrega dirección a comercio
- `eliminarDireccion(comercioId, direccionId)`: Elimina dirección
- `registrarUso(comercioId, direccionId)`: Actualiza fechas de uso

### ConfirmacionesService.js
**Responsabilidades:**
- Sistema de confirmaciones (upvotes) de precios
- Validación de confirmaciones únicas por usuario
- Persistencia de confirmaciones por usuario
- Integración con confirmacionesStore

**Métodos principales:**
- `confirmarPrecio(usuarioId, productoId, precioId)`: Confirma un precio
- `usuarioConfirmoPrecio(usuarioId, precioId)`: Verifica si usuario confirmó
- `registrarConfirmacionUsuario(usuarioId, precioId)`: Guarda confirmación
- `cargarConfirmacionesUsuario(usuarioId)`: Carga Set de precios confirmados
- `eliminarConfirmacion(usuarioId, productoId, precioId)`: Des-confirma precio

### OpenFoodFactsService.js
**Responsabilidades:**
- Integración con Open Food Facts API
- Búsqueda por código de barras
- Búsqueda por nombre y marca
- Transformación de datos de API a formato local
- Manejo de múltiples resultados

**Métodos principales:**
- `buscarPorCodigoBarras(codigo)`: Busca producto por código de barras
- `buscarPorTexto(texto, limite)`: Busca productos por texto

### PreferenciasService.js
**Responsabilidades:**
- Guardar configuraciones del usuario
- Cargar preferencias al iniciar app
- Valores por defecto

**Métodos principales:**
- `obtenerPreferencias()`: Retorna preferencias o valores por defecto
- `guardarMoneda(moneda)`: Actualiza moneda preferida
- `guardarUnidad(unidad)`: Actualiza unidad preferida

---

## 9. COMPONENTES PRINCIPALES

### TarjetaProducto.vue
**Propósito:** Mostrar productos con sus precios en formato de tarjeta expandible

**Props:**
- `producto`: Object (requerido) - Datos del producto
- `modoSeleccion`: Boolean - Indica si está en modo selección
- `seleccionado`: Boolean - Indica si está seleccionada

**Características:**
- Muestra top 3 precios más bajos
- Expandible para ver todos los detalles
- Imagen del producto (o placeholder)
- Código de barras con click-to-copy
- Fecha relativa de último precio
- Indicador de ahorro (diferencia entre precio más bajo y más alto)
- Long-press para modo selección (1 segundo)
- Checkbox en modo selección

### TarjetaComercio.vue
**Propósito:** Mostrar comercios en formato de tarjeta expandible

**Props:**
- `comercio`: Object (requerido) - Datos del comercio
- `modoSeleccion`: Boolean - Indica si está en modo selección
- `seleccionado`: Boolean - Indica si está seleccionada

**Características:**
- Logo/foto del comercio (o placeholder con IconBuilding)
- Tipo de comercio con badge
- Cantidad de direcciones
- Expandible para ver lista de direcciones
- Botón de editar (solo expandido)
- Long-press para modo selección
- Checkbox en modo selección
- Expansión flotante (no mueve otras tarjetas)

### ListaProductos.vue
**Propósito:** Contenedor con grid responsivo de productos

**Props:**
- `productos`: Array (requerido)
- `modoSeleccion`: Boolean
- `seleccionados`: Set

**Características:**
- Grid responsivo Quasar (col-12 col-sm-6 col-md-4 col-xl-3)
- Maneja eventos de selección
- Sin header (el header está en la página)

### ListaComercios.vue
**Propósito:** Contenedor con grid responsivo de comercios

**Props:**
- `comercios`: Array (requerido)
- `modoSeleccion`: Boolean
- `seleccionados`: Set

**Características:**
- Grid responsivo Quasar (col-12 col-sm-6 col-md-4 col-xl-3)
- Mensaje si no hay comercios
- Maneja eventos de selección y edición

---

## 10. PÁGINAS

### IndexPage.vue
**Ruta:** `/`
**Propósito:** Página de inicio/bienvenida
**Estado:** Vacía por ahora

### MisProductosPage.vue
**Ruta:** `/` (default)
**Propósito:** Listado completo de productos

**Características:**
- Header con título y contador
- Lista de TarjetaProducto
- Floating Action Button para agregar producto
- Carga desde productosStore
- Modo selección múltiple
- BarraSeleccion (sticky)
- BarraAccionesSeleccion (fixed bottom)
- Eliminación múltiple con deshacer
- Estados: cargando, vacío, error

### DetalleProductoPage.vue
**Ruta:** `/producto/:id`
**Propósito:** Historial completo de un producto específico

**Características:**
- InfoProducto (cabecera)
- EstadisticasProducto (métricas)
- FiltrosHistorial (comercio, período, orden)
- HistorialPrecios (agrupado por comercio)
- Confirmaciones de precios
- Tendencias por comercio
- Navegación desde TarjetaProducto

### ComerciosPage.vue
**Ruta:** `/comercios`
**Propósito:** Listado completo de comercios

**Características:**
- Header con título y contador
- Buscador centrado (max-width 500px)
- Lista de TarjetaComercio
- Floating Action Button para agregar comercio
- Carga desde comerciosStore
- Búsqueda en tiempo real
- Modo selección múltiple
- BarraSeleccion (sticky)
- BarraAccionesSeleccion (fixed bottom)
- Eliminación múltiple con deshacer
- Estados: cargando, vacío, sin resultados, error

### ErrorNotFound.vue
**Ruta:** Catch-all `/:catchAll(.*)*`
**Propósito:** Página 404

---

## 11. NAVEGACIÓN (Router)

### Configuración
- **Modo:** Hash (URLs con #)
- **Layout:** MainLayout para todas las rutas

### Rutas Definidas
```javascript
[
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: MisProductosPage },
      { path: 'producto/:id', component: DetalleProductoPage },
      { path: 'comercios', component: ComerciosPage },
      { path: 'comercios/:nombre', component: EditarComercioPage }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]
```

---

## 12. COLORES Y DISEÑO

### Paleta de Colores (Variables.css)
- **$primary:** #2196F3 (Azul oscuro) - Color principal de la app
- **$secondary:** #4CAF50 (Verde) - Indicadores de ahorro y éxito
- **$accent:** #FF9800 (Naranja) - Alertas y advertencias
- **$dark:** #1D1D1D - Modo oscuro
- **$positive:** #4CAF50 (Verde) - Acciones positivas
- **$negative:** #C10015 (Rojo) - Errores y eliminaciones
- **$info:** #31CCEC (Cian) - Información
- **$warning:** #F2C037 (Amarillo) - Advertencias

### Principios de Diseño
- Mobile-first (optimizado para portrait)
- Tarjetas como unidad visual principal
- Floating Action Buttons para acciones principales
- Iconos Tabler para consistencia visual
- Espaciado generoso para táctil
- Sistema de diseño centralizado (app.css)
- Grid responsivo Quasar

---

## 13. CONVENCIONES DE CÓDIGO

### Nomenclatura
- **Carpetas y Archivos:** PascalCase
  - `GestionUsuarios/`, `TarjetaProducto.vue`
- **Variables y Funciones:** camelCase en español
  - `nombreProducto`, `calcularPrecioPromedio()`
- **Componentes:** PascalCase
  - `TarjetaProducto`, `BotonPrimario`
- **Stores:** camelCase con sufijo "Store"
  - `productosStore`, `comerciosStore`
- **Services:** PascalCase con sufijo "Service"
  - `ProductosService`, `ComerciosService`
- **Clases CSS globales:** kebab-case
  - `.contenedor-pagina`, `.buscador-centrado`

### Estilo de Código
- Vue 3 Composition API con `<script setup>`
- JavaScript (no TypeScript)
- Código limpio con mínimos comentarios
- Props tipadas con validación
- Emits declarados explícitamente
- Imports organizados: externos primero, luego internos
- Estilos scoped solo cuando sean específicos del componente
- Usar clases globales de app.css cuando sea posible

---

## 14. ROADMAP Y FASES

### Fase 1: MVP Local (Mayormente Completada)
- ✅ CRUD de productos y comercios
- ✅ Integración con Open Food Facts
- ✅ Sistema de preferencias
- ✅ Validación de duplicados en comercios
- ✅ Búsqueda local inteligente
- ✅ Sistema de diseño centralizado
- ⏳ Escaneo de código de barras con cámara (Pendiente - Stage 4)

### Fase 2: Funcionalidades Colaborativas (Futuro)
- ⏳ Migración de CapacitorStorage a Firebase/Firestore
- ⏳ Sistema de usuarios y autenticación
- ⏳ Compartir precios entre usuarios
- ⏳ Sistema de reputación
- ⏳ Confirmaciones comunitarias globales

### Fase 3: Funcionalidades Avanzadas (Futuro)
- ⏳ Geolocalización para comercios cercanos
- ⏳ Notificaciones de ofertas
- ⏳ Historial detallado de evolución de precios
- ⏳ Sistema de favoritos y listas personalizadas
- ⏳ Exportación/importación de datos
- ⏳ Gráficos de tendencias de precios

---

## 15. NOTAS PARA ASISTENTES DE IA

### Contexto de Este Documento
- Diseñado para comprensión rápida del proyecto por parte de IAs
- Proporciona visión de alto nivel
- Para detalles técnicos específicos, consultar resúmenes por área:
  - Resumen2Tarjetas.txt
  - Resumen3DetalleProducto.txt
  - Resumen4FormularioAgregar.txt
  - Resumen5Comercios.txt
  - Resumen6OpenFoodFacts.txt
  - Resumen7LocalStorage.txt

### Principios del Proyecto
1. **Nomenclatura en Español:** Todo el código usa español descriptivo
2. **Arquitectura Modular:** Separación clara de responsabilidades
3. **Mobile-First:** Diseño optimizado para dispositivos móviles
4. **UX Primero:** Implementar UI antes que lógica backend
5. **Commits Incrementales:** Desarrollo paso a paso con control de versiones
6. **Sistema de Diseño Centralizado:** Clases CSS globales en app.css

### Patrones de integración Android (Capacitor)

**Safe Area (Android 15+ edge-to-edge)**
- Variables en `Variables.css`: `--safe-area-top` y `--safe-area-bottom`
- Header: `.q-header { padding-top: var(--safe-area-top) }` en `app.css` (global, sin tocar)
- `BarraAccionesSeleccion.vue` ya tiene `padding-bottom: calc(12px + env(safe-area-inset-bottom))`
- ⚠️ **Toda página nueva que use `q-page-sticky` con FAB** debe incluir:
  ```html
  <q-page-sticky ... class="fab-agregar">
  ```
  ```css
  .fab-agregar { bottom: calc(18px + var(--safe-area-bottom)) !important; }
  ```

**Botón back nativo** → `src/composables/useBotonAtras.js` (integrado en `MainLayout.vue`)
- Requiere `@capacitor/app`. Solo activo en `Capacitor.isNativePlatform()`

### Estado Actual
- **Versión:** MVP funcional (~95% completado)
- **Almacenamiento:** Local (Capacitor Storage)
- **Sistema de sucursales:** Completado (agrupación automática de cadenas, mini-tarjetas)
- **Edición de comercios:** Completada (página completa con edición inline, fusión, estadísticas, filtro por sucursal)
- **Sección Mis Productos:** Completada (buscador inline, categoría editable, historial mejorado)
- **Safe area:** Completada (Android 15+ edge-to-edge, variables CSS centralizadas)
- **Próximo Milestone:** Botón back nativo, foto de comercio
- **Preparación:** Lista para migración a Firebase

---

## 16. INFORMACIÓN ADICIONAL

### Licencia
Proyecto personal de código propietario

### Autor
Leo (Desarrollador principal)

### Repositorio
GitHub: JLeonN/PrecioJusto

### Stack de Desarrollo
- Node.js
- Quasar CLI
- Capacitor CLI
- Git para control de versiones

---

**Última actualización:** Febrero 19, 2026 (buscador inline, mini-tarjetas sucursales, filtro por sucursal, usos reales)
