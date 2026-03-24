# BÚSQUEDA DE PRODUCTOS POR CÓDIGO — DOCUMENTACIÓN TÉCNICA

## ARQUITECTURA GENERAL

El sistema usa un **orquestador** (`BuscadorProductosService`) como punto de entrada para **búsqueda por código de barras** en red.

Para **unificar política local + API** en formularios y alinearse con el escaneo, existe `BusquedaProductosHibridaService.js`: consulta primero `ProductosService` y solo después el orquestador (código) u `OpenFoodFactsService.buscarPorTexto` (nombre), según el plan `Planes/PlanBusquedaLocalPrimeroYEstadosCarga.md`.

```
codigoBarras
  │
  ├─ empieza con 978/979 ──► OpenLibraryService → GoogleBooksService
  │
  └─ resto ──► OpenFoodFactsService → OpenBeautyFactsService
                → OpenPetFoodFactsService → OpenProductsFactsService
                → UpcItemDbService
```

## SERVICIOS

| Servicio | Archivo | Categorías | Límite | CORS |
|---|---|---|---|---|
| OpenFoodFacts | `OpenFoodFactsService.js` | Alimentos | Sin límite | Sí |
| OpenBeautyFacts | `OpenBeautyFactsService.js` | Cosméticos, perfumes | Sin límite | Sí |
| OpenPetFoodFacts | `OpenPetFoodFactsService.js` | Alimentos mascotas | Sin límite | Sí |
| OpenProductsFacts | `OpenProductsFactsService.js` | General (electrónica, hogar) | Sin límite | Sí |
| OpenLibrary | `OpenLibraryService.js` | Libros (ISBN) | Sin límite | Sí |
| GoogleBooks | `GoogleBooksService.js` | Libros (ISBN, respaldo) | Fair use | Sí |
| UpcItemDb | `UpcItemDbService.js` | General comodín | 100 req/día | Solo APK* |

*UPCitemdb tiene CORS en browser dev (`localhost`). Funciona en Capacitor nativo.

## ORQUESTADOR — BuscadorProductosService.js

`src/almacenamiento/servicios/BuscadorProductosService.js`

Retorna: `{ producto, fuenteDato }` o `null`

### Búsqueda por texto (nombre) — Open Food Facts

En el flujo de **Agregar producto**, `buscarPorTexto` se usa cuando no hay coincidencias en la base local del usuario, o cuando el usuario elige **“Buscar en Open Food Facts”** desde el pie del diálogo de resultados (resultados locales ya mostrados). No sustituye al orquestador para códigos de barras.

### Valores de fuenteDato
```javascript
'Mis productos'  // resultados desde BusquedaProductosHibridaService (solo local)
'Open Food Facts' | 'Open Beauty Facts' | 'Open Pet Food Facts'
'Open Products Facts' | 'Open Library' | 'Google Books' | 'UPCitemdb'
```

## FORMATO DE RETORNO (todos los servicios)

```javascript
{
  nombre: string,
  marca: string,       // autor en libros
  codigoBarras: string,
  cantidad: number,
  unidad: string,
  categoria: string,   // 'Libro' hardcodeado para ISBN
  imagen: string | null,
}
```

## OPEN FOOD FACTS — DETALLES TÉCNICOS

### Endpoints
```
GET https://world.openfoodfacts.org/api/v2/product/{codigo}
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=...&json=1
```
Los 3 servicios de Open *Facts adicionales tienen la misma estructura — solo cambia la base URL.

### _extraerCantidadUnidad(textoQuantity)
Parsea texto libre → `{cantidad, unidad}`. Patrones soportados:
- `"2.25 L"` → `{2.25, "litro"}`
- `"500 ml"` → `{500, "mililitro"}`
- `"1 kg"` → `{1, "kilo"}`
- `"250 g"` → `{250, "gramo"}`
- fallback → `{1, "unidad"}`

### _extraerPrimeraCategoria(categorias)
Split por coma → primer elemento. `"Bebidas, Gaseosas"` → `"Bebidas"`

### Campos disponibles (no mapeados aún)
- `nutrition_grades` — Nutri-Score (A–E)
- `allergens` — alérgenos
- `labels` — etiquetas (Vegano, Sin gluten, etc.)

## OPEN LIBRARY — DETALLES TÉCNICOS

### ⚠️ Endpoint correcto (evitar redirect)
```
GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
```
**NO usar** `/isbn/{isbn}.json` → hace redirect 301 que falla en Android WebView.

### Autor
La Books API retorna `authors[0].name` directamente (sin segundo request).

## MANEJO DE ERRORES

```javascript
// Open Facts: 404 = producto no en esa DB (silenciar)
if (error.response?.status === 404) return null

// UPCitemdb: 429 = rate limit diario alcanzado
if (error.response?.status === 429) { console.warn('...'); return null }

// UPCitemdb: CORS en browser dev
if (error.code === 'ERR_NETWORK') return null
```

## DEBUGGING EN ANDROID

```bash
# Ver logs JS en dispositivo Android
adb logcat -s Capacitor/Console
```

## COMPONENTES QUE USAN EL ORQUESTADOR

- `DialogoAgregarProducto.vue` — al escanear código unitario desde el formulario y búsqueda por código
- `MisProductosPage.vue` — flujo de escaneo (Modo A/B): tras detectar código, consulta BD local y API vía orquestador
- `InfoProducto.vue` — botón "Restaurar desde API"
- La **Mesa de trabajo** (`MesaTrabajoPage.vue` + `TarjetaProductoBorrador.vue`) opera sobre ítems ya en `sesionEscaneoStore`; los datos de API se resuelven al escanear en `MisProductosPage` / `TarjetaEscaneo`, no en un componente "bandeja" aparte (el antiguo `BandejaBorradores.vue` / `DialogoEditarItemBandeja.vue` ya no existe en el árbol actual)

## fuenteDato EN EL FLUJO

1. `BuscadorProductosService` retorna `{ producto, fuenteDato }`
2. Se guarda en `ItemBorrador` → `sesionEscaneoStore`
3. Se persiste en `productosStore` al confirmar
4. Se muestra en `InfoProducto.vue` como texto discreto al pie

---

**Última actualización:** 24 de Marzo 2026 — Lista de consumidores alineada con `MesaTrabajoPage` y eliminación de referencias a bandeja antigua.
