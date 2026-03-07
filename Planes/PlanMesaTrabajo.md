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

## 📋 FASE 1: MESA DE TRABAJO COMO PÁGINA 📄 [PENDIENTE]

### Objetivo

Convertir la Mesa de trabajo de un diálogo a una página propia de la app.

### 1.1 — Adaptar MesaTrabajoPage.vue

**Archivo:** Renombrar/mover `src/components/Scanner/MesaTrabajo.vue`
→ `src/pages/MesaTrabajoPage.vue`

[ ] Eliminar el wrapper `q-dialog` (y sus props/emits `modelValue`)
[ ] Reemplazar por `q-page`
[ ] El toolbar interno (título + botón X) → botón X cambia a `router.back()` o se elimina
[ ] Agregar `watch` en `sesionEscaneoStore.tieneItemsPendientes`:
si pasa a `false` mientras el usuario está en la página → `router.push('/')`
[ ] Agregar estado vacío (cuando se llega a la ruta con mesa vacía): - Mensaje: "No hay artículos en la Mesa de trabajo" - Botón primario: "Mis Productos" → `router.push('/')` - Botón secundario: "Comercios" → `router.push('/comercios')`

### 1.2 — Registrar la ruta

**Archivo:** `src/router/routes.js`

[ ] Agregar dentro del array `children`:
`{ path: 'mesa-trabajo', component: () => import('pages/MesaTrabajoPage.vue') }`

### 1.3 — Limpiar MainLayout.vue

**Archivo:** `src/layouts/MainLayout.vue`

[ ] Eliminar `<MesaTrabajo v-model="mesaTrabajoAbierta" />` del template
[ ] Eliminar `import MesaTrabajo from '../components/Scanner/MesaTrabajo.vue'`
[ ] Eliminar `const mesaTrabajoAbierta = ref(false)`
[ ] Eliminar función `abrirMesaTrabajo()`
[ ] Drawer item: cambiar `@click="abrirMesaTrabajo"` → `to="/mesa-trabajo"`
[ ] Ícono: reemplazar `<IconClipboardList :size="24" color="primary" />` →
`<IconBriefcase :size="24" />` (sin prop `color`)
[ ] Actualizar imports: quitar `IconClipboardList`, agregar `IconBriefcase`

### ⚠️ Puntos delicados

- El `watch` en `tieneItemsPendientes` solo debe disparar `router.push('/')` si la
  ruta actual ES `/mesa-trabajo` — verificar con `route.path` para evitar navegaciones
  fantasma desde otras páginas
- El estado vacío (mensaje + botones) aplica cuando `tieneItemsPendientes === false`
  al montar la página (`onMounted`) — diferente al `watch` que aplica durante la sesión

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: MEJORAS EN TARJETAS — ESTADO COLAPSADO 🃏 [PENDIENTE]

### Objetivo

Adaptar `TarjetaProductoBorrador` para que en estado colapsado:

- No muestre el botón "Agregar precio" (sin contexto en la mesa)
- Muestre 3 líneas informativas claras: chips, comercio y dirección
- El chevron no se solape con el contenido inferior

---

### 2.1 — Quitar botón "Agregar precio"

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[ ] Agregar prop `mostrarBotonAgregarPrecio: Boolean, default: true`
[ ] Cambiar condición del botón flotante:
`v-if="tipo === 'producto' && !modoSeleccion && mostrarBotonAgregarPrecio"`

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[ ] Pasar `:mostrar-boton-agregar-precio="false"` a `<TarjetaBase>`

---

### 2.2 — 3 líneas en la zona `#tipo`

El slot `#tipo` pasa de tener solo chips a tener 3 filas:

```
Fila 1: [chip Nombre] [chip Precio] [chip Comercio]
Fila 2: 🏪 Nombre del comercio          ← v-if="item.comercio"
Fila 3: 📍 Nombre de la dirección       ← v-if="item.comercio?.direccionNombre"
```

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[ ] Slot `#tipo`: agregar fila 2 con `IconBuildingStore` + `item.comercio.nombre`
[ ] Slot `#tipo`: agregar fila 3 con `IconMapPin` + `item.comercio.direccionNombre`
[ ] Ambas filas con `v-if` condicional (responsive: solo aparecen si hay dato)
[ ] Importar `IconBuildingStore` desde `@tabler/icons-vue`
[ ] Slot `#info-inferior`: eliminar la sección derecha con el nombre del comercio
(ya no es necesaria, la info se mueve a `#tipo`)
[ ] Agregar estilos para las nuevas filas en `<style scoped>`:
`.info-comercio` y `.info-direccion`: flex + gap + font-size + color

---

### 2.3 — Fix chevron solapado

El `tarjeta-yugioh__icono-expandir` es `position: absolute; bottom: 8px; right: 8px`
y se superpone al contenido del `info-inferior` cuando la tarjeta es angosta.

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[ ] Agregar clase modificadora al `q-card` cuando `permiteExpansion === true`:
`'tarjeta-yugioh--con-expansion': permiteExpansion`
[ ] Agregar CSS:
`.tarjeta-yugioh--con-expansion .tarjeta-yugioh__info-inferior { padding-right: 44px; }`
Esto reserva espacio para el chevron sin modificar otras instancias de TarjetaBase

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: MEJORAS EN TARJETAS — ESTADO EXPANDIDO 🃏 [PENDIENTE]

### Objetivo

Corregir el bug de cierre al tocar inputs, agregar copia de código de barras,
y asegurar que toda la tarjeta sea completamente responsive.

---

### 3.1 — Bug: tarjeta se cierra al tocar inputs/selects

El click en inputs y selects dentro del área expandida burbujea hasta `q-card`,
que tiene `@click="manejarClick"` y togglea la expansión.

**Archivo:** `src/components/Tarjetas/TarjetaBase.vue`

[ ] Agregar `@click.stop` al div `tarjeta-yugioh__expandido`:
`<div v-show="expandido && !modoSeleccion" class="tarjeta-yugioh__expandido" @click.stop>`
[ ] Verificar que el botón "Enviar" y "Eliminar" en `#acciones` también usan `.stop`
(ya los tienen en TarjetaProductoBorrador, pero confirmar que no se rompió nada)

---

### 3.2 — Copiar código de barras

**Archivo:** `src/components/Scanner/TarjetaProductoBorrador.vue`

[ ] En el slot `#info-inferior`, hacer el área del código de barras clickeable (`@click.stop`)
[ ] Al hacer click: copiar `item.codigoBarras` al portapapeles con `copyToClipboard` de Quasar
[ ] Feedback: `$q.notify` con mensaje "Código copiado" (notify toast, consistente con el resto)
[ ] Cursor: `cursor: pointer` al `.info-inferior-izq` cuando hay código de barras
[ ] Si no hay código (`item.codigoBarras` es null): el click no hace nada

---

### 3.3 — Responsividad general

Aplica a **todas las fases** de este plan. Todo debe funcionar correctamente en:

- Móvil angosto (360px) — contexto principal de uso
- Tablet (768px)
- Desktop (1024px+)

**Puntos críticos a verificar:**

[ ] Fase 1 — MesaTrabajoPage: el estado vacío (mensaje + botones) se ve bien en móvil
[ ] Fase 2 — Las 3 líneas del `#tipo` no se cortan ni desbordan en pantallas angostas
[ ] Fase 2 — Los chips de completitud hacen wrap correctamente si no entran en una fila
[ ] Fase 3 — El área expandida con los campos de edición no queda aplastada en móvil
[ ] Fase 3 — El q-select de comercios abre correctamente en móvil (no queda tapado)
[ ] El selector de ordenamiento de MesaTrabajoPage es usable en pantallas pequeñas

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: MEJORAS EN TARJETA DE ESCANEO (TarjetaEscaneo) 📷 [PENDIENTE]

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

### 4.1 — Fix desalineación precio + moneda

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] El row de precio y moneda debe usar `items-stretch` o `items-center` consistente
[ ] Verificar que ambos campos tengan el mismo `height` o `align-self: center`
[ ] Resultado: precio e input de moneda visualmente al mismo nivel

---

### 4.2 — Código de barras: ícono + copiar

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] Agregar `IconBarcode` al lado del número (igual que en TarjetaProductoBorrador)
[ ] Hacer el área del código clickeable (`@click.stop`)
[ ] Al hacer click: copiar con `copyToClipboard` de Quasar + notify "Código copiado"
[ ] `cursor: pointer` cuando hay código; sin efecto si no hay código

---

### 4.3 — Quitar "Fuente: Open Food Facts"

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] Eliminar la línea que muestra `item.fuenteDato` del template

---

### 4.4 — Guardar `datosOriginales` en el store

Para poder recuperar foto y datos, el ítem debe guardar el estado original
al momento de ser creado desde la API o la base de datos local.

**Archivo:** `src/almacenamiento/stores/sesionEscaneoStore.js`

[ ] Al crear un ítem desde API/BD: agregar campo `datosOriginales`:
`javascript
    datosOriginales: origenApi || productoExistenteId
      ? { nombre, marca, cantidad, unidad, imagen }
      : null
    `
[ ] Si el ítem es nuevo (sin origen): `datosOriginales = null`
[ ] `datosOriginales` es inmutable — nunca se modifica después de creado

---

### 4.5 — Botón cámara dentro de la foto + botón recuperar foto

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] Mover el botón de cámara (actual) al interior del div de la foto
[ ] Posición: overlay esquina inferior derecha (`position: absolute; bottom: 8px; right: 8px`)
[ ] Botón cámara: siempre visible (para agregar/cambiar foto)
[ ] Botón recuperar foto: al lado izquierdo del botón cámara
`v-if="datosForm.datosOriginales?.imagen"`
[ ] Click en recuperar foto: `datosForm.imagen = datosForm.datosOriginales.imagen`
[ ] Ícono sugerido para recuperar foto: `IconPhotoSearch` o `IconRefresh` (Tabler)
[ ] Ambos botones con fondo semitransparente para ser visibles sobre cualquier imagen
[ ] Quitar el botón de cámara de su ubicación actual (fuera del div de foto)

---

### 4.6 — Botón recuperar datos (en área de edición)

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] Agregar botón "Recuperar datos" dentro del área de edición expandida
`v-if="datosForm.datosOriginales"`
[ ] Click: restaura `nombre`, `marca`, `cantidad`, `unidad` desde `datosOriginales`
(NO modifica `precio`, `moneda`, `comercio`, ni `imagen`)
[ ] Ícono sugerido: `IconArrowBackUp` (Tabler) — flecha de deshacer
[ ] Posición: al final del área de edición, antes del separador con los botones principales

---

### 4.7 — Responsividad tablet

**Archivo:** `src/components/Scanner/TarjetaEscaneo.vue`

[ ] El `q-dialog` con `position="bottom"` en pantallas ≥ 768px: - Agregar `max-width: 480px` al contenido del dialog - Centrar horizontalmente (`margin: 0 auto`)
[ ] Esto evita que la tarjeta ocupe todo el ancho en tablet y la imagen quede cortada
[ ] Verificar que la imagen sea siempre visible (altura mínima del área de foto)
[ ] Confirmar que los botones Descartar / Ir a mesa / Siguiente no se cortan en móvil

═══════════════════════════════════════════════════════════════

## 🧪 TESTING [PENDIENTE]

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
[ ] Botón recuperar foto al lado del de cámara, solo cuando `datosOriginales.imagen` existe
[ ] Click recuperar foto → imagen vuelve a la original de la API/BD
[ ] Botón recuperar datos solo visible cuando `datosOriginales` existe
[ ] Click recuperar datos → nombre, marca, cantidad, unidad vuelven al original (precio/moneda/comercio no cambian)
[x] Tablet 768px: tarjeta centrada con max-width, imagen visible sin cortarse
[x] Móvil: sin regresiones en el comportamiento existente

### T.C — Funcionalidad preservada

[ ] Ordenamiento de ítems (5 opciones) funciona igual que antes
[ ] Selección múltiple con long-press funciona
[ ] Asignación de comercio en bloque funciona
[ ] Envío parcial (solo ítems completos) funciona
[ ] La persistencia de la sesión sigue funcionando tras cerrar y reabrir la app

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

## 📊 PROGRESO GENERAL: 100% (4/4 fases completadas)

✅ Fase 1: Mesa de Trabajo como página
✅ Fase 2: Mejoras en tarjetas — estado colapsado
✅ Fase 3: Mejoras en tarjetas — estado expandido
✅ Fase 4: Mejoras en TarjetaEscaneo (Modo A)

═══════════════════════════════════════════════════════════════

**CREADO:** Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026
**ESTADO:** 🧪 PENDIENTE DE TESTING
