# OPEN FOOD FACTS API - DOCUMENTACIÓN TÉCNICA

## PROPÓSITO
Integración con Open Food Facts API para autocompletar datos de productos mediante búsqueda por código de barras o texto libre. Evita entrada manual repetitiva y mejora la calidad de datos.

## ARCHIVO PRINCIPAL
- Ubicación: src/almacenamiento/servicios/OpenFoodFactsService.js
- Patrón: Singleton exportado como instancia única
- Dependencia: axios para peticiones HTTP

## API ENDPOINTS

### ENDPOINT 1: Búsqueda por Código de Barras
```
https://world.openfoodfacts.org/api/v2/product/{codigo}
```
- Método: GET
- Retorna: Objeto producto único o status 0 si no existe
- Uso: Búsqueda exacta y confiable

### ENDPOINT 2: Búsqueda por Texto (Legacy)
```
https://world.openfoodfacts.org/cgi/search.pl
```
- Método: GET
- Parámetros:
  - search_terms: Término de búsqueda
  - search_simple: 1 (búsqueda simple)
  - action: "process"
  - json: 1 (respuesta en JSON)
  - page_size: Límite de resultados (default: 10)
- Retorna: Array de productos que coinciden
- Uso: Búsqueda por nombre, marca, categoría

## CLASE OpenFoodFactsService

### Constructor
```javascript
constructor() {
  this.baseURL = 'https://world.openfoodfacts.org/api/v2'
  this.apiURLLegacy = 'https://world.openfoodfacts.org/cgi'
}
```

### Métodos Públicos

#### buscarPorCodigoBarras(codigoBarras)
**Propósito:** Buscar producto exacto por código EAN/UPC

**Parámetros:**
- codigoBarras (string): Código de barras del producto

**Retorno:**
- Promise<Object|null>: Producto mapeado o null si no existe

**Flujo:**
1. Construye URL con código
2. Hace petición GET
3. Verifica status === 1
4. Mapea datos de API a formato app
5. Retorna producto o null

**Ejemplo de uso:**
```javascript
const producto = await openFoodFactsService.buscarPorCodigoBarras('7790123456')
if (producto) {
  console.log(producto.nombre) // "Coca Cola 2.25L"
}
```

#### buscarPorTexto(texto, limite = 10)
**Propósito:** Buscar productos por término de búsqueda

**Parámetros:**
- texto (string): Término de búsqueda
- limite (number): Máximo de resultados (default: 10)

**Retorno:**
- Promise<Array>: Array de productos mapeados (vacío si no hay resultados)

**Flujo:**
1. Construye URL con parámetros
2. Hace petición GET
3. Recibe array de productos
4. Mapea cada producto a formato app
5. Retorna array

**Ejemplo de uso:**
```javascript
const resultados = await openFoodFactsService.buscarPorTexto('coca cola')
resultados.forEach(p => console.log(p.nombre))
```

### Métodos Privados

#### _mapearProducto(productoAPI)
**Propósito:** Transformar estructura de datos API → App

**Entrada (API):**
```javascript
{
  product_name: "Coca Cola",
  brands: "Coca-Cola Company",
  code: "7790123456",
  quantity: "2.25 L",
  categories: "Bebidas, Gaseosas",
  image_url: "https://..."
}
```

**Salida (App):**
```javascript
{
  nombre: "Coca Cola",
  marca: "Coca-Cola Company",
  codigoBarras: "7790123456",
  cantidad: 2.25,
  unidad: "litro",
  categoria: "Bebidas",
  imagen: "https://..." // o null
}
```

**Proceso:**
1. Extrae cantidad y unidad con _extraerCantidadUnidad()
2. Extrae primera categoría con _extraerPrimeraCategoria()
3. Construye objeto normalizado
4. Retorna formato app

#### _extraerCantidadUnidad(textoQuantity)
**Propósito:** Parsear texto de cantidad/unidad a valores numéricos

**Patrones regex soportados:**
- Litros: `/(\d+(?:\.\d+)?)\s*l(?:itros?)?/i` → "2.25 L" = {2.25, "litro"}
- Mililitros: `/(\d+(?:\.\d+)?)\s*ml/i` → "500 ml" = {500, "mililitro"}
- Kilos: `/(\d+(?:\.\d+)?)\s*kg/i` → "1 kg" = {1, "kilo"}
- Gramos: `/(\d+(?:\.\d+)?)\s*g(?:ramos?)?/i` → "250 g" = {250, "gramo"}
- Unidades: `/(\d+(?:\.\d+)?)\s*u(?:nidades?)?/i` → "6 u" = {6, "unidad"}

**Fallback:**
- Si no matchea ningún patrón: {cantidad: 1, unidad: "unidad"}
- Si textoQuantity es vacío: {cantidad: 1, unidad: "unidad"}

**Ejemplos:**
```javascript
_extraerCantidadUnidad("2.25 L")      // {cantidad: 2.25, unidad: "litro"}
_extraerCantidadUnidad("500 ml")      // {cantidad: 500, unidad: "mililitro"}
_extraerCantidadUnidad("1 kg")        // {cantidad: 1, unidad: "kilo"}
_extraerCantidadUnidad("")            // {cantidad: 1, unidad: "unidad"}
_extraerCantidadUnidad("algo raro")   // {cantidad: 1, unidad: "unidad"}
```

#### _extraerPrimeraCategoria(categorias)
**Propósito:** Obtener primera categoría de string separado por comas

**Entrada:** "Bebidas, Gaseosas, Con azúcar"
**Salida:** "Bebidas"

**Proceso:**
1. Split por coma
2. Trim espacios
3. Retorna primer elemento

## INTEGRACIÓN EN COMPONENTES

### DialogoAgregarProducto.vue

#### Búsqueda por Código
```javascript
async function buscarPorCodigo(codigo, callbackFinalizar) {
  try {
    const producto = await openFoodFactsService.buscarPorCodigoBarras(codigo)
    
    if (producto) {
      autoCompletarFormulario(producto)
      // Notificación positiva
    } else {
      // Notificación warning: producto no encontrado
    }
  } catch (error) {
    // Notificación negativa: error al buscar
  } finally {
    callbackFinalizar()
  }
}
```

#### Búsqueda por Texto
```javascript
async function buscarPorNombre(texto, callbackFinalizar) {
  try {
    const resultados = await openFoodFactsService.buscarPorTexto(texto)
    
    if (resultados.length > 0) {
      // Mostrar diálogo con resultados
      resultadosBusqueda.value = resultados
      dialogoResultadosAbierto.value = true
    } else {
      // Notificación warning: sin resultados
    }
  } catch (error) {
    // Notificación negativa: error al buscar
  } finally {
    callbackFinalizar()
  }
}
```

#### Auto-completar Formulario
```javascript
function autoCompletarFormulario(producto) {
  datosProducto.value = {
    nombre: producto.nombre || datosProducto.value.nombre,
    marca: producto.marca || datosProducto.value.marca,
    codigoBarras: producto.codigoBarras || datosProducto.value.codigoBarras,
    cantidad: producto.cantidad || datosProducto.value.cantidad,
    unidad: producto.unidad || datosProducto.value.unidad,
    categoria: producto.categoria || datosProducto.value.categoria,
    imagen: producto.imagen || datosProducto.value.imagen,
  }
}
```

### FormularioProducto.vue

#### Props de Búsqueda
- @buscar-codigo: Emite cuando usuario ingresa código de barras
- @buscar-nombre: Emite cuando usuario busca por texto

#### Botones de Búsqueda
- Botón "Buscar" junto a campo código de barras
- Botón "Buscar por nombre" en formulario
- Loading spinner durante búsqueda
- Deshabilitar botones mientras busca

## FLUJO COMPLETO DE USO

### Escenario 1: Búsqueda Exitosa por Código
```
1. Usuario abre DialogoAgregarProducto
2. Usuario ingresa código: "7790123456"
3. Usuario presiona botón "Buscar"
4. FormularioProducto emite @buscar-codigo
5. DialogoAgregarProducto llama buscarPorCodigo()
6. OpenFoodFactsService hace petición a API
7. API retorna producto
8. Servicio mapea datos
9. autoCompletarFormulario() llena campos
10. Notificación: "Producto encontrado" ✅
11. Usuario completa precio y guarda
```

### Escenario 2: Búsqueda sin Resultados
```
1. Usuario ingresa código inválido: "999999"
2. Usuario presiona botón "Buscar"
3. OpenFoodFactsService hace petición
4. API retorna status 0 (no encontrado)
5. Servicio retorna null
6. Notificación: "Producto no encontrado, completa manualmente" ⚠️
7. Usuario llena formulario manualmente
```

### Escenario 3: Búsqueda por Texto con Múltiples Resultados
```
1. Usuario ingresa texto: "coca cola"
2. Usuario presiona "Buscar por nombre"
3. OpenFoodFactsService hace petición
4. API retorna array de 10 productos
5. Servicio mapea cada producto
6. DialogoResultadosBusqueda se abre
7. Usuario selecciona producto deseado
8. autoCompletarFormulario() llena campos
9. Usuario completa precio y guarda
```

### Escenario 4: Error de Red
```
1. Usuario busca producto
2. OpenFoodFactsService hace petición
3. Axios lanza error (timeout, sin conexión, etc.)
4. Catch captura error
5. Notificación: "Error al buscar producto" ❌
6. Usuario puede intentar nuevamente o llenar manual
```

## TESTING EN CONSOLA

### Exponer Servicio Globalmente
```javascript
// En OpenFoodFactsService.js
if (typeof window !== 'undefined') {
  window.testAPI = new OpenFoodFactsService()
}
```

### Probar en DevTools
```javascript
// Buscar por código
const producto = await window.testAPI.buscarPorCodigoBarras('7790123456')
console.log(producto)

// Buscar por texto
const resultados = await window.testAPI.buscarPorTexto('coca cola', 5)
console.log(resultados)
```

## NOTIFICACIONES QUASAR

### Producto Encontrado
```javascript
$q.notify({
  type: 'positive',
  message: 'Producto encontrado',
  position: 'top',
  icon: 'check_circle',
})
```

### Producto No Encontrado
```javascript
$q.notify({
  type: 'warning',
  message: 'Producto no encontrado, completa manualmente',
  position: 'top',
})
```

### Error al Buscar
```javascript
$q.notify({
  type: 'negative',
  message: 'Error al buscar producto',
  position: 'top',
})
```

### Sin Resultados (Texto)
```javascript
$q.notify({
  type: 'warning',
  message: 'No se encontraron productos',
  position: 'top',
})
```

## LIMITACIONES Y CONSIDERACIONES

### Limitaciones de la API
- No todos los productos tienen todos los campos
- Campos vacíos son strings vacíos ('') o undefined
- Imágenes pueden no existir (image_url: null)
- Categorías pueden ser muy específicas o genéricas
- Quantity puede venir en formatos inconsistentes

### Manejo de Campos Vacíos
- Todos los campos se manejan con operador OR (`||`)
- Si API retorna vacío, se mantiene valor anterior del formulario
- Usuario siempre puede editar datos auto-completados

### Performance
- Búsqueda por código: ~500ms (1 petición)
- Búsqueda por texto: ~1-2s (más procesamiento en servidor)
- Sin caché implementado (cada búsqueda hace petición)
- Futuro: Implementar caché con localStorage

### Conexión a Internet
- Requiere conexión activa
- No funciona offline
- Timeout por defecto de axios (sin configurar)
- Futuro: Detectar offline y mostrar mensaje preventivo

## FEATURES IMPLEMENTADAS
- ✅ Búsqueda por código de barras (EAN/UPC)
- ✅ Búsqueda por texto libre
- ✅ Mapeo automático de datos API → App
- ✅ Extracción inteligente de cantidad/unidad
- ✅ Extracción de primera categoría
- ✅ Auto-completado de formularios
- ✅ Notificaciones visuales con Quasar
- ✅ Manejo de errores y edge cases
- ✅ Testing en consola del navegador
- ✅ Integración con DialogoAgregarProducto

## FEATURES PLANIFICADAS
- ⏳ Caché de resultados en localStorage (evitar peticiones repetidas)
- ⏳ Detección de estado offline
- ⏳ Sugerencias mientras escribe (autocompletado)
- ⏳ Historial de búsquedas recientes
- ⏳ Timeout configurable para peticiones
- ⏳ Retry automático en caso de error temporal
- ⏳ Soporte para múltiples idiomas (product_name_es, product_name_en)
- ⏳ Normalización de unidades (conversión automática)
- ⏳ Validación de códigos de barras (checksum EAN-13)

## DATOS DE PRUEBA

### Códigos de Barras Reales para Testing
- 7790123456: Coca Cola (puede no existir, ejemplo)
- 7790895000188: Producto uruguayo real
- 3017620422003: Nutella (internacional)
- 5449000000996: Coca-Cola (código europeo)

### Términos de Búsqueda para Testing
- "coca cola" → ~50-100 resultados
- "nutella" → ~20-30 resultados
- "leche" → ~200+ resultados
- "pan" → ~300+ resultados

## CAMPOS DISPONIBLES EN LA API (NO UTILIZADOS AÚN)

Investigación realizada el 18 de Febrero 2026 con producto real (Nutella, código 3017620422003).
Estos campos están disponibles en la API pero no están siendo mapeados actualmente en `_mapearProducto()`.

### Campos de alta prioridad para PrecioJusto

| Campo API | Descripción | Ejemplo | Estado |
|-----------|-------------|---------|--------|
| `nutrition_grades` | Nutri-Score letra A–E | `"e"` | ⏳ Pendiente |
| `allergens` | Alérgenos del producto | `"leche, nueces, soja"` | ⏳ Pendiente |
| `labels` | Etiquetas especiales del producto | `"Vegano, Sin gluten, Orgánico"` | ⏳ Pendiente |

### Campos de prioridad media (para versión futura)

| Campo API | Descripción | Ejemplo | Estado |
|-----------|-------------|---------|--------|
| `ingredients_text` | Lista completa de ingredientes | `"Azúcar, aceite de palma, avellanas..."` | 🔮 Futuro |
| `serving_size` | Tamaño de porción | `"15 g"` | 🔮 Futuro (precio/porción) |
| `nutriments` | Tabla nutricional completa | `{energy, fat, carbohydrates, protein, salt}` | 🔮 Futuro |

### Campos descartados (no útiles para esta app)

| Campo API | Motivo del descarte |
|-----------|---------------------|
| `countries` | Irrelevante para contexto local uruguayo |
| `packaging` | No aporta valor para comparar precios |
| `origins` | Campo raramente completado en la API |
| `stores` | Chocaría con el sistema propio de comercios de la app |

### Cómo agregar un campo nuevo a la app

Cuando se decida implementar alguno de estos campos:
1. Agregar el campo al objeto `return` de `_mapearProducto()` en OpenFoodFactsService.js
2. Incluirlo en `autoCompletarFormulario()` en DialogoAgregarProducto.vue
3. Asegurar que `ProductosService.guardarProducto()` lo persiste
4. Mostrarlo en el componente correspondiente (InfoProducto.vue o donde aplique)

### Ejemplo de request optimizado (usando parámetro `fields`)

Para no recibir toda la respuesta (que puede ser muy grande), se puede usar:
```
GET https://world.openfoodfacts.org/api/v2/product/{codigo}?fields=product_name,brands,code,quantity,categories,image_url,nutrition_grades,allergens,labels
```

---

## DOCUMENTACIÓN OFICIAL
- Sitio: https://world.openfoodfacts.org
- API Docs: https://world.openfoodfacts.org/data
- GitHub: https://github.com/openfoodfacts
- Wiki: https://wiki.openfoodfacts.org
- API v2 Reference: https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/
- API CheatSheet: https://openfoodfacts.github.io/openfoodfacts-server/api/ref-cheatsheet/

**Última actualización:** 18 de Febrero 2026
