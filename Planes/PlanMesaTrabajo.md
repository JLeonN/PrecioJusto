# PLAN DE TRABAJO - MESA DE TRABAJO: REFACTOR Y MEJORAS

Proyecto: Precio Justo
Fecha inicio: Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Actualmente la Mesa de trabajo es un `q-dialog` fullscreen montado globalmente en `MainLayout.vue`.
Este plan la convierte en una **página real** de la app (con su propia ruta), y agrega mejoras
visuales en las tarjetas de ítems.

### OBJETIVOS PRINCIPALES:

- Convertir `MesaTrabajo.vue` de q-dialog a página con ruta `/mesa-trabajo`
- Agregar ícono propio en el drawer (igual que Mis Productos y Comercios)
- Comportamiento cuando la mesa se vacía: auto-navegar a Mis Productos
- Acceso directo con mesa vacía: mensaje amigable + 2 botones de redirección
- (Fase 2) Mejoras visuales en las tarjetas `TarjetaProductoBorrador`

### ESTADO ACTUAL (pre-plan):

- `MesaTrabajo.vue` es un `q-dialog full-height full-width` en `MainLayout.vue`
- Se abre con `v-model="mesaTrabajoAbierta"` vía `abrirMesaTrabajo()` en el drawer
- El ítem del drawer usa `@click` (no `to=`), por lo que no tiene estilos de ruta activa
- El ícono del drawer tiene `color="primary"` que lo hace invisible sobre el fondo

### TECNOLOGÍAS:

- Vue.js 3 + Composition API
- Quasar Framework
- Pinia (sesionEscaneoStore)
- Vue Router
- Tabler Icons

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: MESA DE TRABAJO COMO PÁGINA 📄 [COMPLETADO]

### Objetivo

Convertir la Mesa de trabajo de un diálogo a una página propia de la app.

### 1.1 — Adaptar MesaTrabajoPage.vue

**Archivo:** Renombrar/mover `src/components/Scanner/MesaTrabajo.vue`
→ `src/pages/MesaTrabajoPage.vue`

[x] Eliminar el wrapper `q-dialog` (y sus props/emits `modelValue`)
[x] Reemplazar por `q-page`
[x] El toolbar interno (título + botón X) → botón X cambia a `router.back()` o se elimina
[x] Agregar `watch` en `sesionEscaneoStore.tieneItemsPendientes`:
si pasa a `false` mientras el usuario está en la página → `router.push('/')`
[x] Agregar estado vacío (cuando se llega a la ruta con mesa vacía): - Mensaje: "No hay artículos en la Mesa de trabajo" - Botón primario: "Mis Productos" → `router.push('/')` - Botón secundario: "Comercios" → `router.push('/comercios')`

### 1.2 — Registrar la ruta

**Archivo:** `src/router/routes.js`

[x] Agregar dentro del array `children`:
`{ path: 'mesa-trabajo', component: () => import('pages/MesaTrabajoPage.vue') }`

### 1.3 — Limpiar MainLayout.vue

**Archivo:** `src/layouts/MainLayout.vue`

[x] Eliminar `<MesaTrabajo v-model="mesaTrabajoAbierta" />` del template
[x] Eliminar `import MesaTrabajo from '../components/Scanner/MesaTrabajo.vue'`
[x] Eliminar `const mesaTrabajoAbierta = ref(false)`
[x] Eliminar función `abrirMesaTrabajo()`
[x] Drawer item: cambiar `@click="abrirMesaTrabajo"` → `to="/mesa-trabajo"`
[x] Ícono: reemplazar `<IconClipboardList :size="24" color="primary" />` →
`<IconBriefcase :size="24" />` (sin prop `color`)
[x] Actualizar imports: quitar `IconClipboardList`, agregar `IconBriefcase`

### ⚠️ Puntos delicados

- El `watch` en `tieneItemsPendientes` solo debe disparar `router.push('/')` si la
  ruta actual ES `/mesa-trabajo` — verificar con `route.path` para evitar navegaciones
  fantasma desde otras páginas
- El estado vacío (mensaje + botones) aplica cuando `tieneItemsPendientes === false`
  al montar la página (`onMounted`) — diferente al `watch` que aplica durante la sesión

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: MEJORAS EN TARJETAS — ESTADO COLAPSADO 🃏 [COMPLETADO]

### Objetivo

Adaptar `TarjetaProductoBorrador` para que en estado colapsado:

- No muestre el botón "Agregar precio" (sin contexto en la mesa)
- Muestre 3 líneas informativas claras: chips, comercio y dirección
- El chevron no se solape con el contenido inferior

---

### 2.1 — Quitar botón "Agregar precio"

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[x] Agregar prop `mostrarBotonAgregarPrecio: Boolean, default: true`
[x] Cambiar condición del botón flotante:
`v-if="tipo === 'producto' && !modoSeleccion && mostrarBotonAgregarPrecio"`

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[x] Pasar `:mostrar-boton-agregar-precio="false"` a `<TarjetaBase>`

---

### 2.2 — 3 líneas en la zona `#tipo`

El slot `#tipo` pasa de tener solo chips a tener 3 filas:

```
Fila 1: [chip Nombre] [chip Precio] [chip Comercio]
Fila 2: 🏪 Nombre del comercio          ← v-if="item.comercio"
Fila 3: 📍 Nombre de la dirección       ← v-if="item.comercio?.direccionNombre"
```

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[x] Slot `#tipo`: agregar fila 2 con `IconBuildingStore` + `item.comercio.nombre`
[x] Slot `#tipo`: agregar fila 3 con `IconMapPin` + `item.comercio.direccionNombre`
[x] Ambas filas con `v-if` condicional (responsive: solo aparecen si hay dato)
[x] Importar `IconBuildingStore` desde `@tabler/icons-vue`
[x] Slot `#info-inferior`: eliminar la sección derecha con el nombre del comercio
(ya no es necesaria, la info se mueve a `#tipo`)
[x] Agregar estilos para las nuevas filas en `<style scoped>`:
`.info-comercio` y `.info-direccion`: flex + gap + font-size + color

---

### 2.3 — Fix chevron solapado

El `tarjeta-yugioh__icono-expandir` es `position: absolute; bottom: 8px; right: 8px`
y se superpone al contenido del `info-inferior` cuando la tarjeta es angosta.

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[x] Agregar clase modificadora al `q-card` cuando `permiteExpansion === true`:
`'tarjeta-yugioh--con-expansion': permiteExpansion`
[x] Agregar CSS:
`.tarjeta-yugioh--con-expansion .tarjeta-yugioh__info-inferior { padding-right: 44px; }`
Esto reserva espacio para el chevron sin modificar otras instancias de TarjetaBase

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: MEJORAS EN TARJETAS — ESTADO EXPANDIDO 🃏 [COMPLETADO]

### Objetivo

Corregir el bug de cierre al tocar inputs, agregar copia de código de barras,
y asegurar que toda la tarjeta sea completamente responsive.

---

### 3.1 — Bug: tarjeta se cierra al tocar inputs/selects

El click en inputs y selects dentro del área expandida burbujea hasta `q-card`,
que tiene `@click="manejarClick"` y togglea la expansión.

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[x] Agregar `@click.stop` al div `tarjeta-yugioh__expandido`:
`<div v-show="expandido && !modoSeleccion" class="tarjeta-yugioh__expandido" @click.stop>`
[x] Verificar que el botón "Enviar" y "Eliminar" en `#acciones` también usan `.stop`
(ya los tienen en TarjetaProductoBorrador, pero confirmar que no se rompió nada)

---

### 3.2 — Copiar código de barras

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[x] En el slot `#info-inferior`, hacer el área del código de barras clickeable (`@click.stop`)
[x] Al hacer click: copiar `item.codigoBarras` al portapapeles con `copyToClipboard` de Quasar
[x] Feedback: `$q.notify` con mensaje "Código copiado" (notify toast, consistente con el resto)
[x] Cursor: `cursor: pointer` al `.info-inferior-izq` cuando hay código de barras
[x] Si no hay código (`item.codigoBarras` es null): el click no hace nada

---

### 3.3 — Responsividad general

Aplica a **todas las fases** de este plan. Todo debe funcionar correctamente en:

- Móvil angosto (360px) — contexto principal de uso
- Tablet (768px)
- Desktop (1024px+)

**Puntos críticos a verificar:**

[x] Fase 1 — MesaTrabajoPage: el estado vacío (mensaje + botones) se ve bien en móvil
[x] Fase 2 — Las 3 líneas del `#tipo` no se cortan ni desbordan en pantallas angostas
[x] Fase 2 — Los chips de completitud hacen wrap correctamente si no entran en una fila
[x] Fase 3 — El área expandida con los campos de edición no queda aplastada en móvil
[x] Fase 3 — El q-select de comercios abre correctamente en móvil (no queda tapado)
[x] El selector de ordenamiento de MesaTrabajoPage es usable en pantallas pequeñas

---

### 3.4 — Botones recuperar foto y recuperar datos en TarjetaProductoBorrador ✅

**Contexto:** Equivalente a la Fase 4.5 y 4.6 pero para la Mesa de Trabajo.
Solo aparecen cuando el item vino de una API o BD (`datosOriginales !== null`)
y el usuario modificó algo respecto al original.

**Archivos:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[x] `datosOriginales` se lee de `props.item.datosOriginales` (snapshot guardado por el store en `agregarItem()`)
[x] `fotoModificada` computed: `datosOriginales && datosEditando.imagen !== datosOriginales.imagen`
[x] `datosModificados` computed: compara nombre, marca, cantidad, unidad vs `datosOriginales`
[x] Botón **recuperar foto** (`IconRefresh :size="22"`): al lado de la cámara, `v-if="fotoModificada"`
[x] Botón **recuperar datos** (`IconArrowBackUp`): extremo derecho de la fila de foto, `v-if="datosModificados"`
[x] `recuperarDatos()`: restaura nombre, marca, cantidad y unidad (no toca imagen ni precio)
[x] Íconos de cámara aumentados a `size="md"` + `:size="22"` para mejor usabilidad
[x] `IconRefresh` e `IconArrowBackUp` agregados a los imports

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: MEJORAS EN TARJETA DE ESCANEO (TarjetaEscaneo) 📷 [PARCIAL]

### Objetivo

Mejorar la `TarjetaEscaneo.vue` (bottom sheet del Modo A — Escaneo rápido):

- Corregir desalineación del campo precio y selector de moneda
- Agregar ícono y función de copiar en el código de barras
- Quitar "Fuente: Open Food Facts" del área de info
- Mover el botón de cámara dentro del div de la foto (overlay)
- Agregar botón "recuperar foto" al lado de la cámara
- Agregar botón "recuperar datos" dentro del área de edición
- Responsividad en tablet: max-width + imagen visible

---

### 4.1 — Fix desalineación precio + moneda ✅

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] Agregado `hide-bottom-space` al q-select de moneda (eliminaba ~20px reservado para hint/error)
[x] Error "Obligatorio" movido al interior del input precio (slot `#append`) con `no-error-icon` + `hide-bottom-space`
[x] Resultado: precio y moneda visualmente al mismo nivel

---

### 4.2 — Código de barras: ícono + copiar

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] Agregar `IconBarcode` al lado del número (igual que en TarjetaProductoBorrador)
[x] Hacer el área del código clickeable (`@click.stop`)
[x] Al hacer click: copiar con `copyToClipboard` de Quasar + notify "Código copiado"
[x] `cursor: pointer` cuando hay código; sin efecto si no hay código

---

### 4.3 — Quitar "Fuente: Open Food Facts"

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] Eliminar la línea que muestra `item.fuenteDato` del template

---

### 4.4 — Guardar `datosOriginales` en el store

Para poder recuperar foto y datos, el ítem debe guardar el estado original
al momento de ser creado desde la API o la base de datos local.

**Archivo:** `src/almacenamiento/stores/sesionEscaneoStore.js`

[x] Al crear un ítem desde API/BD: agrega campo `datosOriginales`:
`javascript
    datosOriginales: origenApi || productoExistenteId
      ? { nombre, marca, cantidad, unidad, imagen }
      : null
    `
[x] Si el ítem es nuevo (sin origen): `datosOriginales = null`
[x] `datosOriginales` es inmutable — nunca se modifica después de creado
[x] `actualizarItem()` preserva `datosOriginales` via spread (`{ ...items.value[indice], ...cambios }`)

---

### 4.5 — Botón cámara dentro de la foto + botón recuperar foto ✅

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] Botón cámara movido al overlay de la foto (esquina inferior derecha)
[x] Botón recuperar foto (`IconRefresh :size="35"`) al lado izquierdo del de cámara
[x] `v-if="fotoModificada"` — solo aparece cuando la imagen difiere de la original
[x] Click en recuperar foto: `datosForm.imagen = datosOriginales.imagen`
[x] Ambos botones con `background: rgba(0,0,0,0.45)` para ser visibles sobre cualquier imagen
[x] `datosOriginales` es un computed derivado de `props.item.origenApi / productoExistenteId`

---

### 4.6 — Botón recuperar datos (en área de edición) ✅

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] Botón "Recuperar datos" (`IconArrowBackUp`) al final del área de edición expandida
[x] `v-if="datosModificados"` — solo aparece cuando nombre/marca/cantidad/unidad difieren del original
[x] Click: restaura `nombre`, `marca`, `cantidad`, `unidad` (NO toca `precio`, `moneda`, `imagen`)
[x] Posición: fila derecha junto al botón "Listo"

---

### 4.7 — Responsividad tablet

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[x] El `q-dialog` con `position="bottom"` en pantallas ≥ 768px: - Agregar `max-width: 480px` al contenido del dialog - Centrar horizontalmente (`margin: 0 auto`)
[x] Esto evita que la tarjeta ocupe todo el ancho en tablet y la imagen quede cortada
[x] Verificar que la imagen sea siempre visible (altura mínima del área de foto)
[x] Confirmar que los botones Descartar / Ir a mesa / Siguiente no se cortan en móvil

═══════════════════════════════════════════════════════════════

## 🧪 TESTING [COMPLETADO]

### T.A — Navegación y acceso

[x] Abrir drawer con ítems en la mesa → ítem "Mesa de trabajo" visible con badge
[x] Click en "Mesa de trabajo" → navega a `/mesa-trabajo` (no abre diálogo)
[x] El ítem del drawer muestra el ícono `IconBriefcase` claramente
[x] El ítem se marca como activo (estilo de ruta activa de Quasar) al estar en la página
[x] Abrir drawer sin ítems → ítem "Mesa de trabajo" NO aparece
[x] Navegar a `/mesa-trabajo` directamente (URL) sin ítems → aparece estado vacío
[x] Botón "Mis Productos" en estado vacío → navega a `/`
[x] Botón "Comercios" en estado vacío → navega a `/comercios`

### T.B — Vaciado de la mesa

[x] Enviar todos los ítems desde la Mesa → auto-navega a Mis Productos
[x] Limpiar todo desde la Mesa → auto-navega a Mis Productos
[x] El watch no dispara navegación si los ítems se vacían desde otra página

### T.B2 — Tarjeta expandida (bugs y nuevas funciones)

[x] Expandir tarjeta → tocar input de Nombre → se puede escribir sin que se cierre la tarjeta
[x] Expandir tarjeta → tocar q-select de Comercio → se abre sin cerrar la tarjeta
[x] Tocar código de barras (con código) → notify "Código copiado" + portapapeles contiene el código
[x] Tocar "Sin código" → no hace nada (sin crash)
[x] Botón Enviar y Eliminar siguen funcionando con `.stop`

### T.B3 — Responsividad

[x] Móvil 360px: tarjeta colapsada se ve completa, chips hacen wrap si es necesario
[x] Móvil 360px: tarjeta expandida, todos los inputs son accesibles y usables
[x] Móvil 360px: estado vacío de la mesa se ve correctamente (mensaje + 2 botones)
[x] Las 3 líneas de info (chips, comercio, dirección) no desbordan en pantalla angosta
[x] Tablet y desktop: sin regresiones visuales

### T.D — TarjetaEscaneo (Fase 4)

[x] Precio y moneda visualmente alineados al mismo nivel
[x] Código de barras muestra ícono + es clickeable → notify "Código copiado"
[x] "Fuente: Open Food Facts" ya no aparece
[x] Botón cámara dentro del div de foto, esquina inferior derecha
[x] Botón recuperar foto al lado del de cámara, solo cuando `datosOriginales.imagen` existe
[x] Click recuperar foto → imagen vuelve a la original de la API/BD
[x] Botón recuperar datos solo visible cuando `datosOriginales` existe
[x] Click recuperar datos → nombre, marca, cantidad, unidad vuelven al original (precio/moneda/comercio no cambian)
[x] Tablet 768px: tarjeta centrada con max-width, imagen visible sin cortarse
[x] Móvil: sin regresiones en el comportamiento existente

### T.C — Funcionalidad preservada

[x] Ordenamiento de ítems (5 opciones) funciona igual que antes
[x] Selección múltiple con long-press funciona
[x] Asignación de comercio en bloque funciona
[x] Envío parcial (solo ítems completos) funciona
[x] La persistencia de la sesión sigue funcionando tras cerrar y reabrir la app

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: MEJORAS EN SELECCIÓN MÚLTIPLE 🃏 [PENDIENTE]

### Objetivo

Mejorar la UX del modo selección múltiple en la Mesa de Trabajo.
El cambio principal es convertir la barra de selección de un elemento sticky
en el flujo del documento a una **barra flotante fixed** posicionada sobre
el footer, siempre visible durante el scroll.

### Mejoras incluidas:

- Barra de selección flotante (fixed, encima del footer)
- Botón "Cancelar" más grande y visible
- Texto informativo para que el usuario sepa para qué sirve la selección
- Auto-cancelar el modo selección cuando quedan 0 ítems seleccionados
- Bottom sheet de asignar comercio más compacto

---

### 5.1 — Barra de selección flotante

**Archivo:** `src/pages/MesaTrabajoPage.vue`

[x] Quitar el bloque `<div v-if="seleccion.modoSeleccion.value" class="seleccion-barra">` del flujo actual
[x] Agregar un nuevo div `position: fixed` con clase `seleccion-barra-flotante`:
    - `bottom: calc(var(--footer-altura, 56px) + var(--safe-area-bottom, 0px))`
    - `left: 0`, `right: 0`
    - `z-index: 100`
    - Fondo blanco con `box-shadow: 0 -2px 8px rgba(0,0,0,0.12)`
[x] Contenido de la barra flotante (de izquierda a derecha):
    - Botón "Cancelar" (ver 5.2)
    - Texto contador + texto informativo (ver 5.3)
    - `<q-space />`
    - Botón "Asignar comercio"
[x] Cuando `seleccion.modoSeleccion.value` es `true`, agregar padding-bottom
    a `.mesa-lista-scroll` para que el último ítem no quede tapado por la barra

### ⚠️ Puntos delicados

- La barra flotante se superpone al footer sticky — definir bien el `bottom`
  para que quede justo encima sin solaparse
- El `z-index` debe ser mayor que el de las tarjetas pero menor que los q-dialog
- El padding-bottom extra en la lista debe aplicarse solo cuando `modoSeleccion === true`
  para no alterar el scroll normal

---

### 5.2 — Botón "Cancelar" más visible

**Archivo:** `src/pages/MesaTrabajoPage.vue`

[ ] Cambiar el botón Cancelar de `flat dense no-caps size="sm" color="grey-8"`
    a `outline no-caps color="grey-8"` (con borde, más legible)
[ ] Quitar `dense` para que tenga más área de toque

---

### 5.3 — Texto informativo en la barra

**Archivo:** `src/pages/MesaTrabajoPage.vue`

[ ] Mostrar el contador y debajo una línea `text-caption text-grey-6`:
    "Seleccioná artículos para asignarles el mismo comercio"
[ ] Visible siempre que el modo selección esté activo

---

### 5.4 — Auto-cancelar cuando quedan 0 ítems seleccionados

**Archivo:** `src/pages/MesaTrabajoPage.vue`

[ ] Agregar `watch` sobre `seleccion.cantidadSeleccionados`:
    si llega a `0` y `modoSeleccion` está activo → `desactivarModoSeleccion()`

### ⚠️ Puntos delicados

- Al activar el modo, `cantidadSeleccionados` pasa de 0 a 1 porque
  `activarModoSeleccion(itemId)` siempre recibe el ítem inicial del long-press.
  No hay riesgo de falso positivo al activar.

---

### 5.5 — Bottom sheet de asignar comercio más compacto

**Archivo:** `src/pages/MesaTrabajoPage.vue`

[ ] Reducir padding del `q-card-section` del título: `class="q-py-sm"`
[ ] Reducir padding del `q-card-section` del selector: `class="q-pt-none q-pb-xs"`
[ ] Reducir padding del `q-card-section` de los botones: `class="q-pt-xs q-pb-sm"`

**Archivo:** `src/components/Compartidos/SelectorComercioDireccion.vue`

[ ] Cambiar `gap: 12px` → `gap: 8px` en `.selector-comercio-direccion`

═══════════════════════════════════════════════════════════════

## 🧪 TESTING FASE 5 [PENDIENTE]

### T.E — Barra flotante

[ ] Barra NO visible en modo normal
[ ] Long-press en ítem → barra aparece flotando sobre el footer
[ ] Barra siempre visible al hacer scroll hacia abajo
[ ] Barra siempre visible al hacer scroll hacia arriba
[ ] El último ítem de la lista no queda tapado por la barra
[ ] La barra no se solapa con el footer

### T.F — Comportamientos de selección

[ ] Deseleccionar el único ítem seleccionado → modo selección se cancela automáticamente
[ ] Deseleccionar varios hasta llegar a 0 → modo selección se cancela automáticamente
[ ] Seleccionar 3 ítems → deseleccionar 2 → el modo selección sigue activo con 1
[ ] Botón "Cancelar" visible y fácil de tocar en móvil 360px
[ ] Texto informativo visible en la barra flotante

### T.G — Asignar comercio

[ ] Bottom sheet más compacto: ocupa menos espacio vertical
[ ] Funcionalidad de asignar comercio no se rompe

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- El componente `MesaTrabajo.vue` en `components/Scanner/` queda obsoleto — eliminar
- La lógica interna del componente no cambia, solo el wrapper (dialog → page)
- El `v-if="sesionEscaneoStore.tieneItemsPendientes"` en el drawer se mantiene igual
- El badge rojo en el ícono hamburger del header también se mantiene sin cambios
- Ícono elegido: `IconBriefcase` (@tabler/icons-vue) — semántico para "trabajo"
- Se creó `src/components/Compartidos/SelectorComercioDireccion.vue` — componente
  reutilizable para seleccionar comercio + dirección (top 3 recientes + búsqueda).
  Usado en `TarjetaProductoBorrador` y en el bottom sheet de `MesaTrabajoPage`.
  Motor idéntico al de `FormularioPrecio` pero sin precio/moneda.
  Emite `{ id, nombre, direccionId, direccionNombre } | null`.

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: ~80%

✅ Fase 1: Mesa de Trabajo como página
✅ Fase 2: Mejoras en tarjetas — estado colapsado
✅ Fase 3: Mejoras en tarjetas — estado expandido (incl. 3.4 recuperar foto/datos en Borrador)
✅ Fase 4: TarjetaEscaneo — todas las subfases completadas
🔲 Fase 5: Mejoras en selección múltiple

═══════════════════════════════════════════════════════════════

**CREADO:** Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026
**ESTADO:** 🔄 EN PROGRESO (Fase 5 pendiente)
