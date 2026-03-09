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

[ ] src/components/Compartidos/PieAtribucion.vue

### Props

[ ] `fuentesApi: Array` — lista de objetos `{ api: String, campos: Array<String> }`
    Ejemplo: `[{ api: 'Open Food Facts', campos: ['nombre', 'marca', 'categoría'] }]`
[ ] `fuentesUsuario: Array` — lista de objetos `{ campos: Array<String> }`
    Ejemplo: `[{ campos: ['precios', 'foto'] }]`
[ ] Ambas props con `default: () => []`

### Template

[ ] Contenedor `<section class="pie-atribucion">` al final del slot de la página
[ ] Separador visual fino (`border-top: 1px solid #e0e0e0`) antes del contenido
[ ] Sección 📡 **Fuentes de API** — visible solo si `fuentesApi.length > 0`
    - Por cada ítem: `• NombreAPI → campo1, campo2, campo3`
[ ] Sección 👤 **Aportado por vos** — visible solo si `fuentesUsuario.length > 0`
    - Por cada ítem: `• Tus registros → campo1, campo2`
[ ] Estado vacío: si ambas arrays están vacías →
    `<p class="pie-sin-info">Sin información de fuentes disponible</p>`

### Diseño visual

[ ] `font-size: 11px`
[ ] Color texto: `#9e9e9e` (gris tenue, mismo que `fuenteDato` en InfoProducto)
[ ] Padding: `12px 16px`
[ ] Sin protagonismo — no compite con el contenido principal
[ ] Títulos de sección en `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`
[ ] `letter-spacing: 0.5px` en los títulos para darle aire

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

[ ] src/almacenamiento/servicios/OpenFoodFactsService.js (y servicios equivalentes)
[ ] src/components/DetalleProducto/InfoProducto.vue

### 2.1 — Al crear el producto desde la API

[ ] En `_mapearProducto()` de cada servicio de API: si el producto tiene `imagen` →
    incluir `fotoFuente: 'imagen' ? 'api' : null` en el objeto mapeado
[ ] Si la API devuelve un producto sin imagen → `fotoFuente: null`

### 2.2 — Al cambiar la foto desde `InfoProducto.vue`

`InfoProducto.vue` maneja los 4 casos con `useCamaraFoto`. Actualizar en cada uno:

[ ] **Tomar foto** (cámara) → al guardar: `actualizarProducto(id, { imagen, fotoFuente: 'usuario' })`
[ ] **Desde galería** → al guardar: `actualizarProducto(id, { imagen, fotoFuente: 'usuario' })`
[ ] **Restaurar desde API** → si la API devuelve imagen: `fotoFuente: 'api'`; si no: `fotoFuente: null`
[ ] **Quitar foto** → `actualizarProducto(id, { imagen: null, fotoFuente: null })`

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

[ ] src/pages/DetalleProductoPage.vue

### 3.1 — Computed `fuentesApiProducto`

[ ] Si `producto.fuenteDato` tiene valor:
    - Campos base: `['nombre', 'marca', 'categoría']`
    - Si `producto.fotoFuente === 'api'`: agregar `'foto'` a los campos
    - Construir: `[{ api: producto.fuenteDato, campos }]`
[ ] Si `producto.fuenteDato` está vacío o null → devolver `[]`

### 3.2 — Computed `fuentesUsuarioProducto`

[ ] Campos base siempre presentes: `['precios']`
[ ] Si `producto.fotoFuente === 'usuario'`: agregar `'foto'` a los campos
[ ] Construir: `[{ campos }]`
[ ] Si `producto.precios` está vacío Y no hay foto de usuario → devolver `[]`

### 3.3 — Agregar en el template

[ ] Importar y registrar `PieAtribucion`
[ ] Colocar `<PieAtribucion>` al final del template, después de `HistorialPrecios`
    y del FAB, para que quede al final del scroll completo
[ ] Pasar props: `:fuentes-api="fuentesApiProducto"` y `:fuentes-usuario="fuentesUsuarioProducto"`

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

## 📋 FASE 4: PLACEHOLDER `EditarComercioPage` 🏪 [PENDIENTE — FUTURO]

### Objetivo

Cuando llegue el momento (integración con API de geolocalización y sistema de usuarios),
agregar `PieAtribucion` en `EditarComercioPage`, debajo de las estadísticas del comercio.

### Lo que se sabe hasta ahora

[ ] Ubicación: debajo de las estadísticas, antes del listado de productos asociados
[ ] `fuentesApi` incluirá: nombre de la API de geolocalización, campos aportados
[ ] `fuentesUsuario` incluirá: foto del comercio, datos manuales, reseñas

### ⚠️ Nota

Esta fase NO se implementa ahora. Es un placeholder para documentar la intención
y asegurarse de que el componente ya tenga la flexibilidad necesaria desde la Fase 1.

═══════════════════════════════════════════════════════════════

## 📋 FASE TESTING: TESTING Y AJUSTES 🧪

### Testing del componente base (Fase 1)

[ ] Props vacías → mensaje "Sin información de fuentes disponible" visible ✓
[ ] Solo `fuentesApi` con datos → sección API visible, sección usuario oculta ✓
[ ] Solo `fuentesUsuario` con datos → sección usuario visible, sección API oculta ✓
[ ] Ambas con datos → ambas secciones visibles ✓
[ ] Diseño discreto: no compite visualmente con el historial de precios ✓

### Testing del rastreo de foto (Fase 2)

[ ] Crear producto por código de barras con foto de API → `fotoFuente === 'api'` ✓
[ ] Crear producto por código de barras sin foto → `fotoFuente === null` ✓
[ ] Tomar foto con cámara → `fotoFuente === 'usuario'` ✓
[ ] Elegir desde galería → `fotoFuente === 'usuario'` ✓
[ ] Restaurar desde API (con foto) → `fotoFuente === 'api'` ✓
[ ] Restaurar desde API (sin foto) → `fotoFuente === null` ✓
[ ] Quitar foto → `fotoFuente === null` ✓
[ ] Producto legacy sin `fotoFuente` → no rompe nada ✓

### Testing de integración en DetalleProductoPage (Fase 3)

[ ] Producto de API con foto de API → pie muestra API con 'foto' en los campos ✓
[ ] Producto de API + usuario reemplazó foto → API sin 'foto', usuario con 'foto' ✓
[ ] Producto manual (sin API) con precios → solo sección usuario visible ✓
[ ] Producto manual sin precios ni foto → mensaje de sin información ✓
[ ] El pie aparece al final del scroll, no flota encima del contenido ✓

### Testing responsivo

[ ] Móvil (xs) - 360px ✓
[ ] Tablet (sm) - 768px ✓
[ ] Desktop (md) - 1024px ✓

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

## 📊 PROGRESO GENERAL: 0% (0/4 fases completadas)

⬜ Fase 1: Componente base PieAtribucion.vue
⬜ Fase 2: Rastrear fuente de la foto
⬜ Fase 3: Integrar en DetalleProductoPage
⬜ Fase 4: Placeholder EditarComercioPage (futuro)
⬜ Fase Testing

═══════════════════════════════════════════════════════════════

**CREADO:** 9 de Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** 9 de Marzo 2026
**ESTADO:** 🔄 EN PROGRESO
