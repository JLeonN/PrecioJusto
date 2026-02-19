# PLAN DE TRABAJO - SECCIÓN MIS PRODUCTOS
Proyecto: Precio Justo
Fecha inicio: 18 de Febrero 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla las mejoras a la sección "MIS PRODUCTOS" de la aplicación Precio Justo.
Cubre correcciones de bugs existentes, nuevas funcionalidades de búsqueda y mejoras de UX
en el detalle/historial del producto.

Las fases están ordenadas para que cada una construya sobre la anterior:
primero se corrigen los problemas actuales, luego se agregan las funcionalidades nuevas.

### OBJETIVOS PRINCIPALES:
- Corregir el selector de comercio: mostrar top 3 agrupados, no todos individualmente
- Renombrar botón y verificar el flujo de "Agregar comercio rápido"
- Agregar categoría editable al producto (heredada de API, modificable por usuario)
- Crear buscador inteligente de productos (nombre, código de barras, marca)
- Mejorar la página de historial: título, foto más grande, funciones verificadas
- Asegurar que los cambios en comercios se reflejen en el historial de precios

### ESTADO ACTUAL (pre-plan):
- FormularioPrecio.vue: selector de comercio muestra TODOS al abrir (excesivo)
  - Usa `comerciosPorUso` (individuales), no `comerciosAgrupados` (cadenas unificadas)
  - 3 sucursales de Tata aparecen como 3 opciones separadas
  - El selector de direcciones solo muestra las de la sucursal elegida (no todas)
- Botón "Agregar nuevo comercio" → el diálogo ya dice "Agregar comercio rápido" (inconsistente)
- Campo `categoria` fue eliminado del formulario, pero la API de OpenFoodFacts ya lo devuelve
- MisProductosPage.vue: sin buscador
- DetalleProductoPage.vue: sin título de sección, foto pequeña, funciones a verificar
- Los precios guardan `comercioId` (referencia) + `comercio` (texto) — datos híbridos

### TECNOLOGÍAS:
- Vue.js 3 + Composition API
- Quasar Framework
- Pinia (productosStore, comerciosStore)
- Capacitor Storage
- Open Food Facts API
- Tabler Icons

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: SELECTOR DE COMERCIO AGRUPADO 🏪 [✅ COMPLETADA]

### Objetivo
Corregir el selector de comercio en FormularioPrecio.vue para que:
1. Al abrir sin escribir nada, muestre los **3 comercios (agrupados) más recientemente usados**
2. Use `comerciosAgrupados` para que cadenas como "Tata" aparezcan como una sola opción
3. Al seleccionar "Tata", el selector de direcciones muestre **todas las sucursales** de Tata

### Archivo a modificar
[x] src/components/Formularios/FormularioPrecio.vue

### Cambios en `filtrarComercios(val, update)`
[x] Cambiar la fuente de datos de `comerciosPorUso` a `comerciosAgrupados`
[x] Cuando `val === ''`: mostrar solo los 3 primeros de `comerciosAgrupados` (top 3 recientes)
[x] Cuando `val !== ''`: filtrar `comerciosAgrupados` por nombre (substring)
[x] `comerciosAgrupados` ya tiene formato agrupado con todas las sucursales dentro

### Cambios en el selector de direcciones
[x] El objeto seleccionado del dropdown es ahora un "grupo" con N sucursales
[x] `direccionesDisponibles` retorna las direcciones de **todas** las sucursales del grupo
      (el getter `comerciosAgrupados` ya combina todas las direcciones en `.direcciones[]`)
[x] Dirección auto-seleccionada: `grupo.direccionPrincipal` (la más reciente, ya calculada)

### Cambios en `alSeleccionarComercio(comercio)`
[x] Al seleccionar el grupo, se usa `resolverComercioId()` para obtener el branch correcto
[x] Auto-seleccionar la dirección principal del grupo (más recientemente usada)

### Cambios en `alSeleccionarDireccion(direccion)`
[x] Al cambiar la dirección manual, se re-calcula el `comercioId` al branch correspondiente

### Cambios en las opciones visuales del dropdown
[x] Mostrar nombre del grupo (ej: "Tata")
[x] En el caption: "3 sucursales" si es cadena, "1 dirección"/"N direcciones" si no
[x] Agregar helper `resolverComercioId(comercioOGrupo, idDireccion)` para resolver branch

### ⚠️ Punto delicado (resuelto)
`comerciosAgrupados.direcciones[]` combina todos los branches PERO no trae el `comercioId`
del branch padre. Se resuelve con `resolverComercioId()` que busca en `comerciosOriginales`.

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: BOTÓN "AGREGAR COMERCIO RÁPIDO" 🔧 [✅ COMPLETADA]

### Objetivo
- Renombrar el botón en FormularioPrecio.vue de "Agregar nuevo comercio" a "Agregar comercio rápido"
- Verificar que el flujo completo del diálogo funciona correctamente

### Archivos a modificar
[x] src/components/Formularios/FormularioPrecio.vue (label del botón — hecho en Fase 1)
[x] src/almacenamiento/servicios/ComerciosService.js (fix nombreCompleto)

### Verificaciones en DialogoAgregarComercioRapido.vue
[x] Diálogo se abre correctamente con datos pre-llenados del comercio escrito ✓
[x] `resultado.exito` y `resultado.validacion` coinciden con el store ✓
      El store retorna `{ exito: false, validacion }` (duplicado) o `{ exito: true, comercio }` (ok)
[x] Al guardar, el nuevo comercio aparece auto-seleccionado en el selector ✓
[x] La dirección ingresada se auto-selecciona también ✓
[x] Notificaciones de éxito y error correctas ✓

### Bug encontrado y corregido
[x] `ComerciosService.agregarComercio`: cuando `calle` es vacío (dirección opcional),
      `nombreCompleto` quedaba "NombreComercio - " (con " - " colgante) → corregido:
      si `calle` vacío → `nombreCompleto = nombre` (sin " - ")
[x] Además: `calle.trim()` fallaba si `calle` llegaba `undefined` → corregido con `?.trim()`

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: CATEGORÍA DEL PRODUCTO 🏷️ [✅ COMPLETADA]

### Objetivo
Agregar un campo `categoria` al producto que:
- Se hereda automáticamente de la API de OpenFoodFacts al agregar el producto
- Se puede editar desde la página de detalle (ver historial)
- Si no hay categoría, no mostrar nada (sin mensajes de error, campo vacío)

### 3.1 — Verificar que la API ya guarda la categoría
**Archivo:** src/almacenamiento/servicios/OpenFoodFactsService.js
[x] `_mapearProducto()` ya incluye `categoria: _extraerPrimeraCategoria(categorias)` ✓
[x] `autoCompletarFormulario()` en DialogoAgregarProducto.vue incluye `categoria` ✓
[x] `ProductosService.guardarProducto()` persiste el objeto completo — `categoria` se guarda ✓

### 3.2 — Editor de categoría en DetalleProductoPage
**Archivo:** src/components/DetalleProducto/InfoProducto.vue
[x] Campo categoría agregado debajo del código de barras
[x] Reutiliza `CampoEditable.vue` (existente en EditarComercio/) — texto + ícono lápiz → input
[x] Si `producto.categoria` existe: muestra el valor
[x] Si no existe: muestra texto tenue "Sin categoría" (via prop `sin-valor-texto`)
[x] Al guardar llama `productosStore.actualizarProducto(id, { categoria })` con notify de éxito/error

### 3.3 — Categorías sugeridas
[x] Campo de texto libre (sin lista fija) — el usuario escribe lo que quiera ✓

### ⚠️ Nota
No agregar el campo al formulario de crear producto. Solo editable desde el detalle.
La API lo puebla al crear, el usuario lo ajusta si quiere.

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: BUSCADOR INTELIGENTE DE PRODUCTOS 🔍 [PENDIENTE]

### Objetivo
Crear un componente `BuscadorProductos.vue` que muestre sugerencias dinámicas
al escribir 3+ caracteres, buscando por nombre (en cualquier orden), código de barras
y marca. Las sugerencias se ordenan por última interacción (más reciente primero).

### Archivo a crear
[ ] src/components/MisProductos/BuscadorProductos.vue

### Lógica del buscador
[ ] Activar sugerencias solo cuando el usuario escribe >= 3 caracteres
[ ] Mostrar máximo 3 sugerencias en una lista desplegable bajo el input
[ ] Ordenar sugerencias por `ultimaInteraccion` desc (requiere Fase 5)
[ ] Algoritmo de búsqueda por nombre: dividir término en palabras → verificar que cada palabra
      esté contenida en el nombre del producto (case insensitive, sin tildes)
      Ejemplo: "COLA" encuentra "Coca Cola" / "diet col" encuentra "Coca Cola Diet"
[ ] Búsqueda por código de barras: si el término es numérico, comparar contra `codigoBarras`
[ ] Búsqueda por marca: buscar el término en el campo `marca` del producto
[ ] Al seleccionar una sugerencia: emitir `@seleccionar` con el producto
[ ] Al presionar Enter sin seleccionar: emitir `@buscar` con el texto para filtrar la lista
[ ] Al limpiar: emitir `@limpiar`

### UX del componente
[ ] Ícono de búsqueda en prepend del input
[ ] Placeholder: "Buscar por nombre, marca o código..."
[ ] Chip pequeño en cada sugerencia indicando el tipo de coincidencia (nombre / código / marca)
[ ] Si no hay resultados con 3+ caracteres: mensaje "Sin coincidencias"
[ ] Cerrar sugerencias al hacer click afuera o al seleccionar

### Reutilización (diseño)
[ ] El componente recibe `productos` como prop (no accede al store directamente)
[ ] Emits: `@seleccionar`, `@buscar`, `@limpiar`
[ ] Usa clase CSS global `.buscador-centrado` del sistema de diseño

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: REGISTRAR ÚLTIMA INTERACCIÓN 🕐 [PENDIENTE]

### Objetivo
Para ordenar las sugerencias del buscador por "más recientemente usado",
necesitamos guardar cuándo fue la última vez que el usuario interactuó con cada producto.
Esta fase se implementa junto con o inmediatamente antes de la Fase 4.

### Archivos a modificar
[ ] src/almacenamiento/stores/productosStore.js
[ ] src/almacenamiento/servicios/ProductosService.js

### Lógica
[ ] Agregar acción `registrarInteraccion(productoId)` en productosStore:
      Actualiza `producto.ultimaInteraccion = new Date().toISOString()`
      Persiste el cambio con ProductosService
[ ] Agregar getter `productosPorInteraccion`:
      Ordena por `ultimaInteraccion` desc, fallback a `fechaActualizacion`
[ ] Llamar a `registrarInteraccion` en:
      - DetalleProductoPage.vue → `onMounted()` (usuario abrió el detalle)
      - DialogoAgregarPrecio.vue → después de guardar precio exitosamente

═══════════════════════════════════════════════════════════════

## 📋 FASE 6: INTEGRAR BUSCADOR EN MIS PRODUCTOS 🔌 [PENDIENTE]

### Objetivo
Agregar el buscador a MisProductosPage.vue para filtrar la lista de productos.

### Archivo a modificar
[ ] src/pages/MisProductosPage.vue

### Lógica
[ ] Importar y agregar `BuscadorProductos` debajo del header (igual que ComerciosPage)
[ ] Usar clase CSS `.buscador-centrado` del sistema de diseño (ya existe)
[ ] Manejar `@buscar`: filtrar `productosOrdenadosPorFecha` localmente con computed
[ ] Manejar `@seleccionar`: navegar a `/producto/:id` con `$router.push()`
[ ] Manejar `@limpiar`: volver a mostrar todos los productos
[ ] La búsqueda filtra en memoria (sin llamadas al store ni al servicio)

═══════════════════════════════════════════════════════════════

## 📋 FASE 7: MEJORAS EN DETALLE DEL PRODUCTO 🎨 [PENDIENTE]

### 7.1 — Título de sección "Historial de precios"
**Archivo:** src/pages/DetalleProductoPage.vue
[ ] Agregar un `<h6>` o encabezado de sección entre EstadisticasProducto y FiltrosHistorial
[ ] Texto: "Historial de precios"
[ ] Mantener consistencia visual con el resto de la página

### 7.2 — Foto del producto más grande
**Archivo:** src/components/DetalleProducto/InfoProducto.vue
[ ] En desktop: aumentar de 120px a 180px (columna del grid y clase `.info-imagen`)
[ ] En móvil: aumentar de 35vw a 45vw con máximo 180px
[ ] Ajustar el grid `grid-template-columns` para la columna más ancha
[ ] El placeholder (ícono bolsa) crece proporcionalmente al nuevo tamaño

### 7.3 — Verificar precio promedio
**Archivo:** src/components/DetalleProducto/EstadisticasProducto.vue
[ ] Confirmar que calcula promedio de TODOS los precios (no filtrados)
[ ] Confirmar que muestra valor sin decimales innecesarios
[ ] Verificar que no muestra 0 cuando hay precios cargados

### 7.4 — Verificar tendencia
**Archivo:** src/almacenamiento/servicios/ProductosService.js → `_calcularCamposAutomaticos()`
[ ] Revisar lógica de tendencia: compara precios últimos 30 días vs 30 días anteriores
[ ] Confirmar que `tendenciaGeneral` y `porcentajeTendencia` llegan correctos al componente
[ ] Verificar el chip en InfoProducto.vue y la card en EstadisticasProducto.vue

### 7.5 — Verificar conteo de comercios
**Archivo:** src/components/DetalleProducto/EstadisticasProducto.vue
[ ] La lógica usa `new Set(precios.map(p => p.comercio))` — verificar
[ ] Precios nuevos guardan `comercioId` (string ID) y precios legacy guardan solo texto
[ ] Si hay duplicados por mezcla de formatos, revisar y unificar el campo usado
[ ] Alternativa: usar `comercioId` cuando existe, `comercio` (texto) como fallback

═══════════════════════════════════════════════════════════════

## 📋 FASE 8: SINCRONIZACIÓN COMERCIOS → HISTORIAL 🔗 [PENDIENTE]

### Objetivo
Cuando el usuario edita el nombre de un comercio en la sección Comercios,
ese cambio debe verse reflejado en el historial de precios del producto.

### Diagnóstico previo (ANTES de escribir código)
[ ] Revisar qué campos guarda cada precio al agregarlo:
      `precio.comercioId` (string referencia) y `precio.comercio` (texto plano)
[ ] Revisar cómo `HistorialPrecios.vue` muestra el nombre del comercio:
      ¿usa `p.comercio` (texto)? ¿o resuelve desde `comerciosStore` con `comercioId`?
[ ] El diagnóstico determina la estrategia:

**Caso A: El historial muestra texto plano (`p.comercio` o `p.nombreCompleto`)**
[ ] Los nombres quedan "congelados" al momento de agregar el precio
[ ] Solución: en `comerciosStore.editarComercio()`, recorrer todos los productos
      y actualizar el campo `comercio`/`nombreCompleto` en cada precio que tenga ese `comercioId`
[ ] Esta operación puede ser costosa → mostrar loading

**Caso B: El historial resuelve el nombre desde el store usando `comercioId`**
[ ] Los cambios se reflejan automáticamente (el ID apunta al comercio actualizado)
[ ] No requiere ningún cambio adicional → solo confirmar que funciona

[ ] Implementar según el caso que corresponda al diagnóstico
[ ] Test manual: editar nombre de un comercio → abrir historial → confirmar que actualizó

═══════════════════════════════════════════════════════════════

## 📋 FASE 9: TESTING Y AJUSTES 🧪 [PENDIENTE]

### Testing Fase 1 (Selector de comercio)
[ ] Abrir el modal de agregar producto → solo 3 comercios recientes aparecen al inicio ✓
[ ] "Tata" aparece como 1 sola opción (no 3 sucursales separadas) ✓
[ ] Al seleccionar "Tata", el selector de direcciones muestra TODAS las sucursales ✓
[ ] Al escribir texto, filtra correctamente los comercios agrupados ✓

### Testing Fase 2 (Agregar comercio rápido)
[ ] Botón muestra "Agregar comercio rápido" ✓
[ ] Al escribir "Disco" en comercio y click en botón → diálogo se abre con "Disco" pre-llenado ✓
[ ] Al guardar → el nuevo comercio queda seleccionado automáticamente ✓
[ ] Si hay duplicado similar → muestra advertencia y cierra correctamente ✓

### Testing Fase 3 (Categoría)
[ ] Buscar producto por código de barras → categoría de la API se guarda ✓
[ ] Editar categoría desde el detalle → se guarda y persiste ✓
[ ] Si no tiene categoría → campo vacío o texto tenue, no rompe nada ✓

### Testing Fase 4-6 (Buscador)
[ ] "COLA" → sugiere "Coca Cola" ✓
[ ] "cola coca" → sugiere "Coca Cola Diet" ✓
[ ] Código de barras parcial → sugiere el producto ✓
[ ] Marca parcial → sugiere productos de esa marca ✓
[ ] Menos de 3 caracteres → no muestra sugerencias ✓
[ ] Seleccionar sugerencia → navega al detalle ✓
[ ] Limpiar → lista completa visible ✓
[ ] Orden de sugerencias: más reciente primero ✓

### Testing Fase 7 (Detalle)
[ ] Título "Historial de precios" visible ✓
[ ] Foto más grande en desktop y móvil ✓
[ ] Precio promedio correcto ✓
[ ] Tendencia refleja precios recientes ✓
[ ] Conteo de comercios sin duplicados ✓

### Testing responsivo
[ ] Móvil (xs) - 360px ✓
[ ] Tablet (sm) - 768px ✓
[ ] Desktop (md) - 1024px ✓

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- Orden lógico de implementación: Fase 1 → 2 → 3 (fixes/quick wins) → 4+5 → 6 → 7 → 8 → 9
- La Fase 5 puede implementarse junto con la Fase 4 (son dependientes)
- La Fase 8 SIEMPRE requiere el diagnóstico antes de escribir código
- No cambiar el sistema de diseño CSS (reutilizar clases existentes)
- No agregar categoría al formulario de crear producto, solo al detalle
- El buscador filtra en memoria (no hace peticiones al store/servicio)
- La categoría es texto libre (no lista predefinida en esta versión)

═══════════════════════════════════════════════════════════════

## PRÓXIMAS MEJORAS (POST-MVP) 🚀

[ ] Filtros avanzados en Mis Productos (por categoría, precio, comercio)
[ ] Ordenar la lista de productos (A-Z, más reciente, más barato)
[ ] Foto del producto desde la cámara
[ ] Lista fija de categorías con iconos
[ ] Compartir historial de precios
[ ] Exportar historial a CSV/PDF
[ ] Gráfico de evolución de precios en el historial

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 33% (3/9 fases completadas)

✅ Fase 1: Selector de comercio agrupado (fix)
✅ Fase 2: Botón "Agregar comercio rápido" (fix + verificación)
✅ Fase 3: Categoría del producto (nueva función)
⏳ Fase 4: Buscador inteligente de productos (nueva función)
⏳ Fase 5: Registrar última interacción (soporte para Fase 4)
⏳ Fase 6: Integrar buscador en Mis Productos
⏳ Fase 7: Mejoras en detalle del producto
⏳ Fase 8: Sincronización comercios → historial
⏳ Fase 9: Testing y ajustes

═══════════════════════════════════════════════════════════════

**CREADO:** 18 de Febrero 2026
**ÚLTIMA ACTUALIZACIÓN:** 18 de Febrero 2026
**ESTADO:** ⏳ EN PLANIFICACIÓN
