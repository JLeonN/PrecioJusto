# PLAN DE TRABAJO - FAB REUTILIZABLE Y ESCANEO UNITARIO EN FORMULARIO

Proyecto: Precio Justo
Fecha inicio: Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Dos universos que estaban mezclados se separan correctamente:

1. **Escaneo unitario en formulario:** El botón de cámara en el campo "Código de barras"
   del formulario de agregar producto lanzaba toda la sesión de escaneo rápido. Ahora
   solo escanea un código, lo llena en el campo, y dispara la búsqueda en la API.

2. **FAB reutilizable con animaciones:** El botón flotante (+) en MisProductosPage era
   un q-btn simple que abría directamente el formulario. Se reemplaza por un componente
   `FabAcciones.vue` genérico basado en `q-fab` (Speed Dial de Quasar), que expande
   opciones al hacer click y es reutilizable en todas las páginas.

### OBJETIVOS PRINCIPALES:

- Separar "escaneo rápido en sesión" de "escaneo unitario para campo de formulario"
- Crear FabAcciones.vue reutilizable con `q-fab` (animación de expansión/rotación)
- Dar al usuario la elección entre "Escaneo rápido" y "Agregar manual" desde el FAB
- Reutilizar el mismo componente FAB en MisProductosPage, ComerciosPage y DetalleProductoPage

### CARACTERÍSTICAS CLAVE:

- Escaneo unitario: EscaneadorCodigo se instancia directamente en DialogoAgregarProducto
- Al escanear: llena el campo + busca en API automáticamente (sin clicks extra)
- FAB multi-acción: se expande con slide-up animado, icono + rota a X
- FAB acción única: botón directo sin expansión (ComerciosPage, DetalleProductoPage)
- Safe area de iOS/Android manejada internamente en FabAcciones.vue

### ARCHIVOS CREADOS:

- `src/components/Compartidos/FabAcciones.vue` — componente FAB genérico

### ARCHIVOS MODIFICADOS:

- `src/components/Formularios/FormularioProducto.vue`
- `src/components/Formularios/Dialogos/DialogoAgregarProducto.vue`
- `src/pages/MisProductosPage.vue`
- `src/pages/ComerciosPage.vue`
- `src/pages/DetalleProductoPage.vue`

═══════════════════════════════════════════════════════════════

## ✅ FASE 1: ESCANEO UNITARIO EN EL FORMULARIO [COMPLETADA]

### FormularioProducto.vue

[x] Cambiar `emit('iniciar-escaneo')` → `emit('escanear-codigo')` en el botón de cámara
[x] Actualizar `defineEmits` para reflejar el nuevo nombre del evento

### DialogoAgregarProducto.vue

[x] Importar `EscaneadorCodigo.vue` desde `../../Scanner/EscaneadorCodigo.vue`
[x] Agregar `const escanerUnitarioActivo = ref(false)`
[x] Cambiar `@iniciar-escaneo="alIniciarEscaneo"` por `@escanear-codigo="alEscanearCodigo"` en el template
[x] Agregar `<EscaneadorCodigo :activo="escanerUnitarioActivo" @codigo-detectado="alDetectarCodigo" @cerrar="escanerUnitarioActivo = false" />`
[x] Agregar función `alEscanearCodigo()`: activa el scanner unitario
[x] Agregar función `alDetectarCodigo(codigo)`: llena campo + llama `buscarPorCodigo()` automáticamente
[x] Eliminar función `alIniciarEscaneo()` (ya no usada)
[x] Limpiar `defineEmits`: quitar `'iniciar-escaneo'` (nunca más se emite)

### MisProductosPage.vue

[x] Quitar `@iniciar-escaneo="abrirSelectorComercio"` del template de DialogoAgregarProducto

═══════════════════════════════════════════════════════════════

## ✅ FASE 2: FAB REUTILIZABLE CON ANIMACIONES [COMPLETADA]

### FabAcciones.vue (nuevo)

[x] Crear `src/components/Compartidos/FabAcciones.vue`
[x] Props: `acciones[]` (icono, label, color, accion), `color`, `posicion`, `offset`
[x] Si `acciones.length > 1`: renderiza `q-fab` con `q-fab-action` (speed dial animado)
[x] Si `acciones.length === 1`: renderiza `q-btn` directo (sin expansión innecesaria)
[x] CSS `.fab-sticky`: `bottom: calc(18px + var(--safe-area-bottom, 0px)) !important`
[x] Iconos via `<component :is="accion.icono">` (componentes Tabler)
[x] Labels a la izquierda del icono (`label-position="left"`)

### MisProductosPage.vue

[x] Importar `IconScan` y `FabAcciones`
[x] Reemplazar `q-page-sticky > q-btn` con `<FabAcciones v-if="!modoSeleccion" :acciones="accionesFab" />`
[x] Definir `accionesFab`: 2 opciones (IconScan → Escaneo rápido, IconPlus → Agregar manual)
[x] Eliminar CSS `.fab-agregar` (ahora en FabAcciones.vue)

### ComerciosPage.vue

[x] Importar `IconPlus` y `FabAcciones`
[x] Reemplazar FAB con `<FabAcciones :acciones="accionFab" />`
[x] Definir `accionFab`: 1 opción (IconPlus → Agregar comercio)
[x] Eliminar CSS `.fab-agregar`

### DetalleProductoPage.vue

[x] Importar `FabAcciones`
[x] Reemplazar FAB con `<FabAcciones :acciones="accionFab" />`
[x] Definir `accionFab` como computed (para capturar `productoActual.value?.id`): 1 opción (IconPlus → Agregar precio)
[x] Eliminar CSS `.fab-agregar`

═══════════════════════════════════════════════════════════════

## ⏳ FASE 3: REDISEÑO DEL ESCANEO RÁPIDO Y BANDEJA DE BORRADORES [PENDIENTE - SIN PLANIFICAR]

> Esta fase está en discusión. Antes de arrancar hay que hablar con Leo y definir
> exactamente cómo se modifica el flujo de escaneo rápido y la bandeja.

### Contexto del problema

El flujo actual de escaneo rápido (BandejaBorradores + sesionEscaneoStore) funciona bien,
pero tiene aspectos que el usuario quiere revisar. Puntos en discusión:

- Cómo empieza la sesión (selector de comercio antes de escanear)
- Qué tan visible y accesible está la bandeja de borradores
- La relación entre el "escaneo rápido" del FAB y la sesión con comercio activo
- Si se puede tomar foto del producto mientras se escanea (foto rápida opcional)

### Ideas que surgieron en la discusión (sin confirmar)

- [ ] Revisar el flujo de inicio de sesión de escaneo (¿pedir comercio antes o después?)
- [ ] Evaluar si la BandejaBorradores necesita ser más accesible o visible
- [ ] Agregar opción de foto rápida en FormularioEscaneo (mientras se escanean productos)
- [ ] Posibles cambios en sesionEscaneoStore según el nuevo flujo

### Archivos que probablemente se modifiquen

- `src/components/Scanner/FormularioEscaneo.vue`
- `src/components/Scanner/BandejaBorradores.vue`
- `src/almacenamiento/stores/sesionEscaneoStore.js`
- `src/pages/MisProductosPage.vue` (flujo de inicio de sesión)

═══════════════════════════════════════════════════════════════

## 🧪 TESTING [PENDIENTE]

### T.A — Escaneo unitario en el formulario

[ ] Abrir "Agregar Producto" (FAB → "Agregar manual")
[ ] Hacer click en el ícono de cámara dentro del campo "Código de barras"
[ ] El overlay del escáner se abre (nativo o input manual en web)
[ ] Escanear/ingresar un código de barras conocido
[ ] Verificar que el campo se llena automáticamente con el código
[ ] Verificar que la búsqueda en la API se dispara automáticamente (sin click extra)
[ ] Si el producto se encuentra: aparece el diálogo de resultados de búsqueda
[ ] Si no se encuentra: aparece el notify de "No se encontró el producto"
[ ] El formulario sigue abierto (no se cerró ni cambió de pantalla)

### T.B — FAB expandible en MisProductosPage

[ ] En MisProductosPage: click en el FAB (+)
[ ] Se expande mostrando 2 opciones con labels a la izquierda
[ ] Opción "Escaneo rápido" (icono de escáner): abre el flujo de sesión de escaneo
[ ] Opción "Agregar manual" (icono +): abre el formulario DialogoAgregarProducto
[ ] El FAB se cierra al hacer click en cualquier opción
[ ] El icono + rota a X al expandir, y vuelve a + al colapsar
[ ] En modo selección: el FAB se oculta correctamente

### T.C — FAB en ComerciosPage

[ ] En ComerciosPage: click en el FAB (+)
[ ] Se abre el formulario de agregar comercio directamente (sin expandir)
[ ] En modo selección: el FAB se oculta correctamente

### T.D — FAB en DetalleProductoPage

[ ] En DetalleProductoPage: click en el FAB (+)
[ ] Se abre el diálogo de agregar precio directamente (sin expandir)
[ ] El FAB solo aparece cuando el producto está cargado y sin loading

### T.E — Regresión: flujo de escaneo rápido completo

[ ] Desde MisProductosPage: FAB → "Escaneo rápido"
[ ] El flujo de sesión con BandejaBorradores funciona igual que antes
[ ] Escanear productos, agregar a la bandeja, confirmar guardado
[ ] Los productos guardados aparecen en la lista correctamente

### T.F — Safe area (solo en dispositivo físico Android/iOS)

[ ] El FAB no queda tapado por la barra de navegación del sistema
[ ] La posición es consistente en pantallas con notch y sin notch

═══════════════════════════════════════════════════════════════

## NOTAS TÉCNICAS

### EscaneadorCodigo en modo unitario
- El componente ya soporta modo unitario de fábrica: escanea 1 código, emite `'codigo-detectado'`, se detiene solo
- No fue necesario modificar EscaneadorCodigo.vue
- En `DialogoAgregarProducto`, el `q-dialog` permanece abierto mientras el scanner está activo (el overlay lo tapa)

### FabAcciones.vue — Tabler Icons en q-fab-action
- `q-fab-action` no acepta componentes Vue en el prop `icon` (solo strings Material)
- La solución: slot default de `q-fab-action` renderiza el Tabler Icon vía `<component :is="accion.icono">`

### accionesFab en MisProductosPage
- `const accionesFab = [...]` — array estático (no computed), las funciones son referencias estables
- `abrirSelectorComercio` y `abrirDialogoAgregar` son function declarations (hoisted), disponibles en el array
