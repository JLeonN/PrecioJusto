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
- **`@capacitor-mlkit/barcode-scanning`** (scanner de código de barras con ML Kit)
- **`@capacitor/camera`** (captura de fotos)
- **`@capacitor/network`** (detección nativa de conectividad)

### Estado y Datos
- **Pinia** (gestión de estado global)
- **Patrón Strategy** (adaptadores de almacenamiento)

### APIs Externas
- **BuscadorProductosService** (orquestador por código de barras)
- **BusquedaProductosHibridaService** (local primero, APIs después — diálogo agregar y política unificada con escaneo)
- **Open Food Facts** (alimentos), **Open Beauty Facts** (cosméticos), **Open Pet Food Facts** (mascotas), **Open Products Facts** (general)
- **Open Library + Google Books** (libros por ISBN 978/979)
- **UPCitemdb** (comodín general, 100 req/día, solo APK — CORS en browser)
- Ver detalles en Resumen6

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
│   ├── icons/                             # Iconos de la app
│   │   ├── PrecioJusto-Icono.png          # Fuente original PNG (alta resolución)
│   │   ├── favicon-128x128.png            # Generados con: npx @quasar/icongenie generate
│   │   ├── favicon-96x96.png              #   -i public/icons/PrecioJusto-Icono.png -m spa
│   │   ├── favicon-32x32.png
│   │   └── favicon-16x16.png
│   └── Splash/                            # Fondos de splash screen (patrones decorativos)
│       ├── PrecioJustoFondo-1.jpg         # 784×1168 portrait
│       ├── PrecioJustoFondo-2.png         # 1536×1024 landscape
│       ├── PrecioJustoFondo-3.png         # 1536×1024 landscape
│       ├── PrecioJustoFondo-4.jpg         # 784×1168 portrait
│       └── PrecioJustoFondo-6.png         # 1024×1024 square
│
src/
├── almacenamiento/
│   ├── adaptadores/
│   │   ├── LocalStorageAdapter.js          # Implementación con localStorage (dev/testing)
│   │   ├── CapacitorAdapter.js             # Implementación con Capacitor Preferences
│   │   └── FirestoreAdapter.js             # Implementación con Firebase (futuro)
│   │
│   ├── constantes/                          # Constantes globales
│   │   └── Monedas.js                       # Lista completa de monedas del mundo (20+ opciones)
│   │
│   ├── servicios/
│   │   ├── ProductosService.js             # CRUD de productos + cálculos automáticos
│   │   ├── ComerciosService.js             # CRUD de comercios + validación duplicados
│   │   ├── ConfirmacionesService.js        # Gestión de confirmaciones de precios
│   │   ├── PreferenciasService.js          # Preferencias del usuario (moneda, unidad)
│   │   ├── BuscadorProductosService.js     # Orquestador multi-API por código de barras
│   │   ├── BusquedaProductosHibridaService.js  # Local primero + API (código y nombre); ver PlanBusquedaLocalPrimeroYEstadosCarga
│   │   ├── OpenFoodFactsService.js         # Alimentos (Open Food Facts API)
│   │   ├── OpenBeautyFactsService.js       # Cosméticos y perfumes
│   │   ├── OpenPetFoodFactsService.js      # Alimentos para mascotas
│   │   ├── OpenProductsFactsService.js     # Productos generales (electrónica, hogar)
│   │   ├── OpenLibraryService.js           # Libros por ISBN (primario)
│   │   ├── GoogleBooksService.js           # Libros por ISBN (respaldo)
│   │   └── UpcItemDbService.js             # Comodín general (100 req/día, solo APK)
│   │
│   └── stores/
│       ├── productosStore.js               # Estado global de productos (Pinia)
│       ├── comerciosStore.js               # Estado global de comercios (Pinia)
│       ├── confirmacionesStore.js          # Estado global de confirmaciones (Pinia)
│       ├── sesionEscaneoStore.js           # Borradores de escaneo con persistencia (Pinia)
│       └── preferenciasStore.js           # Preferencias del usuario (moneda, unidad) — carga única al iniciar
│
├── components/
│   ├── Compartidos/                         # Componentes reutilizables entre secciones
│   │   ├── BarraSeleccion.vue              # Barra sticky con contador de seleccionados
│   │   ├── BarraAccionesSeleccion.vue      # Barra fixed bottom con botones (eliminar, cancelar)
│   │   ├── InputBusqueda.vue              # Input de búsqueda reutilizable con prop color
│   │   ├── PantallaSplash.vue             # Splash screen con imagen aleatoria al iniciar
│   │   ├── FabAcciones.vue               # FAB genérico reutilizable: Speed Dial multi-acción o botón directo
│   │   ├── SelectorComercioDireccion.vue  # Selector de comercio + dirección reutilizable (emite { id, nombre, direccionId, direccionNombre } | null)
│   │   ├── PieAtribucion.vue              # Pie de atribución de fuentes; props: fuentesApi[], fuentesUsuario[]; muestra origen de datos (API o usuario)
│   │   ├── DialogoVerImagen.vue           # Visor de imagen en grande; props: modelValue, src, titulo, editable; footer con botón Editar → EditorImagen
│   │   └── EditorImagen.vue               # Editor de imagen (rotación 90°, recorte vue-advanced-cropper); pantalla completa; Cancelar/Guardar
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
│   │       ├── DialogoAgregarSucursal.vue           # Modal para agregar sucursal a comercio
│   │       ├── DialogoMismaUbicacion.vue            # Alerta de misma dirección
│   │       └── DialogoMotivoEliminacion.vue         # Confirmación con motivo de eliminación
│   │
│   ├── Scanner/                             # Flujo de escaneo de productos
│   │   ├── EscaneadorCodigo.vue            # Scanner nativo (overlay transparente) + fallback web; prop `continuo` para Ráfaga
│   │   ├── TarjetaEscaneo.vue             # Tarjeta post-escaneo del Modo A (bottom sheet q-dialog)
│   │   └── TarjetaProductoBorrador.vue   # Tarjeta expandible en Mesa de trabajo (chips, edición inline, recuperar foto/datos)
│   │
│   ├── MisProductos/                        # Componentes de productos
│   │   └── ListaProductos.vue              # Contenedor con grid responsivo Quasar
│   │
│   ├── EditarComercio/                     # Componentes de edición de comercio
│   │   ├── SelectorSucursales.vue         # Mini-tarjetas con calle, barrio, artículos por sucursal
│   │   ├── CampoEditable.vue              # Campo inline editable (texto + lápiz → input)
│   │   ├── EstadisticasComercio.vue       # Grid de mini-cards con estadísticas
│   │   └── ListaProductosComercio.vue     # Lista de productos asociados al comercio
│   │
│   └── Tarjetas/                            # Componentes de tarjetas
│       ├── TarjetaBase.vue                 # Tarjeta base reutilizable estilo Yu-Gi-Oh
│       ├── TarjetaProductoYugioh.vue       # Tarjeta de producto (usa TarjetaBase)
│       └── TarjetaComercioYugioh.vue       # Tarjeta de comercio (usa TarjetaBase)
│
├── composables/
│   ├── useSeleccionMultiple.js             # Lógica de selección múltiple reutilizable
│   ├── useDialogoAgregarPrecio.js          # Lógica reutilizable del modal agregar precio
│   ├── useFechaRelativa.js                 # Formato de fechas relativas y cortas
│   ├── useBotonAtras.js                   # Botón back nativo Android (drawer/detalle/salir)
│   ├── useCamaraFoto.js                   # Captura de fotos: cámara nativa + galería (input file)
│   └── useTecladoVirtual.js               # Ajuste automático de dialogs ante teclado virtual Android
├── utils/                                  # Utilidades reutilizables de lógica pura
│   └── PrecioUtils.js                      # Formateo y validación de inputs de precio (formatearPrecioDisplay, soloNumerosDecimales, filtrarInputPrecio, formatearPrecioAlSalir)
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
│   ├── EditarComercioPage.vue               # Página de edición de comercio individual
│   ├── DetalleProductoPage.vue              # Página de detalle individual de producto
│   ├── MisProductosPage.vue                 # Página principal de productos (orquestador del flujo de escaneo)
│   └── MesaTrabajoPage.vue                  # Página Mesa de trabajo (/mesa-trabajo) — borradores de escaneo
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
├── PlanPublicidadAdMob.md                   # 🔧 Integración AdMob (activo — en curso)
├── PlanesFuturos/                           # Ideas y planes sin fecha definida
│   ├── PlanGeolocalizacionComercios.md
│   └── TareasPendientes.md
├── PlanesTerminados/                        # Planes completados (archivo histórico)
│   ├── PlanAmpliarAPIProductos.md
│   ├── PlanFabYEscaneoFormulario.md
│   ├── PlanFotosComercios.md
│   ├── PlanMejorasAndroid.md
│   ├── PlanMesaTrabajo.md
│   ├── PlanPieAtribucion.md
│   ├── PlanSistemaSucursales.md
│   ├── PlanTrabajoActualizacionPrecios.md
│   ├── PlanTrabajoComercio.md
│   ├── PlanTrabajoEscaneoProductos.md
│   └── PlanTrabajoMisProductos.md
└── Resumenes/                               # Documentación técnica del proyecto
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
✅ Búsqueda por código de barras con 7 APIs en cadena (orquestador BuscadorProductosService)
✅ Detección automática de ISBN (978/979) → flujo libros; resto → flujo productos
✅ Búsqueda por nombre y marca (Open Food Facts API)
✅ Autocompletado de datos desde API (nombre, marca, imagen, cantidad, unidad, fuenteDato)
✅ Atribución de fuente visible en detalle del producto ("Datos de Open Food Facts", etc.)
✅ Campo `fotoFuente` en productos ('api' | 'usuario' | null): rastrea si la foto vino de una API o fue tomada/elegida por el usuario
✅ Componente `PieAtribucion.vue` reutilizable: pie discreto al final del scroll con secciones separadas para fuentes API y aportaciones del usuario; integrado en DetalleProductoPage y EditarComercioPage
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
✅ Buscador inline en Mis Productos (por nombre, marca, categoría, código de barras)
✅ Categoría editable en detalle del producto (heredada de API, editable con CampoEditable)
✅ Foto del producto más grande en detalle (desktop: 180px, móvil: 45vw)
✅ Cantidad y unidad del producto visible y editable en DetalleProducto (ej: "500 g", "2 L") — inline entre Categoría y Código de barras
✅ Visor de imagen en grande al hacer click en la foto del producto (DialogoVerImagen.vue)
✅ Editor de imagen en vista grande: rotación 90° izq/der y recorte (EditorImagen.vue con vue-advanced-cropper); integrado en productos y comercios
✅ Registro de última interacción por producto (registrarInteraccion + productosPorInteraccion)
✅ Título "Historial de precios" visible en DetalleProductoPage
✅ Marca editable en detalle del producto (CampoEditable con IconBuildingStore)
✅ Botón restaurar datos desde API en detalle del producto (re-fetch por código de barras)
✅ FAB expandible reutilizable (FabAcciones.vue con q-fab Speed Dial + nextTick para Capacitor)
✅ Modo A — Escaneo rápido: cámara → pausa → TarjetaEscaneo (precio, foto, edición inline) → Mesa de trabajo → cámara reactiva
✅ Modo B — Ráfaga: cámara continua sin pausa (prop `continuo` en EscaneadorCodigo), búsqueda en background (fire-and-forget), tarjetita de aviso sobre la cámara
✅ Mesa de trabajo (MesaTrabajoPage.vue — ruta `/mesa-trabajo`): reemplaza BandejaBorradores; página propia con drawer, ordenamiento por 5 criterios, selección múltiple por long-press, asignación de comercio en bloque, envío parcial, estado vacío con botones de redirección
✅ Registro de comercio rápido desde tarjeta en Mesa de Trabajo (integrado en TarjetaProductoBorrador)
✅ Tarjetita de aviso sobre cámara: Teleport to="body" z-index 10000, visible durante escaneo activo (duplicado + éxito Ráfaga), botón X para cerrar
✅ Detección de duplicados en sesión sin interrumpir el escaneo (aviso sobre cámara)
✅ Auto-fetch al reconectar internet (@capacitor/network, nativo en Android)
✅ Gestión de fotos con composable `useCamaraFoto`: cámara nativa (solo Android) + galería (todas las plataformas). Menú contextual `q-menu` con 3 opciones (Tomar foto, Desde galería, Borrar foto). Integrado en InfoProducto, FormularioProducto, FormularioComercio, EditarComercioPage y DialogoAgregarComercioRapido.

B. Gestión de Comercios y Sucursales

✅ Registro de comercios con formulario completo (nombre, tipo opcional, dirección, barrio, ciudad)
✅ Creación rápida de comercios desde formulario de precio (solo nombre obligatorio)
✅ Diálogo reutilizable DialogoAgregarComercioRapido.vue
✅ Pre-llenado de datos escritos por el usuario en diálogo rápido
✅ Auto-selección del comercio recién creado (flujo sin interrupciones)
✅ Validación de duplicados con algoritmo inteligente (3 niveles)
✅ Detección de nombres similares (Levenshtein distance)
✅ Detección de direcciones cercanas con normalización
✅ Sistema de sucursales: agrupación automática de cadenas por nombre normalizado
✅ Getter `comerciosAgrupados` con dirección principal, top 3, contadores
✅ Diálogo de duplicado exacto con confirmación (DialogoDuplicadoExacto.vue)
✅ Diálogo de coincidencias con opción "agregar sucursal"
✅ Overlay de dirección principal dentro de la imagen de tarjeta
✅ TarjetaBase con sistema de slots genéricos (#overlay-info)
✅ Botón expandir: derecha cuando cerrado, centro cuando abierto
✅ Tipos de comercio predefinidos (campo opcional)
✅ Múltiples direcciones por comercio (agregar/eliminar)
✅ Tarjetas expandibles con sucursales (top 3 + indicador "más...")
✅ Búsqueda en tiempo real con datos agrupados
✅ Selección múltiple con long-press (vibración háptica)
✅ Eliminación múltiple con deshacer (5 segundos)
✅ Sistema de uso reciente (ordenamiento inteligente)
✅ Registro automático de uso al agregar precio
✅ Diálogos de confirmación: coincidencias, duplicado exacto, misma ubicación, motivo eliminación
✅ Página de edición de comercio con edición inline de campos
✅ Selector de sucursales como mini-tarjetas (calle, barrio/ciudad, artículos registrados)
✅ Agregar/eliminar sucursales desde página de edición
✅ Fusionar sucursales (transferir precios entre sucursales)
✅ Estadísticas del comercio (registro, último uso, productos, sucursales)
✅ Lista de productos asociados con último precio, filtrada por sucursal seleccionada
✅ Composable reutilizable de fechas relativas (useFechaRelativa.js)
✅ Conteo de usos calculado desde productos reales (no desde cantidadUsos del store)
✅ Fotos de comercios funcionales: q-menu en FormularioComercio, EditarComercioPage y DialogoAgregarComercioRapido (reemplaza botón placeholder deshabilitado)

C. Integración Comercios + Productos

✅ Selectores de comercio y dirección en FormularioPrecio.vue
✅ Autocompletado de comercios ordenados por uso reciente
✅ Auto-selección de dirección más usada del comercio
✅ Botón "Agregar comercio rápido" debajo del selector de dirección (FormularioPrecio y DialogoAgregarPrecio)
✅ Captura de texto escrito por usuario (nombre comercio + dirección)
✅ Guardado de comercioId y direccionId en precios
✅ Retrocompatibilidad con precios legacy (solo strings)
✅ Registro de uso al guardar precio (actualiza orden)

D. Preferencias de Usuario

✅ Configuración de moneda preferida (UYU por defecto)
✅ Configuración de unidad preferida (unidad por defecto)
✅ Persistencia automática de preferencias en Capacitor Storage
✅ `preferenciasStore.js` — Pinia store reactivo como fuente única de verdad
✅ Carga única al iniciar la app (`MainLayout.vue` → `preferenciasStore.inicializar()`)
✅ Todos los selectores de moneda y unidad sincronizan automáticamente via el store
✅ Al cambiar moneda/unidad en cualquier componente → se persiste y actualiza el estado global
✅ 🐛 Fix: escaneo rápido ahora inicia con la moneda preferida del usuario (ya no hardcodeaba 'UYU' en `_construirItem()`)

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
✅ Ajuste automático de dialogs ante teclado virtual Android: `useTecladoVirtual` mejorado con detección de redimensionamiento visual, scroll inteligente al centro del input enfocado y reducción dinámica de altura del modal. Aplicado en: DialogoAgregarPrecio, DialogoAgregarComercioRapido, DialogoAgregarSucursal, DialogoMotivoEliminacion, TarjetaEscaneo, DialogoAgregarProducto.
✅ Reversión de `behavior="dialog"` en selectores móviles en favor de un modo menú con `maxHeight` limitado, garantizando que el desplegable siempre aparezca debajo del input sin ser tapado por el teclado.
✅ Inputs de precio unificados (`type="text"` + `inputmode="decimal"`): FormularioPrecio, DialogoAgregarPrecio, TarjetaEscaneo y TarjetaProductoBorrador usan string interno + `PrecioUtils.js` (`soloNumerosDecimales`, `filtrarInputPrecio`, `formatearPrecioAlSalir`). Display de precios en UI vía `formatearPrecioDisplay` (locale `es-UY`, 2 decimales solo si hay parte decimal).

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
✅ Uso de `publicPath` condicional (`process.env.GITHUB_ACTIONS`) para habilitar compatibilidad de activos estáticos simultáneamente entre Capacitor Android local y subpath de Github Pages
✅ Dependencias de despliegue (Node 22) y nombres de importación normalizados para prever Strict Case-Sensitivity en Ubuntu/Linux

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
- `editarDireccion(comercioId, direccionId, datos)`: Edita dirección existente

**Getters:**
- `comerciosOrdenados`: Comercios ordenados alfabéticamente
- `comerciosPorUso`: Comercios ordenados por uso reciente
- `comerciosAgrupados`: Comercios agrupados por nombre (cadenas como una sola tarjeta)
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

### sesionEscaneoStore.js
**Propósito:** Mesa de trabajo del flujo de escaneo. Cada ítem tiene su propio comercio (no hay un comercio global de sesión). Se persiste en Capacitor Storage.

**Estado:**
- `items`: Array de ítems escaneados, cada uno con:
  `{ id, codigoBarras, nombre, marca, cantidad, unidad, imagen, precio, moneda, origenApi, fuenteDato, productoExistenteId, comercio, datosOriginales }`
  - `comercio`: `null` por defecto → se asigna en la Mesa de trabajo (`{ id, nombre, direccionId, direccionNombre }`)
  - `datosOriginales`: snapshot inmutable `{ nombre, marca, cantidad, unidad, imagen }` — solo si `origenApi || productoExistenteId`; `null` para productos nuevos. `actualizarItem()` lo preserva via spread.
- `cargando`: Boolean mientras se hidrata desde storage

**Acciones:**
- `cargarSesion()`: Hidrata desde Capacitor Storage al iniciar (con migración automática para ítems sin `comercio`)
- `agregarItem(item)`: Agrega ítem con `comercio: null`
- `actualizarItem(id, cambios)`: Edita campos de un ítem existente
- `asignarComercio(ids[], comercio)`: Asignación en bloque a múltiples ítems
- `eliminarItem(id)`: Elimina un ítem por ID
- `limpiarTodo()`: Vacía la mesa y elimina del storage

**Getters:**
- `cantidadItems`: Cantidad de ítems (para badge en drawer)
- `tieneItemsPendientes`: Boolean

### preferenciasStore.js
**Propósito:** Fuente única de verdad para las preferencias del usuario. Se inicializa una sola vez al arrancar la app (en `MainLayout.vue`) y queda disponible reactivamente en todos los componentes.

**Estado:**
- `moneda`: String de la moneda preferida ('UYU', 'USD', 'EUR', etc.) — default 'UYU'
- `unidad`: String de la unidad preferida ('unidad', 'litro', 'kilo', etc.) — default 'unidad'

**Acciones:**
- `inicializar()`: Carga preferencias desde `PreferenciasService` (una vez al arrancar)
- `guardarMoneda(val)`: Actualiza `moneda` en el store y persiste en storage
- `guardarUnidad(val)`: Actualiza `unidad` en el store y persiste en storage

**Componentes que lo usan:**
- `FormularioPrecio` — init + guarda al cambiar moneda
- `FormularioProducto` — init + guarda al cambiar unidad
- `DialogoAgregarProducto` — init + `limpiarFormulario()` (ahora sync)
- `DialogoAgregarPrecio` — init, guarda al cambiar, reset correcto al cerrar
- `TarjetaEscaneo` — init, reset, guarda cuando el usuario cambia explícitamente
- `TarjetaProductoBorrador` — guarda cuando el usuario edita la moneda del ítem

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
- `buscarPorNombre(termino)`: Coincidencia por substring en nombre
- `buscarPorTextoFlexible(termino)`: Búsqueda local alineada al filtro de Mis Productos (nombre, marca, categoría, código)

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

### BuscadorProductosService.js (orquestador)
**Responsabilidades:**
- Único punto de entrada para búsquedas por código de barras
- Detecta ISBN (978/979) y enruta al flujo correcto
- Prueba APIs en orden, retorna el primer resultado

**Retorna:** `{ producto, fuenteDato }` o `null`

### BusquedaProductosHibridaService.js
**Responsabilidades:**
- Encapsula la política “base local primero, APIs si hace falta” (plan `Planes/PlanBusquedaLocalPrimeroYEstadosCarga.md`)
- `buscarPorCodigoConPolitica(codigo, { forzarApi })`: si hay producto local y no se fuerza API, no llama al orquestador; expone `puedeEnriquecerConApi` para el pie del diálogo de resultados
- `buscarPorNombreConPolitica(texto, { ampliarOpenFoodFacts })`: primero `ProductosService.buscarPorTextoFlexible`; si hay resultados locales, no llama a OFF salvo ampliación explícita; si no hay locales, llama a `OpenFoodFactsService.buscarPorTexto`
- Exporta `FUENTE_DATO_LOCAL` (`Mis productos`) para etiquetar filas en `DialogoResultadosBusqueda`

### OpenFoodFactsService.js y familia
- `OpenFoodFactsService` — alimentos; también `buscarPorTexto(texto)` (uso vía capa híbrida en flujos “agregar producto” cuando corresponde)
- `OpenBeautyFactsService` — cosméticos/perfumes
- `OpenPetFoodFactsService` — alimentos mascotas
- `OpenProductsFactsService` — productos generales
- `OpenLibraryService` — libros (Books API, sin redirect)
- `GoogleBooksService` — libros (respaldo)
- `UpcItemDbService` — comodín general (CORS en browser, OK en APK)
- Ver detalles técnicos en Resumen6

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
      { path: 'comercios/:nombre', component: EditarComercioPage },
      { path: 'mesa-trabajo', component: MesaTrabajoPage }
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
- ✅ Escaneo de código de barras con cámara (Completado - Fases 1-10)

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
  - Resumen2Tarjetas.md — Componentes de tarjetas (TarjetaBase, TarjetaProducto, TarjetaComercio)
  - Resumen3DetalleProducto.md — Página de detalle de producto
  - Resumen4FormularioAgregar.md — Formulario agregar producto + precio
  - Resumen5Comercios.md — Sistema de comercios y sucursales
  - Resumen6OpenFoodFacts.md — APIs de búsqueda de productos
  - Resumen7LocalStorage.md — Sistema de almacenamiento (adaptadores, stores)
  - Resumen8Scanner.md — Sistema de escaneo completo (Ráfaga, Escaneo rápido, Mesa de trabajo)

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
- Diálogos con visor/editor de imagen y formularios modales: `DialogoVerImagen.vue` y `EditorImagen.vue` aplican `var(--safe-area-top)` / `var(--safe-area-bottom)` en header, footer y toolbar; `DialogoAgregarProducto.vue` usa clase `acciones-safe-area` en `q-card-actions` para el pie del modal ante teclado + safe area
- ⚠️ **Toda página nueva que use `q-page-sticky` con FAB** debe incluir:
  ```html
  <q-page-sticky ... class="fab-agregar">
  ```
  ```css
  .fab-agregar { bottom: calc(18px + var(--safe-area-bottom)) !important; }
  ```

**Botón back nativo** → `src/composables/useBotonAtras.js` (integrado en `MainLayout.vue`)
- Requiere `@capacitor/app`. Solo activo en `Capacitor.isNativePlatform()`

**Splash Screen**
- Componente: `src/components/Compartidos/PantallaSplash.vue` (integrado en `App.vue`)
- Imagen aleatoria de `public/Splash/` con `object-fit: cover` + `object-position` aleatorio
- Duración: `max(2000ms, tiempo real de carga)` + fade-out de 400ms
- Señal "app lista" vía `nextTick()` en `App.vue`

### Estado Actual
- **Versión:** 1.0.9
- **Almacenamiento:** Local (Capacitor Storage)
- **Sistema de sucursales:** Completado
- **Edición de comercios:** Completada
- **Sección Mis Productos:** Completada
- **FAB reutilizable:** Completado (FabAcciones.vue — Speed Dial multi-acción o botón directo)
- **Flujo de escaneo — Modo A (Escaneo rápido):** Completado (TarjetaEscaneo, foto, edición inline)
- **Flujo de escaneo — Modo B (Ráfaga):** Completado (cámara continua, búsqueda background, aviso sobre cámara)
- **Mesa de trabajo:** Completada (reemplaza BandejaBorradores; ordenamiento, selección, envío parcial, filtro de búsqueda por nombre/marca/categoría)
- **APIs de búsqueda:** Completado (7 APIs orquestadas, libros por ISBN, fuenteDato en UI)
- **Safe area:** Completada (Android 15+ edge-to-edge)
- **Botón back nativo:** Completado
- **Splash screen:** Completada (imagen aleatoria, sin distorsión)
- **Fotos de productos y comercios:** Completada (useCamaraFoto, q-menu contextual, 5 componentes)
- **Pie de atribución:** Completado (PieAtribucion.vue en DetalleProductoPage + EditarComercioPage; campo fotoFuente en productos)
- **Preparación:** Lista para migración a Firebase
- **Publicidad AdMob:** En curso (ver PlanPublicidadAdMob.md — pendiente IDs de producción)
- **Ver detalles del sistema de escaneo:** Resumen8Scanner.md

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

**Última actualización:** 24 de Marzo 2026 — Safe area en `DialogoVerImagen`, `EditorImagen` y acciones de `DialogoAgregarProducto` (notch / home indicator). v1.0.9: editor de imágenes (rotación, recorte vue-advanced-cropper) y botón Editar en vista grande.
