# DETALLE DE PRODUCTO - DOCUMENTACIÓN TÉCNICA

## RUTA Y NAVEGACIÓN
- Ruta: /producto/:id
- Componente: DetalleProductoPage.vue
- Navegación: Desde TarjetaProducto botón "Ver historial completo"

## COMPONENTES RELACIONADOS
- DetalleProductoPage.vue (página contenedora en /pages/)
- InfoProducto.vue (cabecera)
- EstadisticasProducto.vue (métricas en cards)
- FiltrosHistorial.vue (filtros)
- HistorialPrecios.vue (contenedor y agrupador)
- ItemComercioHistorial.vue (comercio expandible)
- DialogoAgregarPrecio.vue (modal rápido para agregar precio, reutilizado vía composable)

## ESTRUCTURA DE DATOS AMPLIADA
Cada precio requiere:
- id, comercio, nombreCompleto, direccion, valor, fecha, confirmaciones, usuarioId
- nombreCompleto: "COMERCIO - Dirección completa" (identifica sucursal única)
- direccion: Texto descriptivo de ubicación

## SISTEMA DE CONFIRMACIONES
- Usuario solo puede confirmar 1 vez por precio
- Solo se puede confirmar el precio MÁS RECIENTE de cada comercio
- Persistencia: localStorage con clave por usuario
- Botón se deshabilita después de confirmar
- Formato guardado: Set de IDs de precios confirmados

## INDICADORES DE FRESCURA (COLORES AUTOMÁTICOS)
- Verde: < 7 días
- Amarillo: 7-21 días
- Naranja: 21-60 días
- Gris: > 60 días

## BADGES DE CONFIANZA (POR CONFIRMACIONES)
- 0: "Sin validar" (gris)
- 1-5: "Poco confirmado" (gris oscuro)
- 6-19: "Confirmado" (azul)
- 20+: "Muy confiable" (verde)

## TENDENCIAS POR COMERCIO
- Solo aparece si comercio tiene 2+ precios
- Cálculo: (Precio más reciente - Promedio histórico) / Promedio × 100
- Tipos: bajando (< -2%), subiendo (> +2%), estable
- Colores: verde (bajando), rojo (subiendo), gris (estable)

## FILTROS FUNCIONALES
### Por comercio:
- "Todos" o selección específica por nombreCompleto
### Por período:
- 7/30/90/365 días o historial completo
### Por orden:
- Precio menor/mayor: ordena por precio más reciente
- Más reciente/antiguo: ordena por fecha más reciente
- Confirmaciones: ordena por confirmaciones del precio más reciente

## AGRUPACIÓN Y ORDENAMIENTO
- Precios se agrupan por nombreCompleto
- Cada grupo muestra precio más reciente colapsado
- Expandir muestra historial completo ordenado por fecha DESC
- Ordenamiento global usa solo precio más reciente, no historial completo

## COMPORTAMIENTO EXPANDIBLE
- Click en tarjeta: expande/colapsa comercio
- Click en botón confirmar: NO cierra tarjeta (event.stop)
- Múltiples comercios pueden estar expandidos simultáneamente

## ESTADÍSTICAS GLOBALES
- Precio promedio: de todos los precios del producto
- Tendencia general: del producto completo
- Total comercios: sucursales únicas (por nombreCompleto)

## LIMITACIONES ACTUALES
- nombreCompleto es string libre (puede tener duplicados con escritura diferente)
- Sin validación de direcciones
- Sin geolocalización (planificado Fase 2)
- Sin base de datos de comercios precargados

## INTEGRACIÓN CON STORES

### CARGA DE PRODUCTO
- Obtiene producto desde productosStore.obtenerProductoPorId()
- ID desde URL: route.params.id (string, NO parseInt)
- Si no existe en store: muestra error "Producto no encontrado"

### CONFIRMACIONES
- Usuario hardcodeado: 'user_actual_123'
- confirmacionesStore.cargarConfirmaciones() al montar componente
- confirmacionesStore.confirmarPrecio(productoId, precioId)
- Validación local rápida antes de llamar servicio
- Feedback con Quasar Notify (success/warning/error)

### PERSISTENCIA
- Confirmaciones en Capacitor Storage: confirmaciones_{usuarioId}
- Estructura: { usuarioId, preciosConfirmados: [ids], fechaActualizacion }
- Producto actualizado automáticamente después de confirmar

### FLUJO CONFIRMACIÓN
1. Usuario hace click en "Confirmar"
2. Verificar si ya confirmó (local)
3. Llamar confirmacionesStore.confirmarPrecio()
4. Servicio incrementa contador en producto
5. Servicio registra confirmación del usuario
6. Store actualiza estado local
7. UI muestra notificación y actualiza contador

## AGREGAR PRECIO DESDE HISTORIAL
- Botón "Agregar precio" en InfoProducto.vue emite 'agregar-precio'
- FAB flotante (IconPlus) también disponible abajo a la derecha
- Ambos abren DialogoAgregarPrecio.vue mediante composable useDialogoAgregarPrecio
- Al guardar, se refresca el producto local y el store
- Mismo modal usado en MisProductosPage (cero duplicación de código)
- DialogoAgregarPrecio usa `comerciosAgrupados` (cadenas unificadas, top 3 recientes, clearable)

## MEJORAS RECIENTES (Fases 7–9)

### InfoProducto.vue — Marca editable
- Campo `marca` mostrado entre nombre y categoría, reutiliza `CampoEditable.vue` con `IconBuildingStore`
- Guarda con `productosStore.actualizarProducto(id, { marca })`

### InfoProducto.vue — Botón restaurar desde API
- Solo visible si el producto tiene `codigoBarras`
- Botón circular overlay en la esquina inferior izquierda de la imagen
- Usa `BuscadorProductosService` (orquestador multi-API, no solo OpenFoodFacts)
- Sobreescribe nombre/marca/categoría/imagen/`fuenteDato` con datos de la API
- Muestra loading spinner mientras consulta

### InfoProducto.vue — Atribución de fuente (fuenteDato)
- Texto pequeño discreto al pie del componente: `"Datos de Open Food Facts"`
- Solo visible si `producto.fuenteDato` tiene valor (no aparece en productos manuales)
- CSS: `font-size: 11px`, `color: #9e9e9e`, `text-align: center`

### InfoProducto.vue — Categoría editable
- Campo `categoria` mostrado debajo del código de barras
- Reutiliza `CampoEditable.vue` (texto + ícono lápiz → input inline)
- Si tiene categoría: muestra el valor; si no: texto tenue "Sin categoría"
- Al guardar llama `productosStore.actualizarProducto(id, { categoria })`
- La categoría viene auto-completada desde Open Food Facts API al agregar el producto

### InfoProducto.vue — Foto más grande
- Desktop: `grid-template-columns: 180px 1fr` (era 120px), altura 180px
- Móvil: `width: 45vw`, `max-width: 180px` (era 35vw / 140px)

### InfoProducto.vue — Gestión de fotos (useCamaraFoto)
- Usa composable `useCamaraFoto` (elimina imports locales de `@capacitor/camera`)
- Menú contextual `q-menu` con hasta 3 opciones:
  - "Tomar foto" (`v-if="esNativo"` — solo Android/iOS)
  - "Desde galería" (todas las plataformas, usa `input[type=file]`)
  - "Quitar foto" (`v-if="producto.imagen"` — solo si hay foto)
- `esNativo = Capacitor.isNativePlatform()` evaluado una vez al init (no reactivo)
- `abrirGaleria()` activa el `input[type=file]` oculto en el template
- Al seleccionar: llama `actualizarFoto(base64)` → guarda en `productosStore`

### DetalleProductoPage.vue — Título de sección
- Texto "Historial de precios" visible entre EstadisticasProducto y FiltrosHistorial

### DetalleProductoPage.vue — registrarInteraccion
- `onMounted()` llama `productosStore.registrarInteraccion(id)` → actualiza `ultimaInteraccion`
- Permite ordenar sugerencias del buscador por "más recientemente visitado"

### DetalleProductoPage.vue — Pie de atribución (PieAtribucion)
- Importa y renderiza `<PieAtribucion>` al final del scroll, después de `<HistorialPrecios>`
- `fuentesApiProducto`: si el producto tiene `fuenteDato` → `[{ api: fuenteDato, campos: ['nombre', 'marca', 'categoría', ('foto' si fotoFuente==='api')] }]`; si no → `[]`
- `fuentesUsuarioProducto`: si hay precios o foto de usuario → `[{ campos: ['precios'?, 'foto'?] }]`; si no hay ninguno → `[]`

### InfoProducto.vue — Campo fotoFuente
- Nuevo campo en productos: `fotoFuente: 'api' | 'usuario' | null`
- Al tomar foto o elegir desde galería → `actualizarProducto(id, { imagen, fotoFuente: 'usuario' })`
- Al restaurar desde API → `fotoFuente: 'api'` si API retorna imagen; si no, conserva valor anterior (`props.producto.fotoFuente ?? null`)
- Al quitar foto → `actualizarProducto(id, { imagen: null, fotoFuente: null })`
- Productos legacy sin `fotoFuente` → tratar como `null` (fallback seguro con `?? null`)

### InfoProducto.vue — Campo Cantidad/Unidad editable
- Fila editable entre Categoría y Código de barras, con mismo estilo visual que `CampoEditable`
- Modo lectura: ícono `IconRuler2` + texto formateado (ej: `500 g`, `2 L`, `1 u.`) + lápiz
- Modo edición: `q-input` tipo número (con `step` inteligente: 1 para unidades enteras, 0.01 para el resto) + `q-select` de 7 unidades
- Unidades disponibles: `unidad`, `litro`, `mililitro`, `kilo`, `gramo`, `metro`, `pack`
- Abreviaturas de display: `u.`, `L`, `ml`, `kg`, `g`, `m`, `pack`
- Guarda con `productosStore.actualizarProducto(id, { cantidad, unidad })`
- Enter guarda, Esc cancela

### InfoProducto.vue — Imagen clickeable (DialogoVerImagen)
- La `q-img` del producto tiene `@click="verFoto = true"` y cursor `zoom-in`
- Tooltip "Ver foto" al pasar el cursor
- Solo activo cuando el producto tiene imagen (no afecta al placeholder)
- Abre `DialogoVerImagen.vue` pasando `src`, `titulo` (nombre del producto) y `:editable="!!producto.imagen"` para permitir rotar/recortar y guardar la nueva imagen en el producto cuando ya hay foto

### DialogoVerImagen.vue — Visor de imagen reutilizable
- Ubicación: `src/components/Compartidos/DialogoVerImagen.vue`
- Props: `modelValue` (Boolean, v-model), `src` (String), `titulo` (String, opcional), `editable` (Boolean, default false) — si hay `src` y `editable`, el pie muestra botón "Editar" que abre `EditorImagen.vue`
- Evento `@guardar` — emite la imagen en base64 (JPEG) al guardar desde el editor; el padre persiste vía `productosStore.actualizarProducto`
- UI: fondo oscuro `#1a1a1a`, `border-radius: 16px`, sombra fuerte; safe area en botón cerrar y pie del visor (`var(--safe-area-top/bottom)`)
- Botón X flotante arriba a la derecha con `backdrop-filter: blur(4px)`
- Título opcional del producto en pie del modal (semitransparente)
- Animación `scale` al abrir/cerrar (`transition-show="scale"`)
- Cierra al hacer click fuera del modal
- Uso: `<DialogoVerImagen v-model="verFoto" :src="img" :titulo="nombre" :editable="condicion" @guardar="..." />` — en detalle, `condicion` es `!!producto.imagen`; en comercios, `!!direccionSeleccionada?.foto`

### ItemComercioHistorial.vue — Mejoras recientes
- **Foto del comercio:** Si la dirección tiene foto (almacenada en `direcciones[i].foto`), muestra un thumbnail cuadrado (44×44px, `border-radius: 8px`) con borde de color que indica la frescura del precio más reciente (verde/amarillo/naranja/gris). Si no hay foto, muestra el punto de color existente (`q-avatar`).
- **Solo nombre en el título:** El encabezado muestra `comercio.comercio` (solo el nombre), no `nombreCompleto`. La dirección ya aparece debajo en texto `caption`.
- **Navegación a EditarComercioPage:** Ícono `IconExternalLink` al lado del nombre. Al tocar, navega a `/comercios/:nombre` con query `?direccionId=` si hay sucursal, pre-seleccionando la sucursal correcta en la página de edición.
- **Resolución de foto:** Usa `grupoComercio` computed (búsqueda en `comerciosStore.comerciosAgrupados` por `comercioId`) → busca en `comerciosOriginales[i].direcciones` → retorna `dir.foto`.
