# PLAN DE TRABAJO - SECCIÓN MIS PRODUCTOS
Proyecto: Precio Justo
Fecha inicio: 18 de Febrero 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla las mejoras a la sección "MIS PRODUCTOS" de la aplicación Precio Justo.
El objetivo es mejorar la experiencia de búsqueda de productos con un buscador inteligente
reutilizable, y pulir la página de detalle/historial del producto para que sea más clara,
funcional y visualmente agradable.

### OBJETIVOS PRINCIPALES:
- Crear un buscador inteligente con sugerencias (nombre, código de barras, marca)
- Hacer el buscador reutilizable como componente compartido
- Registrar última interacción por producto para ordenar sugerencias
- Mejorar la página de detalle: título, foto más grande, funciones verificadas
- Asegurar que los cambios en comercios se reflejen en el historial de precios

### ESTADO ACTUAL (pre-plan):
- MisProductosPage.vue: lista de productos sin buscador
- DetalleProductoPage.vue: tiene historial, estadísticas y filtros, pero falta título y foto pequeña
- InfoProducto.vue: imagen fija a 120px de alto, puede ser más grande
- productosStore.js: tiene `buscarProductos()` pero solo por nombre exacto
- EstadisticasProducto.vue: precio promedio y comercios calculados correctamente
- Los precios guardan `p.comercio` (texto) y `p.nombreCompleto` — no ID referenciado

### TECNOLOGÍAS:
- Vue.js 3 + Composition API
- Quasar Framework (q-input, q-list, q-item, q-img)
- Pinia (productosStore)
- Capacitor Storage (via ProductosService)
- Tabler Icons

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: BUSCADOR INTELIGENTE DE PRODUCTOS 🔍 [PENDIENTE]

### Objetivo
Crear un componente `BuscadorProductos.vue` que muestre sugerencias dinámicas
al escribir 3+ caracteres, buscando por nombre (en cualquier orden), código de barras
y marca. Las sugerencias se ordenan por última interacción (más reciente primero).

### Archivos a crear
[ ] Crear src/components/MisProductos/BuscadorProductos.vue

### Archivos a modificar
[ ] productosStore.js — agregar campo `ultimaInteraccion` y getter `productosPorInteraccion`
[ ] productosStore.js — mejorar `buscarProductos()` con búsqueda multi-campo y substring

### Lógica del buscador
[ ] Activar sugerencias solo cuando el usuario escribe >= 3 caracteres
[ ] Mostrar máximo 3 sugerencias en una lista desplegable bajo el input
[ ] Ordenar sugerencias por `ultimaInteraccion` (más reciente → más antigua)
[ ] Buscar por nombre: dividir texto en palabras y verificar que todas estén en el nombre
      Ejemplo: "COLA" encuentra "Coca Cola", "cola diet" encuentra "Coca Cola Diet"
[ ] Buscar por código de barras: coincidencia exacta o parcial del inicio
[ ] Buscar por marca: si el producto tiene campo `marca`, buscar substring
[ ] Al seleccionar una sugerencia: navegar al detalle del producto
[ ] Al presionar Enter sin seleccionar: filtrar lista con todos los resultados
[ ] Al limpiar el campo: mostrar lista completa nuevamente

### UX del componente
[ ] Mostrar ícono de búsqueda en el prepend del input
[ ] Placeholder: "Buscar por nombre, marca o código..."
[ ] Chip o etiqueta pequeña en cada sugerencia indicando tipo de coincidencia
      (por nombre / por código / por marca)
[ ] Resaltar el texto coincidente en la sugerencia (bold)
[ ] Si no hay resultados con 3+ caracteres: mostrar mensaje "Sin coincidencias"

### Reutilización
[ ] El componente recibe `productos` como prop (no accede directo al store)
[ ] Emite evento `@seleccionar` con el producto elegido
[ ] Emite evento `@buscar` con el texto para filtrar la lista completa
[ ] Emite evento `@limpiar` para resetear el filtro
[ ] Esto permite usarlo también en otras páginas en el futuro

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: REGISTRAR ÚLTIMA INTERACCIÓN POR PRODUCTO ⏱️ [PENDIENTE]

### Objetivo
Para que las sugerencias del buscador se ordenen por "más recientemente usado",
necesitamos guardar cuándo fue la última vez que el usuario interactuó con cada producto.

### Archivos a modificar
[ ] productosStore.js — agregar acción `registrarInteraccion(productoId)`
[ ] ProductosService.js — persistir `ultimaInteraccion` en el adaptador

### Lógica
[ ] `registrarInteraccion(productoId)`: actualiza el campo `ultimaInteraccion = new Date().toISOString()`
[ ] Llamar a `registrarInteraccion` cuando el usuario:
      - Abre el detalle de un producto (DetalleProductoPage)
      - Agrega un precio a un producto (DialogoAgregarPrecio)
[ ] Agregar getter `productosPorInteraccion` en el store:
      Ordena por `ultimaInteraccion` desc, con fallback a `fechaActualizacion`

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: INTEGRAR BUSCADOR EN MIS PRODUCTOS 🔌 [PENDIENTE]

### Objetivo
Agregar el buscador a MisProductosPage.vue para que el usuario pueda filtrar
su lista de productos con las sugerencias inteligentes.

### Archivos a modificar
[ ] MisProductosPage.vue — importar y usar BuscadorProductos

### Lógica
[ ] Agregar `BuscadorProductos` debajo del header (igual que el buscador de ComerciosPage)
[ ] Usar clase CSS existente `buscador-centrado` (del sistema de diseño)
[ ] Manejar evento `@buscar`: filtrar `productosOrdenadosPorFecha` localmente (sin ir al store)
[ ] Manejar evento `@seleccionar`: navegar a `/producto/:id`
[ ] Manejar evento `@limpiar`: mostrar todos los productos nuevamente
[ ] La lista filtrada reemplaza temporalmente `productosOrdenadosPorFecha` en el template

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: MEJORAS EN DETALLE DEL PRODUCTO 🎨 [PENDIENTE]

### Objetivo
Mejorar la página DetalleProductoPage y el componente InfoProducto:
agregar título claro, foto más grande, y verificar que todo funcione.

### 4.1 — Título de historial
**Archivo:** DetalleProductoPage.vue
[ ] Agregar un título "Historial de precios" visible entre EstadisticasProducto y FiltrosHistorial
[ ] El título puede ir como `<h6>` con separador o como encabezado de sección
[ ] Mantener consistencia visual con el resto de la página

### 4.2 — Foto del producto más grande
**Archivo:** InfoProducto.vue
[ ] En desktop: aumentar la imagen de 120px a 180px (columna del grid)
[ ] En móvil: aumentar de 35vw a 45vw con máximo de 180px
[ ] Ajustar el grid `grid-template-columns` para acomodar la nueva columna
[ ] El placeholder (ícono de bolsa) también debe crecer proporcionalmente

### 4.3 — Verificar precio promedio
**Archivo:** EstadisticasProducto.vue
[ ] Confirmar que calcula el promedio de TODOS los precios (no solo filtrados)
[ ] Confirmar que muestra el valor correctamente formateado (sin decimales si es entero)
[ ] Verificar que `precioPromedio` no muestre 0 cuando hay precios

### 4.4 — Verificar tendencia
**Archivo:** InfoProducto.vue + EstadisticasProducto.vue
[ ] Confirmar que `tendenciaGeneral` y `porcentajeTendencia` llegan calculados del store
[ ] Verificar lógica en `ProductosService._calcularCamposAutomaticos()`
      (compara precios últimos 30 días vs 30 días anteriores)
[ ] Confirmar que el chip de tendencia en InfoProducto muestra el valor correcto
[ ] Confirmar que la card de tendencia en EstadisticasProducto muestra igual

### 4.5 — Verificar conteo de comercios
**Archivo:** EstadisticasProducto.vue
[ ] La lógica actual usa `new Set(precios.map(p => p.comercio))` — verificar
[ ] Si se usa `comercioId` en precios nuevos y `comercio` (texto) en precios legacy,
      el Set puede duplicar. Revisar y unificar el campo usado.

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: SINCRONIZACIÓN COMERCIOS → HISTORIAL 🔗 [PENDIENTE]

### Objetivo
Cuando el usuario edita el nombre de un comercio en la sección Comercios,
ese cambio debe verse reflejado en el historial de precios del producto.

### Diagnóstico previo necesario
[ ] Verificar qué campos guarda cada precio:
      `p.comercio` (texto plano) vs `p.comercioId` (referencia)
[ ] Si los precios guardan SOLO texto plano → hay que actualizar todos los precios al editar el comercio
[ ] Si los precios guardan `comercioId` → la sincronización es automática al resolver el nombre

### Estrategia según el diagnóstico:
**Caso A: Solo texto plano (p.comercio)**
[ ] En ComerciosService.editarComercio(): buscar todos los productos que tengan ese texto
[ ] Actualizar `p.comercio` y `p.nombreCompleto` en cada precio que coincida
[ ] Esta operación puede ser costosa → mostrar loading

**Caso B: Tienen comercioId**
[ ] En DetalleProductoPage: resolver el nombre del comercio desde `comerciosStore`
      usando el `comercioId` de cada precio al momento de mostrar
[ ] Los cambios en ComerciosStore se reflejan automáticamente

[ ] Implementar la estrategia que corresponda según el diagnóstico
[ ] Agregar test manual: editar un comercio y verificar que el historial se actualiza

═══════════════════════════════════════════════════════════════

## 📋 FASE 6: TESTING Y AJUSTES 🧪 [PENDIENTE]

### Testing del buscador
[ ] Buscar por nombre parcial: "COLA" → "Coca Cola" ✓
[ ] Buscar por palabras en diferente orden: "cola coca" → "Coca Cola" ✓
[ ] Buscar por código de barras completo ✓
[ ] Buscar por código de barras parcial ✓
[ ] Buscar por marca ✓
[ ] Verificar orden de sugerencias (más reciente primero) ✓
[ ] Verificar que con < 3 caracteres no muestra sugerencias ✓
[ ] Verificar limpieza del input ✓
[ ] Verificar que seleccionar una sugerencia navega correctamente ✓

### Testing de detalle del producto
[ ] Foto más grande se ve bien en móvil y desktop ✓
[ ] Título "Historial de precios" visible y bien ubicado ✓
[ ] Precio promedio correcto ✓
[ ] Tendencia refleja precios recientes ✓
[ ] Conteo de comercios sin duplicados ✓

### Testing de sincronización
[ ] Editar nombre de un comercio en la sección Comercios ✓
[ ] Ir al historial de un producto que usa ese comercio ✓
[ ] Confirmar que el nombre actualizado aparece en el historial ✓

### Testing responsivo
[ ] Móvil (xs) - 360px ✓
[ ] Tablet (sm) - 768px ✓
[ ] Desktop (md) - 1024px ✓

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- El buscador NO reemplaza el componente de comercios, es nuevo y específico para productos
- Prioridad: Fase 1 y 2 (buscador) → Fase 4 (mejoras detalle) → Fase 5 (sincronización)
- La Fase 5 requiere diagnóstico previo antes de escribir código
- No cambiar el sistema de diseño CSS existente (reutilizar `.buscador-centrado`, `.contenedor-pagina`)
- Registrar interacción también sirve como base para analytics futuras
- Los campos `marca` en los productos pueden no existir en datos legacy → manejar con optional chaining

═══════════════════════════════════════════════════════════════

## PRÓXIMAS MEJORAS (POST-MVP) 🚀

[ ] Filtros avanzados en Mis Productos (por categoría, por precio, por comercio)
[ ] Ordenar la lista de productos (A-Z, más reciente, más barato)
[ ] Foto del producto desde la cámara
[ ] Compartir historial de precios
[ ] Exportar historial a CSV/PDF

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 0% INICIADO

⏳ Fase 1: Buscador inteligente
⏳ Fase 2: Registrar última interacción
⏳ Fase 3: Integrar buscador en Mis Productos
⏳ Fase 4: Mejoras en detalle del producto
⏳ Fase 5: Sincronización comercios → historial
⏳ Fase 6: Testing y ajustes

═══════════════════════════════════════════════════════════════

**CREADO:** 18 de Febrero 2026
**ESTADO:** ⏳ EN PLANIFICACIÓN
