# FORMULARIO AGREGAR PRODUCTO - DOCUMENTACIÓN TÉCNICA

## COMPONENTES RELACIONADOS
- FormularioProducto.vue (datos del producto en /components/Formularios/)
- FormularioPrecio.vue (datos del precio en /components/Formularios/)
- DialogoAgregarProducto.vue (contenedor modal en /components/Formularios/Dialogos/)
- DialogoAgregarComercioRapido.vue (diálogo para comercio rápido en /components/Formularios/Dialogos/)

## ESCANEO UNITARIO EN FORMULARIO
DialogoAgregarProducto.vue integra directamente EscaneadorCodigo.vue para escanear un código desde el campo "Código de barras":
- `escanerUnitarioActivo = ref(false)` activa el overlay nativo
- Al detectar código: `escanerUnitarioActivo = false` → `await nextTick()` → `buscarPorCodigo(codigo)`
- El `nextTick()` es obligatorio en Capacitor/Android: el webview se restaura antes de abrir el diálogo de resultados
- El formulario permanece abierto durante todo el flujo (el overlay nativo lo tapa temporalmente)

## ESTRUCTURA DE DATOS

### PRODUCTO
- nombre, marca, codigoBarras, cantidad, unidad, imagen (null por defecto)
- fuenteDato: string | null — origen de los datos (ej: 'Open Food Facts', 'Open Library')
- fotoFuente: 'api' | 'usuario' | null — origen de la foto; 'api' si la API la proveyó, 'usuario' si el usuario la tomó/eligió, null si no hay foto o es producto legacy
- ❌ CAMPO ELIMINADO: categoria (ya no se usa)

### PRECIO
- comercio, direccion, valor, moneda
- comercioId, direccionId (IDs de comerciosStore)
- Se auto-construye nombreCompleto: "COMERCIO - Dirección"
- Se auto-agrega fecha, confirmaciones (0), usuarioId

## CONSTANTES
- Monedas: src/almacenamiento/constantes/Monedas.js
- Lista completa de monedas del mundo (20+ opciones)
- MONEDA_DEFAULT: 'UYU' (solo se usa como valor inicial del store, no en los componentes)

## PREFERENCIAS DE MONEDA Y UNIDAD (preferenciasStore)
Todos los selectores de moneda y unidad usan `preferenciasStore` (Pinia) como fuente única de verdad. El store se inicializa una sola vez en `MainLayout.vue` al arrancar la app.

**Comportamiento por componente:**
- `FormularioPrecio.vue`: init `moneda` desde el store; `alCambiarMoneda()` llama `preferenciasStore.guardarMoneda()`; `onMounted` ya no carga preferencias (solo carga comercios)
- `FormularioProducto.vue`: init `unidad` desde el store; `alCambiarUnidad()` llama `preferenciasStore.guardarUnidad()`; eliminado `onMounted` de preferencias
- `DialogoAgregarProducto.vue`: estado inicial `datosPrecio.moneda` y `datosProducto.unidad` vienen del store; `limpiarFormulario()` es ahora **síncrona** (usaba `await preferenciasService`)
- `DialogoAgregarPrecio.vue`: `monedaSeleccionada` init desde store; handler `alCambiarMoneda()` guarda en store; `cerrar()` resetea a `preferenciasStore.moneda` (no a `MONEDA_DEFAULT` hardcodeado)

## NUEVO FLUJO: AGREGAR COMERCIO RÁPIDO
1. Usuario escribe nombre comercio/dirección en selectores
2. Click en "Agregar comercio rápido" (debajo de selector dirección)
3. Abre DialogoAgregarComercioRapido con datos pre-llenados
4. Solo nombre obligatorio, dirección opcional
5. Se crea comercio con tipo "Otro" y datos mínimos
6. Auto-selecciona el comercio recién creado
7. Usuario continúa agregando precio

## MODOS DE VALIDACIÓN

### MODO LOCAL (default)
- Sin campos obligatorios
- Solo valida que cantidad/precio > 0 si se ingresan
- Ideal para uso personal

### MODO COMUNIDAD (futuro)
- Todos los campos obligatorios
- Validaciones estrictas
- Para compartir datos públicos

## VALIDACIONES IMPLEMENTADAS
- Nombre: requerido en modo comunidad
- Cantidad: > 0 si ingresada
- Precio: > 0 si ingresado
- Botón guardar deshabilitado si formulario inválido

## UNIDADES DISPONIBLES
unidad, litro, mililitro, kilo, gramo, metro, pack

## INTEGRACIÓN CON STORES
- productosStore.agregarProducto(): Guarda producto completo
- comerciosStore.agregarComercio(): Crea comercio rápido
- comerciosStore.registrarUso(): Registra uso de comercio/dirección
- Quasar Notify para feedback visual
- Botón flotante FAB en MisProductosPage para abrir diálogo

## COMPONENTES REUTILIZABLES
- DialogoAgregarComercioRapido.vue:
  - Props: modelValue, nombreInicial, direccionInicial
  - Eventos: @comercio-creado
  - Totalmente independiente y reutilizable

  ## FORMULARIO PRECIO - MEJORAS RECIENTES

### Selector de Comercio con Persistencia Visual
- `:display-value` con control de foco para evitar borrado de texto
- Refs separadas: `comercioEscrito` (guardado) y `textoTemporalComercio` (durante escritura)
- Eventos `@focus` y `@blur` gestionan visibilidad del texto
- Sin duplicación visual durante escritura

### Selector de Dirección Condicional
- Se habilita al escribir ≥1 caracter en nombre de comercio
- Hint dinámico según estado del comercio
- Misma lógica de persistencia visual que comercio

### Pre-llenado Automático de Modal
- `DialogoAgregarComercioRapido` recibe `nombreInicial` y `direccionInicial`
- Props pobladas desde refs `comercioEscrito` y `direccionEscrita`
- Usuario puede escribir comercio+dirección antes de abrir modal

### Implementación Técnica
- Computed properties: `textoVisibleComercio` y `textoVisibleDireccion`
- Flags de foco: `comercioTieneFoco` y `direccionTieneFoco`
- Display value = `undefined` durante foco (no interferir con q-select)
- Display value = texto guardado cuando no tiene foco

## FORMULARIO PRODUCTO — FOTO (FormularioProducto.vue)

### Fila compacta de foto
- Ubicada debajo del bloque Cantidad/Unidad
- Fila horizontal con icono + label "Foto" a la izquierda, miniatura + botón a la derecha
- `foto-miniatura`: 40×40px, `object-fit: cover`, `border-radius: 6px`
- Botón redondo discreto (flat, grey-6) abre `q-menu` con hasta 3 opciones:
  - "Tomar foto" (`v-if="esNativo"`)
  - "Desde galería"
  - "Borrar foto" (`v-if="datosInternos.imagen"`)
- Usa composable `useCamaraFoto`: `{ inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo }`
- `imagen` incluido en `datosInternos` y sincronizado vía `watch(props.modelValue)`
- Al cambiar foto: `emitirCambios()` propaga al padre (DialogoAgregarProducto)

## DIALOGO AGREGAR COMERCIO RÁPIDO — FOTO

### Comportamiento actual (funcional)
- Botón "Foto del local (opcional)" / "Cambiar foto" abre `q-menu` con opciones
- Sin foto: 2 opciones ("Tomar foto" si nativo, "Desde galería")
- Con foto: miniatura 64×48px + 3 opciones (agrega "Borrar foto" → `fotoTemporal = null`)
- Usa `useCamaraFoto`: `{ inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo }`
- `fotoTemporal` (ref local) se incluye en `construirDatos()` → guardado con el comercio

## ETAPAS DE DESARROLLO
✅ ETAPA 1: Formulario manual básico
✅ ETAPA 1.5: Integración con comercios
✅ ETAPA 2: APIs multi-fuente (completada) — BuscadorProductosService orquesta 7 APIs (ver Resumen6)
✅ ETAPA 3: Búsqueda inteligente local (buscador inline en MisProductosPage)
✅ ETAPA 4: Escaneo código de barras con cámara (completado — ver Resumen8Scanner.md para detalle completo)
  - EscaneadorCodigo.vue: overlay nativo (@capacitor-mlkit/barcode-scanning), fallback web; prop `continuo` para Ráfaga
  - TarjetaEscaneo.vue: tarjeta post-escaneo (Modo A); precio obligatorio, foto opcional, edición inline
  - MesaTrabajoPage.vue (ruta `/mesa-trabajo`): reemplaza el antiguo diálogo full-screen `MesaTrabajo.vue` / BandejaBorradores; página con ordenamiento, selección múltiple, envío parcial
  - Flujo orquestado desde MisProductosPage.vue con sesionEscaneoStore (comercio por ítem, no global)

## DIALOGO AGREGAR PRECIO (DialogoAgregarPrecio.vue)
Modal rápido para agregar precio a un producto ya existente. Accesible desde TarjetaProducto y DetalleProductoPage.

### Misma lógica que FormularioPrecio:
- Usa `comerciosAgrupados` (cadenas unificadas, NO lista plana)
- Top 3 más recientes sin texto, filtro completo al escribir
- Slot `#option` custom: "N sucursales" para cadenas, "N direcciones" para individuales
- `resolverComercioId()`: guarda el branch correcto al guardar en una cadena
- Focus tracking: `textoVisibleComercio` devuelve `undefined` al escribir → Quasar controla el input
- Al escribir: limpia `comercioSeleccionado` → permite cambiar sin borrar manualmente
- `clearable`: botón X explícito para limpiar selección
- Pre-selecciona último comercio usado + dirección más usada al abrir
- Botón "Agregar comercio rápido" + ícono `add_circle`
- Usa `useTecladoVirtual`: ajusta `max-height` del q-card dinámicamente cuando aparece el teclado virtual Android

## TECLADO VIRTUAL ANDROID EN DIALOGS (useTecladoVirtual.js)
Composable en `src/composables/useTecladoVirtual.js`. Resuelve el problema de que el teclado virtual tape inputs dentro de modales.

### Cómo funciona
- Escucha `window.visualViewport.resize` (se dispara cuando el teclado aparece/desaparece)
- Calcula `maxHeight = visualViewport.height - 24px`
- Retorna `estiloTarjeta` computed: `{ maxHeight: '...px', overflowY: 'auto' }`
- Al redimensionar, llama `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` en el elemento enfocado

### Uso en un dialog
```javascript
import { useTecladoVirtual } from '../../../composables/useTecladoVirtual.js'
const { estiloTarjeta } = useTecladoVirtual()
```
```vue
<q-card :style="estiloTarjeta">...</q-card>
```

### Aplicado en
- `DialogoAgregarPrecio.vue`
- `DialogoAgregarComercioRapido.vue`
- `DialogoAgregarSucursal.vue`
- `DialogoMotivoEliminacion.vue`
- `TarjetaEscaneo.vue` (bottom sheet)
## PRECIOS MAYORISTAS POR CANTIDAD
- `FormularioPrecio.vue`, `DialogoAgregarProducto.vue`, `DialogoAgregarPrecio.vue`, `TarjetaEscaneo.vue` y `TarjetaProductoBorrador.vue` integran el bloque reutilizable `BloqueEscalasCantidad.vue`.
- El texto visible unificado es `Activar precios mayoristas`.
- El precio base de 1 unidad se mantiene en el input principal; las escalas adicionales se cargan como `escalasPorCantidad`.
- Al activar el bloque se sugiere el primer escalón desde 3 unidades; el usuario puede agregar más filas, reordenadas automáticamente por cantidad mínima.
- Al desactivar, si hubo edición real, aparece una confirmación inline compacta para borrar las escalas; si no hubo cambios, no se pide confirmación.
- Los inputs numéricos usan controles propios para subir y bajar valores, con transición suave y sin usar los spinners nativos del navegador.
