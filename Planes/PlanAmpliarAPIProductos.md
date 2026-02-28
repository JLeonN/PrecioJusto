# PLAN DE TRABAJO — AMPLIAR APIs DE BÚSQUEDA DE PRODUCTOS

Proyecto: Precio Justo
Fecha inicio: 28 de Febrero 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Actualmente la app solo busca productos en Open Food Facts (alimentos).
Este plan extiende el sistema para que el escaneo de código de barras funcione
con CUALQUIER tipo de producto: cosméticos, mascotas, productos generales y libros.

Todas las APIs usadas son gratuitas y de código abierto.

### OBJETIVOS PRINCIPALES:

- Agregar soporte para Open Beauty Facts, Open Pet Food Facts y Open Products Facts
- Agregar soporte para libros (Open Library + Google Books como respaldo)
- Agregar UPCitemdb como comodín general (100 req/día gratis, sin clave)
- Crear un servicio orquestador que pruebe las APIs en orden automáticamente
- Detectar libros automáticamente por el prefijo ISBN (978 / 979)
- Guardar de qué API vino el dato (`fuenteDato`) y mostrarlo en el detalle del producto

### ESTADO ACTUAL (pre-plan):

- `OpenFoodFactsService.js` busca solo en Open Food Facts
- `DialogoAgregarProducto.vue` llama directamente a ese servicio
- `BandejaBorradores.vue` e `InfoProducto.vue` también llaman directamente al mismo servicio
- Si el producto no es alimento → no se encuentra nada → el usuario llena todo manual
- No se guarda la fuente del dato

### TECNOLOGÍAS:

- Vue.js 3 + Composition API
- Quasar Framework
- Pinia (productosStore, sesionEscaneoStore)
- axios (ya instalado)
- Open Food Facts API (ya integrada)
- Open Beauty Facts API (misma estructura)
- Open Pet Food Facts API (misma estructura)
- Open Products Facts API (misma estructura)
- Open Library API (gratuita, sin clave)
- Google Books API (gratuita, requiere clave de Google Cloud)
- UPCitemdb Trial API (100 req/día, sin clave)

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: SERVICIOS OPEN FACTS ADICIONALES 🧴 [x] COMPLETA

### Objetivo

Crear los tres servicios restantes de la familia Open Facts.
Son casi idénticos a `OpenFoodFactsService.js` — solo cambia la base URL.

### 1.1 — OpenBeautyFactsService.js

**Archivo nuevo:** `src/almacenamiento/servicios/OpenBeautyFactsService.js`

[x] Copiar estructura de `OpenFoodFactsService.js`
[x] Cambiar `baseURL` a `https://world.openbeautyfacts.org/api/v2`
[x] Método público: `buscarPorCodigoBarras(codigo)` → retorna producto mapeado o `null`
[x] `_mapearProducto()` idéntico al de Open Food Facts (misma estructura de respuesta)
[x] Exportar instancia singleton

### 1.2 — OpenPetFoodFactsService.js

**Archivo nuevo:** `src/almacenamiento/servicios/OpenPetFoodFactsService.js`

[x] Igual que 1.1 con `baseURL = 'https://world.openpetfoodfacts.org/api/v2'`

### 1.3 — OpenProductsFactsService.js

**Archivo nuevo:** `src/almacenamiento/servicios/OpenProductsFactsService.js`

[x] Igual que 1.1 con `baseURL = 'https://world.openproductsfacts.org/api/v2'`

### Formato de retorno (igual para los 3)

```javascript
{
  nombre: string,
  marca: string,
  codigoBarras: string,
  cantidad: number,
  unidad: string,
  categoria: string,
  imagen: string | null,
}
```

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: SERVICIOS DE LIBROS 📚 [x] COMPLETA

### Objetivo

Crear dos servicios para buscar libros por ISBN: Open Library (primario) y
Google Books (respaldo). Los ISBNs siempre empiezan con `978` o `979`.

### 2.1 — OpenLibraryService.js

**Archivo nuevo:** `src/almacenamiento/servicios/OpenLibraryService.js`

[x] Endpoint: `https://openlibrary.org/isbn/{isbn}.json`
[x] Portada: `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg`
[x] Método público: `buscarPorIsbn(isbn)` → retorna producto mapeado o `null`
[x] `_mapearLibro(datos, isbn)`:
  - `nombre` ← `title`
  - `marca` ← primer autor si existe (los autores vienen como array de refs a `/authors/OL...`)
  - `codigoBarras` ← isbn recibido como parámetro
  - `cantidad` ← `1`, `unidad` ← `'unidad'`
  - `categoria` ← `'Libro'`
  - `imagen` ← URL de portada (siempre construida desde el ISBN — verificar si retorna 404)
[x] Manejar 404 (libro no encontrado) → retorna `null`
[x] Exportar instancia singleton

### ⚠️ Nota sobre autores

Open Library retorna autores como referencias (`/authors/OL...`), no como texto.
Para simplificar, si `title` existe pero no hay texto de autor disponible
directamente en la respuesta, dejar `marca` vacío — no hacer un segundo request.

### 2.2 — GoogleBooksService.js

**Archivo nuevo:** `src/almacenamiento/servicios/GoogleBooksService.js`

[x] Endpoint: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
[x] No requiere clave API para el tier gratuito (fair use por IP)
[x] Método público: `buscarPorIsbn(isbn)` → retorna producto mapeado o `null`
[x] `_mapearLibro(item)`:
  - `nombre` ← `volumeInfo.title`
  - `marca` ← `volumeInfo.authors[0]` o `volumeInfo.publisher`
  - `codigoBarras` ← isbn recibido como parámetro
  - `cantidad` ← `1`, `unidad` ← `'unidad'`
  - `categoria` ← `'Libro'`
  - `imagen` ← `volumeInfo.imageLinks?.thumbnail` (reemplazar `http://` por `https://`)
[x] Si `totalItems === 0` → retorna `null`
[x] Exportar instancia singleton

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: SERVICIO UPCITEMDB 🔍 [x] COMPLETA

### Objetivo

Agregar UPCitemdb como comodín de última instancia. Cubre 686M+ productos de
cualquier categoría. El tier de prueba es gratuito (100 req/día, sin registro).

### UpcItemDbService.js

**Archivo nuevo:** `src/almacenamiento/servicios/UpcItemDbService.js`

[x] Endpoint: `https://api.upcitemdb.com/prod/trial/lookup?upc={codigo}`
[x] Sin clave API (tier trial)
[x] Método público: `buscarPorCodigo(codigo)` → retorna producto mapeado o `null`
[x] `_mapearProducto(item)`:
  - `nombre` ← `title`
  - `marca` ← `brand`
  - `codigoBarras` ← `ean` o `upc`
  - `cantidad` ← `1`, `unidad` ← `'unidad'`
  - `categoria` ← `category` (primer segmento si viene como breadcrumb separado por `>`)
  - `imagen` ← `images[0]` o `null`
[x] Si `items` está vacío o `code !== 'OK'` → retorna `null`
[x] Manejar error 429 (rate limit) → retorna `null` sin romper el flujo
[x] Exportar instancia singleton

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: SERVICIO ORQUESTADOR 🎯 [x] COMPLETA

### Objetivo

Crear el servicio central que recibe un código de barras y prueba las APIs
en orden, retornando el primer resultado exitoso.

### BuscadorProductosService.js

**Archivo nuevo:** `src/almacenamiento/servicios/BuscadorProductosService.js`

[x] Importar todos los servicios de Fases 1, 2 y 3
[x] Importar `OpenFoodFactsService` ya existente
[x] Método público principal: `buscarPorCodigo(codigo)` → retorna `{ producto, fuenteDato }` o `null`

### Lógica de detección y cadena de búsqueda

```javascript
async function buscarPorCodigo(codigo) {
  // ISBN: empiezan con 978 o 979 → flujo libros
  if (codigo.startsWith('978') || codigo.startsWith('979')) {
    return await _buscarLibro(codigo)
  }
  // Resto → flujo Open Facts → UPCitemdb
  return await _buscarProductoGeneral(codigo)
}
```

```javascript
async function _buscarLibro(isbn) {
  // 1. Open Library
  // 2. Google Books (respaldo)
  // Si ninguno lo encuentra → null
}
```

```javascript
async function _buscarProductoGeneral(codigo) {
  // 1. Open Food Facts (ya existente)
  // 2. Open Beauty Facts
  // 3. Open Pet Food Facts
  // 4. Open Products Facts
  // 5. UPCitemdb (comodín)
  // Si ninguno lo encuentra → null
}
```

[x] Cada llamada está envuelta en try/catch — si una API falla, sigue con la siguiente
[x] El retorno siempre es `{ producto, fuenteDato }` o `null`

### Valores de `fuenteDato`

```javascript
const FUENTES = {
  OPEN_FOOD_FACTS: 'Open Food Facts',
  OPEN_BEAUTY_FACTS: 'Open Beauty Facts',
  OPEN_PET_FOOD_FACTS: 'Open Pet Food Facts',
  OPEN_PRODUCTS_FACTS: 'Open Products Facts',
  OPEN_LIBRARY: 'Open Library',
  GOOGLE_BOOKS: 'Google Books',
  UPC_ITEM_DB: 'UPCitemdb',
}
```

[x] Exportar instancia singleton del orquestador

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: INTEGRAR ORQUESTADOR EN COMPONENTES 🔌 [x] COMPLETA

### Objetivo

Reemplazar las llamadas directas a `OpenFoodFactsService` por el orquestador
en todos los lugares donde se busca por código de barras.

### 5.1 — sesionEscaneoStore.js

**Archivo editado:** `src/almacenamiento/stores/sesionEscaneoStore.js`

[x] Agregar campo `fuenteDato: string | null` en la estructura de `ItemBorrador`

```javascript
// Antes
{ id, codigoBarras, nombre, marca, cantidad, unidad, imagen, precio, moneda, origenApi, productoExistenteId }

// Después
{ id, codigoBarras, nombre, marca, cantidad, unidad, imagen, precio, moneda, origenApi, fuenteDato, productoExistenteId }
```

### 5.2 — DialogoAgregarProducto.vue

**Archivo editado:** `src/components/Formularios/DialogoAgregarProducto.vue`

[x] Reemplazar import de `openFoodFactsService` por `buscadorProductosService`
[x] En `procesarCodigoEscaneado(codigo)`:
  - Antes: `const producto = await openFoodFactsService.buscarPorCodigoBarras(codigo)`
  - Después: `const resultado = await buscadorProductosService.buscarPorCodigo(codigo)`
[x] Extraer `producto` y `fuenteDato` del resultado
[x] Pasar `fuenteDato` al `ItemBorrador` que se guarda en el store

### 5.3 — BandejaBorradores.vue

**Archivo editado:** `src/components/Scanner/BandejaBorradores.vue`

[x] Reemplazar import de `openFoodFactsService` por `buscadorProductosService`
[x] En `buscarActualizacionesApi()` (auto-fetch al reconectar):
  - Usar `buscadorProductosService.buscarPorCodigo(codigo)` en lugar del servicio anterior
  - Actualizar `fuenteDato` del item junto con los otros campos
[x] En `guardarTodos()`: pasar `fuenteDato` al producto cuando se crea en `productosStore`

### 5.4 — InfoProducto.vue (restaurar desde API)

**Archivo editado:** `src/components/DetalleProducto/InfoProducto.vue`

[x] Reemplazar import de `openFoodFactsService` por `buscadorProductosService`
[x] En `restaurarDesdeApi()`: usar `buscadorProductosService.buscarPorCodigo(codigoBarras)`
[x] Actualizar `fuenteDato` del producto junto con los otros campos al restaurar

### 5.5 — MisProductosPage.vue + DialogoEditarItemBandeja.vue (extra)

[x] `MisProductosPage.vue`: usar orquestador en flujo de escaneo, agregar `fuenteDato` al item
[x] `DialogoEditarItemBandeja.vue`: usar orquestador en `restaurarDesdeApi()`

═══════════════════════════════════════════════════════════════

## 📋 FASE 6: ATRIBUCIÓN DE FUENTE EN UI 🏷️ [x] COMPLETA

### Objetivo

Mostrar en la página de detalle del producto de dónde vienen los datos.
Texto pequeño, discreto, al pie del componente de información del producto.

### InfoProducto.vue

**Archivo editado:** `src/components/DetalleProducto/InfoProducto.vue`

[x] Al pie de la sección de información del producto, agregar:

```html
<!-- Solo visible si el producto tiene fuenteDato -->
<p v-if="producto.fuenteDato" class="fuente-dato-texto">
  Datos de {{ producto.fuenteDato }}
</p>
```

[x] CSS:

```css
.fuente-dato-texto {
  font-size: 11px;
  color: #9e9e9e;
  margin: 8px 0 0 0;
  text-align: center;
}
```

[x] No mostrar nada si `producto.fuenteDato` está vacío o es `null`
[x] No mostrar enlace ni ícono — solo texto plano en gris claro

═══════════════════════════════════════════════════════════════

## 📋 FASE TESTING 🧪 [ ] PENDIENTE

### T.A — Open Facts adicionales

[ ] Escanear producto de cosmética (ej: labial, crema) → Open Beauty Facts lo encuentra
[ ] Escanear alimento para mascota → Open Pet Food Facts lo encuentra
[ ] Escanear producto de limpieza o del hogar → Open Products Facts lo encuentra
[ ] En todos los casos: `fuenteDato` correcto visible en el detalle del producto
[ ] Fuente correcta mostrada en DetalleProducto

### T.B — Libros

[ ] Código que empieza con 978 → va directamente al flujo de libros (no intenta Open Food Facts)
[ ] ISBN válido encontrado en Open Library → datos correctos en el formulario
[ ] ISBN no encontrado en Open Library → intenta Google Books automáticamente
[ ] ISBN no encontrado en ninguna → usuario llena manual (sin errores visibles)
[ ] `categoria` = "Libro" en todos los libros encontrados
[ ] `fuenteDato` = "Open Library" o "Google Books" según corresponda

### T.C — UPCitemdb

[ ] Código no encontrado en ningún Open Facts → llega a UPCitemdb
[ ] UPCitemdb encuentra el producto → datos correctos (nombre, marca, categoría, imagen)
[ ] Rate limit (429): la app no muestra error visible al usuario, solo pasa a manual
[ ] `fuenteDato` = "UPCitemdb"

### T.D — Cadena completa

[ ] Alimento → Open Food Facts lo resuelve (sin cambio respecto al comportamiento actual)
[ ] Producto raro → ninguna API lo tiene → formulario manual sin errores
[ ] API lenta o sin internet → cada intento falla silenciosamente → llega a manual
[ ] Restaurar desde API en InfoProducto → usa el orquestador y actualiza `fuenteDato`

### T.E — UI de atribución

[ ] Texto "Datos de Open Food Facts" visible en detalle de producto de alimento
[ ] Texto correcto para cada fuente
[ ] Producto ingresado manual (sin API): no muestra texto de fuente
[ ] Texto discreto, no molesta visualmente

═══════════════════════════════════════════════════════════════

## ARCHIVOS NUEVOS

```
src/
  almacenamiento/
    servicios/
      OpenBeautyFactsService.js        (NUEVO — Fase 1.1)
      OpenPetFoodFactsService.js       (NUEVO — Fase 1.2)
      OpenProductsFactsService.js      (NUEVO — Fase 1.3)
      OpenLibraryService.js            (NUEVO — Fase 2.1)
      GoogleBooksService.js            (NUEVO — Fase 2.2)
      UpcItemDbService.js              (NUEVO — Fase 3)
      BuscadorProductosService.js      (NUEVO — Fase 4)
```

## ARCHIVOS EDITADOS

```
src/
  almacenamiento/
    stores/
      sesionEscaneoStore.js            (EDITAR — Fase 5.1)
  components/
    Formularios/
      Dialogos/
        DialogoAgregarProducto.vue     (EDITAR — Fase 5.2)
    Scanner/
      BandejaBorradores.vue            (EDITAR — Fase 5.3)
    DetalleProducto/
      InfoProducto.vue                 (EDITAR — Fase 5.4 + Fase 6)
```

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- Los 3 nuevos servicios Open Facts son casi copias exactas del existente — solo cambia la URL base
- El orquestador (`BuscadorProductosService`) es el único punto de entrada para búsquedas
- Ningún componente debería importar servicios individuales de API directamente (excepto el orquestador)
- La detección ISBN (978/979) es instantánea — es un `startsWith`, no agrega latencia
- UPCitemdb no requiere registro ni clave para el tier de prueba (100 req/día por IP)
- Google Books tampoco requiere clave para búsquedas de bajo volumen (fair use)
- Si una API falla (error de red, timeout), el orquestador continúa con la siguiente silenciosamente
- El campo `fuenteDato` es opcional en el producto — los productos creados antes del plan no lo tienen

═══════════════════════════════════════════════════════════════

## PRÓXIMAS MEJORAS (POST-MVP) 🚀

[ ] Mostrar ícono/logo de la fuente en lugar de solo texto
[ ] Agregar Open Prices como fuente de precios de referencia
[ ] Soporte para OpenFDA (medicamentos de venta libre)
[ ] Caché de resultados de APIs en localStorage (evitar requests repetidos a lo largo del día)
[ ] Contador de requests restantes de UPCitemdb visible en configuración

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 100% (6/6 fases completadas) ✅

[x] Fase 1: Servicios Open Facts adicionales (Beauty, Pet Food, Products)
[x] Fase 2: Servicios de libros (Open Library + Google Books)
[x] Fase 3: Servicio UPCitemdb
[x] Fase 4: Servicio orquestador (BuscadorProductosService)
[x] Fase 5: Integrar orquestador en componentes existentes
[x] Fase 6: Atribución de fuente en UI (InfoProducto)
[ ] Fase Testing: Testing completo

═══════════════════════════════════════════════════════════════

**CREADO:** 28 de Febrero 2026
**ÚLTIMA ACTUALIZACIÓN:** 28 de Febrero 2026
**ESTADO:** ✅ IMPLEMENTACIÓN COMPLETA — pendiente testing
