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
[ ] Agregar estado vacío (cuando se llega a la ruta con mesa vacía):
    - Mensaje: "No hay artículos en la Mesa de trabajo"
    - Botón primario: "Mis Productos" → `router.push('/')`
    - Botón secundario: "Comercios" → `router.push('/comercios')`

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
    `<IconBriefcase :size="24" />`  (sin prop `color`)
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

> Contenido a definir. Ver discusión en chat.

═══════════════════════════════════════════════════════════════

## 🧪 TESTING [PENDIENTE]

### T.A — Navegación y acceso

[ ] Abrir drawer con ítems en la mesa → ítem "Mesa de trabajo" visible con badge
[ ] Click en "Mesa de trabajo" → navega a `/mesa-trabajo` (no abre diálogo)
[ ] El ítem del drawer muestra el ícono `IconBriefcase` claramente
[ ] El ítem se marca como activo (estilo de ruta activa de Quasar) al estar en la página
[ ] Abrir drawer sin ítems → ítem "Mesa de trabajo" NO aparece
[ ] Navegar a `/mesa-trabajo` directamente (URL) sin ítems → aparece estado vacío
[ ] Botón "Mis Productos" en estado vacío → navega a `/`
[ ] Botón "Comercios" en estado vacío → navega a `/comercios`

### T.B — Vaciado de la mesa

[ ] Enviar todos los ítems desde la Mesa → auto-navega a Mis Productos
[ ] Limpiar todo desde la Mesa → auto-navega a Mis Productos
[ ] El watch no dispara navegación si los ítems se vacían desde otra página

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

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 0% (0/3 fases completadas)

⏳ Fase 1: Mesa de Trabajo como página
⏳ Fase 2: Mejoras en tarjetas — estado colapsado
⏳ Fase 3: Mejoras en tarjetas — estado expandido

═══════════════════════════════════════════════════════════════

**CREADO:** Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026
**ESTADO:** ⏳ EN PROGRESO
