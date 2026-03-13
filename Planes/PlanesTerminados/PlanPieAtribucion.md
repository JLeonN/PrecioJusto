# PLAN DE TRABAJO - PIE DE ATRIBUCIÓN

Proyecto: Precio Justo
Fecha inicio: 9 de Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla la creación de un componente `PieAtribucion.vue` reutilizable
que se muestra al final del scroll de ciertas páginas. Su función es indicar de
dónde proviene la información que el usuario está viendo: qué vino de una API
externa y qué aportó el usuario (precios, fotos, datos manuales).

El componente se integra por primera vez en `DetalleProductoPage` y tiene un
placeholder para su uso futuro en `EditarComercioPage`.

### OBJETIVOS PRINCIPALES:

- Crear un componente de pie discreto, flexible y reutilizable
- Separar visualmente la información según su fuente (API vs. usuario)
- Rastrear correctamente el origen de la foto del producto
- Dejar la base lista para cuando haya usuarios y APIs de geolocalización

### ESTADO ACTUAL (pre-plan):

- `producto.fuenteDato`: ya existe, indica qué API aportó los datos del producto
- `producto.imagen`: ya existe, pero NO hay campo que indique si la puso el usuario o la API
- No existe ningún componente de pie de página en la app
- Las fuentes de datos no se muestran al usuario en ningún lugar

### TECNOLOGÍAS:

- Vue.js 3 + Composition API
- Quasar Framework
- Pinia (productosStore)
- Tabler Icons

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: COMPONENTE BASE `PieAtribucion.vue` 🧩

### Objetivo

Crear el componente en `src/components/Compartidos/PieAtribucion.vue`.
Recibe dos props y renderiza dos secciones independientes.
Si ambas están vacías, muestra un mensaje neutral.

### Archivo a crear

[x] src/components/Compartidos/PieAtribucion.vue

### Props

[x] `fuentesApi: Array` — lista de objetos `{ api: String, campos: Array<String> }`
Ejemplo: `[{ api: 'Open Food Facts', campos: ['nombre', 'marca', 'categoría'] }]`
[x] `fuentesUsuario: Array` — lista de objetos `{ campos: Array<String> }`
Ejemplo: `[{ campos: ['precios', 'foto'] }]`
[x] Ambas props con `default: () => []`

### Template

[x] Contenedor `<section class="pie-atribucion">` al final del slot de la página
[x] Separador visual fino (`border-top: 1px solid #e0e0e0`) antes del contenido
[x] Sección 📡 **Fuentes de API** — visible solo si `fuentesApi.length > 0` - Por cada ítem: `• NombreAPI → campo1, campo2, campo3`
[x] Sección 👤 **Aportado por vos** — visible solo si `fuentesUsuario.length > 0` - Por cada ítem: `• Tus registros → campo1, campo2`
[x] Estado vacío: si ambas arrays están vacías →
`<p class="pie-sin-info">Sin información de fuentes disponible</p>`

### Diseño visual

[x] `font-size: 11px`
[x] Color texto: `#9e9e9e` (gris tenue, mismo que `fuenteDato` en InfoProducto)
[x] Padding: `12px 16px`
[x] Sin protagonismo — no compite con el contenido principal
[x] Títulos de sección en `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`
[x] `letter-spacing: 0.5px` en los títulos para darle aire

### ⚠️ Punto delicado

Los campos son strings en español legibles para el usuario:
`'nombre'`, `'marca'`, `'categoría'`, `'foto'`, `'precios'`.
No usar claves internas del objeto producto (`codigoBarras`, `fuenteDato`, etc.).

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: RASTREAR FUENTE DE LA FOTO 📸

### Objetivo

Agregar el campo `fotoFuente` al producto para saber si la foto fue aportada
por una API o subida manualmente por el usuario.

### Valores posibles

```
'api'     → la foto vino de una API externa (Open Food Facts, etc.)
'usuario' → el usuario tomó o eligió la foto desde su dispositivo
null      → el producto no tiene foto
```

### Archivos a modificar

[x] src/components/Formularios/Dialogos/DialogoAgregarProducto.vue
[x] src/components/DetalleProducto/InfoProducto.vue

### 2.1 — Al crear el producto desde la API

[x] `DialogoAgregarProducto.vue`: ref `fotoFuenteActual` junto a `fuenteDatoActual`
[x] `autoCompletarFormulario()`: asigna `fotoFuenteActual = producto.imagen ? 'api' : null`
[x] `guardarProducto()`: incluye `fotoFuente: fotoFuenteActual.value || null` en `nuevoProducto`
[x] `limpiarFormulario()`: resetea `fotoFuenteActual = null`

### 2.2 — Al cambiar la foto desde `InfoProducto.vue`

`InfoProducto.vue` maneja los 4 casos con `useCamaraFoto`. Actualizar en cada uno:

[x] **Tomar foto** (cámara) → al guardar: `actualizarProducto(id, { imagen, fotoFuente: 'usuario' })`
[x] **Desde galería** → al guardar: `actualizarProducto(id, { imagen, fotoFuente: 'usuario' })`
[x] **Restaurar desde API** → si la API devuelve imagen: `fotoFuente: 'api'`; si no: conservar fuente existente
[x] **Quitar foto** → `actualizarProducto(id, { imagen: null, fotoFuente: null })`

### ⚠️ Punto delicado

Productos existentes antes de este plan no tendrán `fotoFuente`.
Si `fotoFuente` es `undefined`: tratar igual que `null` (sin foto o desconocido).
No romper la lógica con un fallback: `fotoFuente ?? null`.

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: INTEGRAR EN `DetalleProductoPage` 📄

### Objetivo

Mostrar `PieAtribucion` al final del scroll de la página de detalle del producto,
con los datos del producto actual ya procesados.

### Archivo a modificar

[x] src/pages/DetalleProductoPage.vue

### 3.1 — Computed `fuentesApiProducto`

[x] Si `producto.fuenteDato` tiene valor: - Campos base: `['nombre', 'marca', 'categoría']` - Si `producto.fotoFuente === 'api'`: agregar `'foto'` a los campos - Construir: `[{ api: producto.fuenteDato, campos }]`
[x] Si `producto.fuenteDato` está vacío o null → devolver `[]`

### 3.2 — Computed `fuentesUsuarioProducto`

[x] Campos base siempre presentes: `['precios']`
[x] Si `producto.fotoFuente === 'usuario'`: agregar `'foto'` a los campos
[x] Construir: `[{ campos }]`
[x] Si `producto.precios` está vacío Y no hay foto de usuario → devolver `[]`

### 3.3 — Agregar en el template

[x] Importar y registrar `PieAtribucion`
[x] Colocar `<PieAtribucion>` al final del template, después de `HistorialPrecios`
y del FAB, para que quede al final del scroll completo
[x] Pasar props: `:fuentes-api="fuentesApiProducto"` y `:fuentes-usuario="fuentesUsuarioProducto"`

### Ejemplo visual esperado (producto con datos de API + precios del usuario)

```
──────────────────────────────────────
FUENTES DE API
• Open Food Facts → nombre, marca, categoría, foto

APORTADO POR VOS
• Tus registros → precios
──────────────────────────────────────
```

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: INTEGRAR EN `EditarComercioPage` 🏪 [✅ COMPLETADA]

### Objetivo

Mostrar `PieAtribucion` debajo de las estadísticas del comercio.

### Archivo a modificar

[x] src/pages/EditarComercioPage.vue

### Implementación

[x] Importar `PieAtribucion` en EditarComercioPage
[x] `fuentesApiComercio`: computed que retorna `[]` (sin API de geolocalización todavía)
[x] `fuentesUsuarioComercio`: computed con campos `['nombre', 'dirección', 'tipo']` + `'foto'` si la sucursal seleccionada tiene foto
[x] `<PieAtribucion>` colocado después de la sección Estadísticas, al final del contenido

### ⚠️ Nota

La foto de una sucursal siempre viene del usuario (cámara o galería) — no hay API de fotos
para comercios. Por eso no se necesita un campo `fotoFuente` en la dirección: si tiene foto,
siempre es del usuario. `fuentesApi` quedó vacío como placeholder para la futura API de GPS.

═══════════════════════════════════════════════════════════════

## 📋 FASE TESTING: TESTING Y AJUSTES 🧪

### Testing del componente base (Fase 1)

[x] Props vacías → mensaje "Sin información de fuentes disponible" visible ✓
[x] Solo `fuentesApi` con datos → sección API visible, sección usuario oculta ✓
[X] Solo `fuentesUsuario` con datos → sección usuario visible, sección API oculta ✓
[X] Ambas con datos → ambas secciones visibles ✓
[x] Diseño discreto: no compite visualmente con el historial de precios ✓

### Testing del rastreo de foto (Fase 2)

[x] Crear producto por código de barras con foto de API → `fotoFuente === 'api'` ✓
[x] Crear producto por código de barras sin foto → `fotoFuente === null` ✓
[x] Tomar foto con cámara → `fotoFuente === 'usuario'` ✓
[x] Elegir desde galería → `fotoFuente === 'usuario'` ✓
[x] Restaurar desde API (con foto) → `fotoFuente === 'api'` ✓
[x] Restaurar desde API (sin foto) → `fotoFuente === null` ✓
[x] Quitar foto → `fotoFuente === null` ✓
[x] Producto legacy sin `fotoFuente` → no rompe nada ✓

### Testing de integración en DetalleProductoPage (Fase 3)

[x] Producto de API con foto de API → pie muestra API con 'foto' en los campos ✓
[x] Producto de API + usuario reemplazó foto → API sin 'foto', usuario con 'foto' ✓
[X] Producto manual (sin API) con precios → solo sección usuario visible ✓
[x] Producto manual sin precios ni foto → mensaje de sin información ✓
[x] El pie aparece al final del scroll, no flota encima del contenido ✓

### Testing responsivo

[x] Móvil (xs) - 360px ✓
[X] Tablet (sm) - 768px ✓
[x] Desktop (md) - 1024px ✓

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- `fuenteDato` ya existe en el producto — no crear campo nuevo para eso
- `fotoFuente` SÍ es un campo nuevo — agregar en los mapeos de cada servicio de API
- Productos legacy sin `fotoFuente` deben tratarse como `null` (fallback seguro)
- El componente es "tonto" — solo renderiza lo que recibe por props, sin acceder al store
- No agregar lógica de negocio dentro de `PieAtribucion.vue`
- La sección usuario dice "Tus registros" en esta versión (sin sistema de usuarios todavía)
- Fase 4 es un placeholder: NO implementar hasta tener API de geolocalización

═══════════════════════════════════════════════════════════════

## PRÓXIMAS MEJORAS (POST-MVP) 🚀

[ ] Sistema de usuarios: mostrar nombre o "Anónimo" en vez de "Tus registros"
[ ] Múltiples contribuidores: agrupar precios por usuario y mostrar cada uno
[ ] API de geolocalización en comercios: integrar Fase 4
[ ] Fecha del último registro en la sección usuario
[ ] Enlace directo a la fuente (ej: abrir Open Food Facts del producto)
[ ] Foto del comercio: rastrear fuente igual que la foto del producto

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 100% (4/4 fases completadas)

✅ Fase 1: Componente base PieAtribucion.vue
✅ Fase 2: Rastrear fuente de la foto
✅ Fase 3: Integrar en DetalleProductoPage
✅ Fase 4: Integrar en EditarComercioPage
⬜ Fase Testing

═══════════════════════════════════════════════════════════════

**CREADO:** 9 de Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** 9 de Marzo 2026
**ESTADO:** 🧪 IMPLEMENTADO — PENDIENTE TESTING
