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

## ⏳ FASE 3: REDISEÑO DEL ESCANEO RÁPIDO Y MESA DE TRABAJO [PENDIENTE]

### Resumen del rediseño

El flujo anterior pedía elegir el comercio antes de escanear y tenía un solo modo de escaneo.
El nuevo sistema tiene dos modos de escaneo y el comercio se asigna al final en la Mesa de trabajo.

**Nombres definidos:**

- `BandejaBorradores` → **Mesa de trabajo**
- Modo escaneo con tarjeta → **Escaneo rápido**
- Modo escaneo en ráfaga → **Ráfaga**

---

### FAB en MisProductosPage — 3 acciones

El FAB pasa de 2 a 3 opciones:

| Acción         | Icono                | Color      |
| -------------- | -------------------- | ---------- |
| Agregar manual | IconPlus             | primary    |
| Escaneo rápido | IconScan (tranquilo) | secondary  |
| Ráfaga         | IconBolt (rayo)      | otro color |

---

### Modo A — Escaneo rápido (con tarjeta)

**Flujo:**

1. FAB → "Escaneo rápido" → cámara abre de una (sin elegir comercio)
2. Escaneo detectado → cámara se pausa → aparece `TarjetaEscaneo`
3. En segundo plano: busca en BD local del usuario primero, luego en API
4. Toast de feedback con: nombre + código de barras + foto miniatura (si encontrado) o solo código (si no)
5. `TarjetaEscaneo` muestra: nombre, código, foto (si tiene), campo precio (abajo a la derecha con gradiente, estilo Mis Productos)
6. Precio obligatorio → botón "Siguiente" deshabilitado sin precio
7. Foto opcional (botón cámara en la tarjeta)
8. Edición inline disponible (lápiz)
9. "Siguiente" → ítem va a la Mesa de trabajo → cámara se reabre
10. Sin duplicados en la sesión: con la cámara activa aparece una tarjetita de aviso que indica
    que el producto ya fue escaneado en esta sesión. Muestra: nombre + foto + código (si se encontró
    en BD/API) o solo el código (si no se encontró)

**Si el producto no se encuentra:** tarjeta vacía con solo el código visible, campos editables activos

---

### Modo B — Ráfaga (solo códigos)

**Flujo:**

1. FAB → "Ráfaga" → cámara abre de una (sin elegir comercio)
2. Escaneo continuo sin pausas — la cámara nunca se detiene
3. Por cada código detectado:
   - Búsqueda en segundo plano (BD local → API)
   - Toast con: nombre + código + foto (o solo código si no encontrado)
4. Sin duplicados en la sesión: avisa sin interrumpir el escaneo
5. Botón "Ver Mesa de trabajo" (o similar) para terminar y revisar todo

---

### Mesa de trabajo (reemplaza BandejaBorradores)

**UI:**

- Ítems mostrados como tarjetas
- Indicador de progreso: `X / Y artículos listos para enviar`
- Tap en tarjeta → se expande para editar
- Long press → modo selección con checkboxes → asignar comercio en bloque a los seleccionados
- Persistente: sobrevive cierre de la app

**Ordenamiento:**

- Por defecto: los ítems con más datos faltantes arriba, los completos abajo
- El usuario puede cambiar el orden con un filtro:
  - De menos completo a más (default)
  - De más completo a menos
  - Por comercio
  - Sin comercio (solo los que no tienen comercio asignado)
  - Alfabético

**Campos obligatorios por ítem antes de poder enviar:**

- Nombre
- Precio
- Comercio

**Envío parcial:**

- El botón "Enviar" tiene dos estados:
  - En **color** → el ítem está completo y listo para enviar
  - En **gris** → al ítem le faltan datos obligatorios
- El usuario puede enviar solo los ítems completos sin esperar a completar el resto
- Confirmación: "¿Guardar X artículos?" → guarda → vuelve a MisProductosPage
- Los ítems incompletos permanecen en la Mesa de trabajo

---

### Arquitectura y reutilización

**Store — `sesionEscaneoStore.js`:**

- Reestructurar para que cada ítem tenga su propio `comercioId` (antes era uno por sesión)
- Ítems sin comercio asignado hasta que el usuario los asigne en la Mesa de trabajo
- Persistencia de la sesión (sobrevivir cierre de app)

**Componentes a crear:**

- `src/components/Scanner/TarjetaEscaneo.vue` — tarjeta post-escaneo del Modo A
- `src/components/Scanner/MesaTrabajo.vue` — reemplaza `BandejaBorradores.vue`
- `src/components/Scanner/TarjetaProductoBorrador.vue` — tarjeta expandible en la Mesa de trabajo

**Componentes a reutilizar (sin modificar o con cambios mínimos):**

- `EscaneadorCodigo.vue` — funciona en modo continuo para Ráfaga
- `useCamaraFoto.js` — para la foto opcional en TarjetaEscaneo
- `useSeleccionMultiple.js` — para la selección por long press en la Mesa de trabajo
- `BuscadorProductosService` — para la búsqueda en API

**Componentes a reemplazar:**

- `FormularioEscaneo.vue` → reemplazado por `TarjetaEscaneo.vue`
- `BandejaBorradores.vue` → reemplazado por `MesaTrabajo.vue`

### Archivos a modificar

- `src/almacenamiento/stores/sesionEscaneoStore.js`
- `src/pages/MisProductosPage.vue` (FAB con 3 acciones, nueva lógica de inicio)

═══════════════════════════════════════════════════════════════

## 🧪 TESTING [PENDIENTE]

### T.A — Escaneo unitario en el formulario

[x] Abrir "Agregar Producto" (FAB → "Agregar manual")
[x] Hacer click en el ícono de cámara dentro del campo "Código de barras"
[ ] El overlay del escáner se abre (nativo o input manual en web)
[ ] Escanear/ingresar un código de barras conocido
[ ] Verificar que el campo se llena automáticamente con el código
[ ] Verificar que la búsqueda en la API se dispara automáticamente (sin click extra)
[ ] Si el producto se encuentra: aparece el diálogo de resultados de búsqueda
[ ] Si no se encuentra: aparece el notify de "No se encontró el producto"
[ ] El formulario sigue abierto (no se cerró ni cambió de pantalla)

### T.B — FAB expandible en MisProductosPage

[ ] En MisProductosPage: click en el FAB (+)
[ ] Se expande mostrando 3 opciones con labels a la izquierda
[ ] Opción "Agregar manual" (IconPlus): abre el formulario DialogoAgregarProducto
[ ] Opción "Escaneo rápido" (IconScan): abre el modo A con tarjeta
[ ] Opción "Ráfaga" (IconBolt): abre el modo B de escaneo continuo
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

### T.E — Modo A: Escaneo rápido con tarjeta

[ ] FAB → "Escaneo rápido" → cámara abre sin pedir comercio
[ ] Escanear producto conocido → cámara se pausa → aparece TarjetaEscaneo con datos
[ ] Escanear producto desconocido → tarjeta vacía con solo el código, campos editables
[ ] Botón "Siguiente" deshabilitado si no hay precio
[ ] Ingresar precio → "Siguiente" → ítem va a la Mesa de trabajo → cámara se reabre
[ ] Escanear el mismo código dos veces → aparece aviso de duplicado con nombre/foto/código
[ ] El aviso de duplicado no detiene el escaneo
[ ] La foto del producto es opcional y se puede tomar desde la tarjeta

### T.E2 — Modo B: Ráfaga

[ ] FAB → "Ráfaga" → cámara abre sin pedir comercio
[ ] Escanear múltiples productos sin pausas
[ ] Toast de feedback por cada escaneo con nombre + código + foto (o solo código)
[ ] Escanear el mismo código dos veces → aviso sin interrumpir el escaneo
[ ] "Ver Mesa de trabajo" lleva a la Mesa con todos los ítems escaneados

### T.E3 — Mesa de trabajo

[ ] Los ítems incompletos aparecen arriba, los completos abajo (orden por defecto)
[ ] El filtro de ordenamiento funciona (las 5 opciones)
[ ] Tap en tarjeta → se expande para editar
[ ] Long press → modo selección con checkboxes
[ ] Seleccionar varios ítems → asignar comercio en bloque → todos los seleccionados lo reciben
[ ] Ítems completos: botón "Enviar" en color
[ ] Ítems incompletos: botón "Enviar" en gris (no se puede enviar)
[ ] Enviar solo los ítems completos → confirmación → se guardan → los incompletos permanecen
[ ] La Mesa de trabajo persiste si se cierra y se vuelve a abrir la app

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
