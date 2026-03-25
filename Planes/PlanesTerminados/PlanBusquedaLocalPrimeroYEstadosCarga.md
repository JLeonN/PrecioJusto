# PLAN DE TRABAJO - BÚSQUEDA LOCAL PRIMERO Y ESTADOS DE CARGA

Proyecto: Precio Justo  
Fecha inicio: Marzo 2026  
Responsable: Leo + CH

**Relacionado con:** [Planes/PlanesFuturos/TareasPendientes.md](PlanesFuturos/TareasPendientes.md) — ítems dificultad 7/10 (local primero, APIs después) y 5/10 (indicadores de carga).

**Contexto en documentación:** [Planes/Resumenes/Resumen1General.md](Resumenes/Resumen1General.md), [Planes/Resumenes/Resumen6OpenFoodFacts.md](Resumenes/Resumen6OpenFoodFacts.md), [Planes/Resumenes/Resumen8Scanner.md](Resumenes/Resumen8Scanner.md).

═══════════════════════════════════════════════════════════════

## DESCRIPCIÓN DEL PLAN

Unificar el comportamiento de búsqueda de productos (por código de barras y por nombre) para que **siempre** se considere primero la base local del usuario y solo después las APIs externas, cuando los resultados locales no sean suficientes.

En paralelo, introducir **indicadores de carga coherentes** (botón, overlay o mensaje de fase) cuando haya llamadas lentas a red, evitando una UI que parezca congelada — especialmente en el tramo “consultando APIs” después del instante casi inmediato de la búsqueda local.

Estas dos tareas se ejecutan en un solo plan porque comparten el mismo flujo mental para el usuario: primero “tus datos”, luego “internet”.

### OBJETIVOS PRINCIPALES

- Política clara **local → API** en todos los puntos donde se “busca” un producto para autocompletar o listar resultados externos.
- Reducir llamadas innecesarias a APIs (cuota UPCitemdb, latencia, uso de datos).
- UX: el usuario ve **que la app está trabajando** y, cuando sea útil, **en qué fase** está (local vs red).

### DECISIONES DE PRODUCTO (MVP — ajustar si en testing surge mejor criterio)

**Por código de barras**

1. Consultar primero `ProductosService.buscarPorCodigoBarras` (o equivalente).
2. Si hay coincidencia local **y** se considera suficiente para precargar el formulario: **no** encadenar automáticamente el orquestador `BuscadorProductosService.buscarPorCodigo` en el mismo clic de “Buscar por código”.
3. Ofrecer acción explícita para enriquecer desde API cuando ya hay dato local (por ejemplo botón “Consultar en internet” / “Actualizar desde fuentes externas” en el diálogo de resultados o junto al flujo de búsqueda), sin duplicar la función “Restaurar desde API” de detalle si ya cubre el caso fuera del formulario agregar.
4. Si **no** hay producto local con ese código: llamar al orquestador como hoy.

**Por nombre (texto)**

1. Consultar primero la base local (`ProductosService.buscarPorNombre` o criterio alineado con el filtro de Mis Productos).
2. Si hay **al menos un** resultado local relevante: mostrarlos en el flujo de selección; **no** llamar automáticamente a Open Food Facts en ese mismo paso.
3. Botón explícito del estilo “Buscar en Open Food Facts” (o etiqueta acorde a la app) para ampliar cuando el usuario quiera catálogo externo.
4. Si **cero** resultados locales: llamar a la API de texto (hoy `OpenFoodFactsService.buscarPorTexto`) como fallback inmediato, con indicador de carga.

**Nota:** La orquestación multi-fuente por **texto** (Beauty, Pet, etc.) no está homogénea como en código de barras; el MVP del plan asume **OFF como única API de búsqueda por nombre** hasta definir servicios equivalentes por texto. Si se amplía, documentar en este plan y en Resumen6.

### TECNOLOGÍAS

- Vue 3 + Quasar (spinner, `q-inner-loading`, `notify`, botones `:loading`)
- `BuscadorProductosService.js`, `ProductosService.js`, `OpenFoodFactsService.js`
- Pinia: evitar reutilizar un único `cargando` global para acciones que no deben vaciar la lista principal

═══════════════════════════════════════════════════════════════

## INVENTARIO DE PUNTOS DE BÚSQUEDA (AUDITORÍA)

| Ubicación | Evento / flujo | Comportamiento actual (resumen) | Cambio esperado |
|-----------|----------------|----------------------------------|-----------------|
| `MisProductosPage.vue` | `_buscarProducto` (escaneo rápido / ráfaga) | Ya: local + API | Revisar UX de carga mientras API responde; asegurar que la política “no API si local suficiente” coincida con el resto de la app |
| `DialogoAgregarProducto.vue` | `buscarPorCodigo` | Solo API | Local primero + API condicional + carga + acción explícita API si ya hay local |
| `DialogoAgregarProducto.vue` | `buscarPorNombre` | Solo OFF | Local primero + OFF condicional o bajo botón explícito + carga |
| `InfoProducto.vue` | `restaurarDesdeApi` | Solo API (correcto para “restaurar”) | Sin cambio de política; puede servir de referencia de loading (`restaurandoApi`) |
| `MisProductosPage.vue` | `InputBusqueda` + `productosFiltrados` | Filtro en memoria | Sin API; no requiere cambio salvo futura “búsqueda ampliada” (fuera de MVP) |
| `productosStore.buscarProductos` | Store | Local + `cargando` global | Valuar flag separado o no usar este `cargando` para búsquedas que afecten solo un diálogo |
| `MesaTrabajoPage.vue` | Buscador de lista | Filtro local sobre items | Confirmar que no haya llamadas API ocultas (solo filtro) |

Durante la Fase 1, repetir un `grep`/`codebase_search` por `buscadorProductosService`, `openFoodFactsService.buscarPorTexto`, `buscarPorCodigo` para no dejar huecos.

═══════════════════════════════════════════════════════════════

## FASE 1: CAPA DE POLÍTICA Y CONTRATOS

**Objetivo:** Centralizar la lógica “local primero, API si hace falta” para que los componentes no dupliquen condiciones.

### 1.1 — Diseño de API (código)

- [x] Definir funciones claras (en `BuscadorProductosService.js` **o** módulo dedicado p.ej. `BusquedaProductosHibridaService.js`) — elegir un solo lugar documentado:
  - [x] `buscarPorCodigoConPolitica(codigo, opciones)` → devuelve estructura unificada: `{ origen: 'local' \| 'api' \| 'mixto', productoLocal, resultadoApi, itemsParaDialogo }` (ajustar forma al `DialogoResultadosBusqueda` existente).
  - [x] Comportamiento según decisiones de producto (MVP) arriba.

### 1.2 — Diseño de API (nombre)

- [x] `buscarPorNombreConPolitica(texto, opciones)` con:
  - [x] Paso local vía `ProductosService.buscarPorNombre` (o alineación con criterio de similitud si hace falta).
  - [x] Paso OFF solo cuando corresponda (cero locales, o usuario pidió ampliar).
  - [x] Límite razonable de resultados y normalización de campos para el diálogo de resultados.

### 1.3 — Documentación en código

- [x] Comentario breve en el servicio: política MVP + enlace a este plan.

### Testing (Fase 1)

- [x] Pruebas manuales desde consola o componente temporal: código existente solo local, código solo API, código inexistente en ambos.
- [x] Nombre con coincidencias locales, sin coincidencias, y “ampliar a OFF”.

═══════════════════════════════════════════════════════════════

## FASE 2: `DialogoAgregarProducto` Y FORMULARIO

**Objetivo:** Conectar la capa de política y mostrar loading sin romper `FormularioProducto` (callbacks `buscandoCodigo` / `buscandoNombre`).

### 2.1 — Buscar por código

- [x] Sustituir llamada directa solo-API por flujo híbrido.
- [x] Si resultado es solo local: abrir `DialogoResultadosBusqueda` con ítem(es) locales o autocompletar según UX acordada.
- [x] Botón o acción explícita para disparar cadena API si ya hay local.
- [x] `:loading` / estado visual mientras corre la parte de red.

### 2.2 — Buscar por nombre

- [x] Mismo patrón: resultados locales primero; OFF bajo reglas MVP.
- [x] Debounce opcional si en el futuro la búsqueda se dispara en vivo; si sigue siendo “al pulsar buscar”, documentar que no hace falta.

### 2.3 — `DialogoResultadosBusqueda`

- [x] Si hace falta: distinguir visualmente origen local vs API (caption discreto o sección) para evitar confusión.

### Testing (Fase 2)

- [x] Flujo completo agregar producto: código nuevo, código ya guardado, nombre con match local, nombre sin match (cae a OFF).

═══════════════════════════════════════════════════════════════

## FASE 3: ESCANEO EN `MisProductosPage` Y OTROS FLUJOS

**Objetivo:** Alinear política y feedback cuando la API tarda (ráfaga / rápido).

### 3.1 — `_buscarProducto` y `_buscarYAgregarRafaga`

- [x] Aplicar la misma regla “no llamar API si local suficiente” que en el diálogo (misma función de política si es posible).
- [x] Indicador no intrusivo mientras espera API (toast, overlay en `TarjetaEscaneo`, o estado en la tarjetita de aviso) — elegir una opción y unificar criterio con Fase 4.

### 3.2 — Mesa de trabajo / bandeja

- [x] Verificar si algún camino dispara búsqueda API al editar items; alinear con política o documentar excepción.

### Testing (Fase 3)

- [x] Ráfaga con código ya en base local: no debe disparar cadena API completa si MVP lo prohíbe.
- [x] Código desconocido localmente: sí API + loading perceptible.

═══════════════════════════════════════════════════════════════

## FASE 4: ESTADOS DE CARGA GLOBALES Y PINIA

**Objetivo:** Que `productosStore.cargando` no “apague” toda Mis Productos cuando solo un diálogo busca en red.

### 4.1 — Auditoría de usos de `cargando`

- [x] Listar quién lee `productosStore.cargando` en plantillas.
- [x] Introducir `buscandoEnApi` / `buscandoProductosExterno` a nivel store **o** estado local solo en páginas/diálogos — preferir la opción con menos acoplamiento.

### 4.2 — Patrón UX recomendado

- [x] Fase A (instantánea): sin spinner global; opcional texto “Buscando en tus productos…” solo si la local pudiera ser lenta (volumen grande).
- [x] Fase B (red): spinner en botón que disparó la acción o `q-inner-loading` en la card del diálogo.
- [x] Errores de red: mantener `notify` existente; no dejar el botón colgado en loading.

### Testing (Fase 4)

- [x] Con lista grande de productos, abrir diálogo agregar y buscar: la lista principal no debe parpadear en “Cargando productos…” salvo que sea carga inicial real.

═══════════════════════════════════════════════════════════════

## FASE 5: DOCUMENTACIÓN

- [x] Actualizar [Resumen1General.md](Resumenes/Resumen1General.md) (flujo de búsqueda / capa de servicios) si el contrato público cambia.
- [x] Actualizar [Resumen6OpenFoodFacts.md](Resumenes/Resumen6OpenFoodFacts.md) si la búsqueda por texto queda condicionada a botón explícito o orden local primero.
- [x] En [TareasPendientes.md](PlanesFuturos/TareasPendientes.md): tachar o eliminar los dos ítems cuando el plan esté implementado y testeado, o dejar referencia “ver PlanBusquedaLocalPrimeroYEstadosCarga” si queda trabajo menor.

═══════════════════════════════════════════════════════════════

## FASE TESTING

Checklist final de regresión y casos límite. Completar ítems durante ejecución del plan; documentar bugs en subsección al final (como en [Planes/PlanesTerminados/PlanTrabajoEscaneoProductos.md](PlanesTerminados/PlanTrabajoEscaneoProductos.md)).

### T.A — Política código de barras

- [x] Código presente solo en local: no se llama cadena API sin acción explícita del usuario (MVP).
- [x] Código ausente en local: se llama orquestador; resultado coherente con fuentes y `fuenteDato`.
- [x] Código ISBN 978/979: comportamiento alineado (libros) tras refactor.

### T.B — Política nombre

- [x] Texto con matches locales: se listan locales; OFF no se dispara solo en ese paso.
- [x] Texto sin matches locales: OFF se dispara con loading visible.
- [x] Usuario pide “buscar en OFF” con matches locales: resultados OFF se muestran sin perder claridad de origen.

### T.C — Carga y percepción

- [x] Ningún flujo deja la UI sin feedback >300 ms en operación de red típica.
- [x] Cancelar / cerrar diálogo durante búsqueda: sin errores en consola ni estados colgados.

### T.D — Red y errores

- [x] Sin conexión: mensaje claro; no crash; loading se apaga en `finally`.
- [x] Timeout / 404 API: mismo criterio.

### T.E — Condiciones de carrera

- [x] Doble clic rápido en “Buscar”: una sola respuesta efectiva o última gana sin duplicar diálogos incoherentes.

### T.F — Plataforma

- [x] Android (APK): UPCitemdb en cadena cuando corresponde.
- [x] Navegador dev: comportamiento documentado si UPC no aplica (CORS).

### T.G — Regresión

- [x] Guardar producto nuevo y existente desde diálogo sin regresiones.
- [x] “Restaurar desde API” en detalle sigue funcionando.

---

### Bugs encontrados durante el testing

_(Añadir filas durante la ejecución.)_

| ID | Descripción | Severidad | Fase / fix |

|----|-------------|-----------|------------|

| | | | |

═══════════════════════════════════════════════════════════════

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. Fase 1 (contratos y política en servicio)
2. Fase 4 en paralelo cauteloso (flags de carga) donde toque antes de tocar mucha UI
3. Fase 2 (DialogoAgregarProducto)
4. Fase 3 (MisProductos / escaneo)
5. Fase 5 (documentación + TareasPendientes)
6. **FASE TESTING** (checklist completo)

═══════════════════════════════════════════════════════════════

## ESTADO DEL PLAN

**ESTADO:** Implementado (Marzo 2026) — revisar **FASE TESTING** en dispositivo.

**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026 — `BusquedaProductosHibridaService`, `DialogoAgregarProducto`, `DialogoResultadosBusqueda`, escaneo en `MisProductosPage`, `productosStore.buscarProductos` sin togglear `cargando`, resúmenes y TareasPendientes actualizados.
