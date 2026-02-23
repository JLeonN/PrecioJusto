# PLAN DE TRABAJO - MEJORAS DE INTEGRACIÓN ANDROID

Proyecto: Precio Justo
Fecha inicio: 23 de Febrero 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla tres mejoras de integración nativa con Android:
corrección del área segura (safe area) para dispositivos con Android 15+,
soporte del botón físico de retroceso con navegación inteligente,
y generación del ícono oficial en todos los tamaños requeridos por el navegador.

### OBJETIVOS PRINCIPALES:

- Generar los archivos de ícono faltantes que el `index.html` ya referencia
- Corregir la superposición de la interfaz del sistema con el contenido de la app
- Interceptar el botón back nativo para navegar correctamente en lugar de cerrar la app

### DIAGNÓSTICO PREVIO AL PLAN:

- **Íconos:** `index.html` ya referencia `icons/favicon-*.png` y `favicon.ico`,
  pero `public/icons/` está vacío y el `favicon.ico` es el genérico de Quasar.
  Ícono fuente oficial disponible en `public/icons/PrecioJusto-Icono.png`.

- **Safe area:** `viewport-fit=cover` ya lo agrega Quasar automáticamente en builds
  Capacitor (línea 12 de `index.html`). Solo faltan las reglas CSS que respeten
  las insets del sistema. Android 15 forzó edge-to-edge → el content pisa la
  status bar (arriba) y la navigation bar (abajo). En Android < 15 no ocurre.

- **Botón back:** Capacitor 8 no registra el evento por defecto → la app se cierra.
  `@capacitor/app` no está instalado aún.

### TECNOLOGÍAS:

- Vue.js 3 + Composition API
- Quasar Framework
- Capacitor 8 + `@capacitor/app` (a instalar en Fase 3)
- CSS `env(safe-area-inset-*)`

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: ÍCONOS DE LA APP 🎨 [✅ COMPLETADA]

### Objetivo

Generar los archivos PNG y `.ico` que `index.html` ya referencia pero no existen,
usando el ícono oficial `PrecioJusto-Icono.png` como fuente.

### Contexto

- `index.html` ya tiene los `<link>` correctos apuntando a:
  - `icons/favicon-128x128.png`
  - `icons/favicon-96x96.png`
  - `icons/favicon-32x32.png`
  - `icons/favicon-16x16.png`
  - `favicon.ico`
- El ícono fuente está en: `public/icons/PrecioJusto-Icono.png` (PNG original, alta res)
- Los íconos del Android nativo (mipmap-*) ya están correctos, no requieren cambios

### Herramienta

[x] Usar `@quasar/icongenie` (herramienta oficial de Quasar para generar íconos):
    `npx @quasar/icongenie generate -i public/icons/PrecioJusto-Icono.png -m spa`
    Genera automáticamente todos los tamaños necesarios en `public/icons/`

### Archivos generados

[x] `public/icons/favicon-128x128.png` (5.8KB)
[x] `public/icons/favicon-96x96.png` (4.1KB)
[x] `public/icons/favicon-32x32.png` (1.2KB)
[x] `public/icons/favicon-16x16.png` (600B)
[x] `public/favicon.ico` (116KB — reemplazó el genérico de Quasar)

### Nota sobre el PNG fuente

El archivo `public/icons/PrecioJusto-Icono.png` se mantiene como fuente/referencia original.

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: SAFE AREA (BORDES DEL SISTEMA) 📱 [ PENDIENTE ]

### Objetivo

Corregir la superposición de la barra de estado (arriba) y la barra de
navegación (abajo) con el contenido de la app en dispositivos Android 15+.

### Causa

Android 15 forzó el modo edge-to-edge en todas las apps. La app renderiza
debajo de las barras del sistema. En versiones anteriores, Android reservaba
espacio automáticamente (por eso el problema es inconsistente entre celulares).

### Solución: CSS env(safe-area-inset-*)

Sin dependencias adicionales. `viewport-fit=cover` ya está activo en builds
Capacitor (confirmado en `index.html`). Solo se necesitan las reglas CSS.
En Android < 15 y en web, las variables valen `0px` → no hay efecto secundario.

### Archivos a modificar

[ ] `src/css/Variables.css` — agregar variables CSS de safe area
[ ] `src/css/app.css` — regla global para el header de Quasar
[ ] `src/layouts/MainLayout.vue` — sin cambios en template, la regla CSS aplica sola
[ ] `src/components/Compartidos/BarraAccionesSeleccion.vue` — ajuste bottom fijo
[ ] `src/pages/MisProductosPage.vue` — ajuste del FAB
[ ] `src/pages/ComerciosPage.vue` — ajuste del FAB
[ ] `src/pages/DetalleProductoPage.vue` — verificar si tiene elementos fijos en el bottom
[ ] `src/pages/EditarComercioPage.vue` — verificar si tiene elementos fijos en el bottom

### Lógica de implementación

[ ] En `Variables.css`: definir variables centralizadas:
    `--safe-area-top: env(safe-area-inset-top, 0px)`
    `--safe-area-bottom: env(safe-area-inset-bottom, 0px)`

[ ] En `app.css`: regla para el header de Quasar:
    `.q-header { padding-top: var(--safe-area-top) }`
    Quasar detecta el cambio de altura via ResizeObserver y ajusta
    el `q-page-container` automáticamente.

[ ] FABs (q-fab / q-btn fixed): cambiar bottom de `16px` a:
    `bottom: calc(16px + var(--safe-area-bottom))`

[ ] `BarraAccionesSeleccion.vue` (fixed bottom): agregar:
    `padding-bottom: var(--safe-area-bottom)`

### ⚠️ Punto a verificar en testing

Si Quasar NO recalcula automáticamente el offset del `q-page-container` al
crecer el header por el padding CSS, el contenido quedará tapado por el header.
En ese caso, la alternativa es agregar un `<div>` espaciador explícito dentro
del `q-header`, antes del `q-toolbar`:

```html
<q-header elevated class="bg-white text-primary">
  <div :style="{ height: 'env(safe-area-inset-top, 0px)' }" />
  <q-toolbar>...</q-toolbar>
</q-header>
```

Esto garantiza que Quasar mida correctamente la altura total del header.

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: BOTÓN BACK NATIVO DE ANDROID 🔙 [ PENDIENTE ]

### Objetivo

Interceptar el botón físico de retroceso de Android para que la app
navegue correctamente en lugar de cerrarse abruptamente.

### Comportamiento esperado (lógica inteligente)

1. Si el drawer lateral está abierto → cerrar el drawer, detener
2. Si estamos en página de detalle (`/producto/:id`, `/comercios/:nombre`) → `router.back()`
3. Si estamos en página raíz (`/`, `/comercios`):
   - Primera presión → mostrar notify: "Presioná de nuevo para salir"
                       guardar timestamp del toque
   - Segunda presión dentro de 2000ms → `App.exitApp()`
   - Si pasan más de 2000ms → resetear contador (la siguiente presión vuelve a ser "primera vez")

### Dependencia a instalar

[ ] `npm install @capacitor/app`
[ ] `npx cap sync android`

### Archivos a crear/modificar

[ ] `src/composables/useBotonAtras.js` — nueva composable con toda la lógica
[ ] `src/layouts/MainLayout.vue` — integrar la composable

### useBotonAtras.js — estructura de la lógica

[ ] Parámetros recibidos: `{ drawerAbierto, router, route }`
    `drawerAbierto` es el `ref` del estado del drawer (pasado desde MainLayout)

[ ] Registrar listener en `onMounted` y limpiar en `onUnmounted`:
    `App.addListener('backButton', manejadorBack)`

[ ] Lógica del manejador:
    - `drawerAbierto.value === true` → `drawerAbierto.value = false`, return
    - `route.path !== '/' && route.path !== '/comercios'` → `router.back()`, return
    - Página raíz → lógica de doble toque para salir (descripción arriba)

[ ] Usar Quasar `useQuasar()` dentro del composable para el notify del doble toque

[ ] El listener de `@capacitor/app` solo aplica en entorno Capacitor.
    Detectar con: `Capacitor.isNativePlatform()` para no registrar en web dev.

### ⚠️ Puntos a verificar

- El router en modo hash reporta `route.path` sin el `#` (Vue Router lo normaliza).
  Verificar con `route.path === '/'` (no `window.location.hash`).
- El `drawerAbierto` debe pasarse como referencia reactiva desde `MainLayout.vue`,
  no como valor primitivo, para que el composable pueda modificarlo.

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: TESTING Y AJUSTES 🧪 [ PENDIENTE ]

### Testing Fase 1 (Íconos)

[ ] Favicon visible en pestaña del navegador con el ícono oficial de Precio Justo ✓
[ ] Sin el ícono genérico de Quasar (Q azul)
[ ] Todos los tamaños referenciados en `index.html` existen en `public/icons/` ✓
[ ] `quasar build` sin errores por archivos faltantes ✓

### Testing Fase 2 (Safe Area)

[ ] En celular con Android 15: header no se superpone con la barra de estado ✓
[ ] En celular con Android 15: FAB no queda tapado por la barra de navegación ✓
[ ] En celular con Android < 15: app se ve igual que antes (sin padding extra) ✓
[ ] `BarraAccionesSeleccion` completamente visible al activar modo selección ✓
[ ] Páginas de detalle (DetalleProducto, EditarComercio) sin solapamiento en el bottom ✓
[ ] El contenido de las páginas no queda tapado por el header (verificar q-page-container) ✓

### Testing Fase 3 (Botón Back)

[ ] Drawer abierto → back → drawer se cierra, no navega ✓
[ ] DetalleProducto → back → vuelve a MisProductos ✓
[ ] EditarComercio → back → vuelve a Comercios ✓
[ ] MisProductos → back → toast "Presioná de nuevo para salir" ✓
[ ] MisProductos → back dos veces en < 2s → app se cierra ✓
[ ] MisProductos → back, esperar > 2s, back de nuevo → toast nuevamente (no cierra) ✓
[ ] Comercios → mismo comportamiento que MisProductos ✓
[ ] En `quasar dev` (web): no hay errores por el listener de Capacitor ✓

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- Orden recomendado: Fase 1 → 2 → 3. Son independientes entre sí.
- La Fase 2 DEBE testearse en dispositivo físico con Android 15.
  En emulador o Android < 15 el problema no se reproduce.
- La Fase 3 DEBE testearse en dispositivo físico. El botón back nativo
  no existe en el emulador web de `quasar dev`.
- El Capacitor listener de `@capacitor/app` solo funciona en build nativo.
  Proteger con `Capacitor.isNativePlatform()` para evitar errores en web.
- Si `@quasar/icongenie` no está disponible, los PNGs se pueden generar
  manualmente con cualquier editor de imagen o herramienta online.

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 25% (1/4 fases completadas)

[x] Fase 1: Íconos de la app
[ ] Fase 2: Safe Area (bordes del sistema)
[ ] Fase 3: Botón back nativo de Android
[ ] Fase 4: Testing y ajustes

═══════════════════════════════════════════════════════════════

CREADO: 23 de Febrero 2026
ÚLTIMA ACTUALIZACIÓN: 23 de Febrero 2026 (Fase 1 completada)
ESTADO: 🔄 En progreso
