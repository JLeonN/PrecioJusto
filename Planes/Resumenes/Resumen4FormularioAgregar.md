# FORMULARIO AGREGAR PRODUCTO - DOCUMENTACIÓN TÉCNICA

## COMPONENTES RELACIONADOS
- FormularioProducto.vue (datos del producto en /components/Formularios/)
- FormularioPrecio.vue (datos del precio en /components/Formularios/)
- DialogoAgregarProducto.vue (contenedor modal en /components/Formularios/Dialogos/)
- DialogoAgregarComercioRapido.vue (diálogo para comercio rápido en /components/Formularios/Dialogos/)

## ESTRUCTURA DE DATOS

### PRODUCTO
- nombre, marca, codigoBarras, cantidad, unidad, imagen (null por defecto)
- fuenteDato: string | null — origen de los datos (ej: 'Open Food Facts', 'Open Library')
- ❌ CAMPO ELIMINADO: categoria (ya no se usa)

### PRECIO
- comercio, direccion, valor, moneda
- comercioId, direccionId (IDs de comerciosStore)
- Se auto-construye nombreCompleto: "COMERCIO - Dirección"
- Se auto-agrega fecha, confirmaciones (0), usuarioId

## CONSTANTES
- Monedas: src/almacenamiento/constantes/Monedas.js
- Lista completa de monedas del mundo (20+ opciones)
- MONEDA_DEFAULT: 'UYU'

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
✅ ETAPA 4: Escaneo código de barras con cámara (completado — Fases 1-10)
  - EscaneadorCodigo.vue: overlay nativo con @capacitor-mlkit/barcode-scanning, fallback web
  - FormularioEscaneo.vue: modo rápido (solo precio) o mínimo (precio + nombre)
  - BandejaBorradores.vue: bandeja persistente con edición, auto-fetch al reconectar
  - Flujo orquestado desde MisProductosPage.vue con sesionEscaneoStore

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
