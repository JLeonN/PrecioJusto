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
