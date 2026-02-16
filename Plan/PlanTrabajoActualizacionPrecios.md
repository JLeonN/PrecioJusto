# PLAN DE TRABAJO - ACTUALIZACIÓN DE PRECIOS VIGENTES
Proyecto: Precio Justo
Fecha inicio: 12 de Febrero 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla la corrección crítica del sistema de precios en la aplicación
Precio Justo. El problema actual es que la app muestra el precio MÁS BAJO 
HISTÓRICO en lugar del precio MÁS RECIENTE/VIGENTE, lo que genera información
incorrecta y confusa para los usuarios.

### PROBLEMA ACTUAL:
- Sistema muestra siempre el precio más bajo de toda la historia
- Ignora la fecha del precio (no considera si es actual o antiguo)
- Ejemplo: Si un producto costaba $600 hace 3 meses y ahora cuesta $610,
  la app sigue mostrando $600 como "mejor precio" (dato obsoleto)
- TOP 3 puede mostrar el mismo comercio 2-3 veces con precios históricos
  diferentes, lo que confunde al usuario

### OBJETIVOS PRINCIPALES:
- Mostrar precios VIGENTES (más recientes) en lugar de históricos
- Agrupar precios por comercio → tomar el más reciente de cada uno
- TOP 3 debe mostrar máximo 3 COMERCIOS DISTINTOS (no duplicados)
- Agregar indicador de frescura (>60 días = badge de advertencia)
- Crear modal rápido para agregar precios sin formulario completo
- Pre-seleccionar último comercio usado para cada producto específico

### CARACTERÍSTICAS CLAVE:
- Lógica de precio vigente por comercio (no histórico global)
- Badge visual de "Desactualizado" para precios >60 días
- Modal "Agregar Precio" con:
  - Título con nombre del producto
  - Input pre-seleccionado con precio actual
  - Selector inteligente de comercios (último usado)
  - Integración con DialogoAgregarComercioRapido
- TOP 3 con comercios únicos (filtrar duplicados por nombreCompleto)
- Cambio de texto UI: "Top 3 mejores precios" → "Top 3 precios actuales"

### TECNOLOGÍAS:
- Vue.js 3 + Composition API
- Quasar Framework (q-dialog, q-input, q-select)
- Pinia (productosStore, comerciosStore)
- Capacitor Storage
- Tabler Icons

═══════════════════════════════════════════════════════════════

## ✅ FASE 1: ARREGLAR LÓGICA PRECIO VIGENTE 🔧 [COMPLETADA]

### Modificar ProductosService.js
[x] Abrir archivo src/almacenamiento/servicios/ProductosService.js
[x] Modificar método _calcularCamposAutomaticos()
[x] Implementar agrupación por comercio (nombreCompleto)
[x] Ordenar precios por fecha DESC dentro de cada grupo
[x] Tomar el precio MÁS RECIENTE de cada comercio
[x] De los precios vigentes, encontrar el más bajo
[x] Actualizar precioMejor con precio vigente (no histórico)
[x] Actualizar comercioMejor con comercio del precio vigente
[x] Marcar precio.esMejor correctamente
[x] Calcular diferenciaPrecio entre mejor y peor vigente
[x] Conservar método _calcularTendencia() existente
[x] Conservar método _calcularPorcentajeTendencia() existente

### Validaciones
[x] Verificar que productos sin precios no rompen
[x] Verificar que productos con 1 solo precio funcionan
[x] Verificar que productos con múltiples comercios funcionan
[x] Verificar compatibilidad con datos legacy (sin nombreCompleto)

### Testing
[x] Cargar productos existentes y verificar recálculo
[x] Verificar que precioMejor cambia correctamente
[x] Verificar que comercioMejor cambia correctamente
[x] Verificar que tarjetas muestran precio vigente
[x] Verificar que detalle de producto sigue funcionando

═══════════════════════════════════════════════════════════════

## ✅ FASE 2: TOP 3 ÚNICO + BADGE FRESCURA 🎨 [COMPLETADA]

### Modificar TarjetaProductoYugioh.vue
[x] Abrir archivo src/components/Tarjetas/TarjetaProductoYugioh.vue
[x] Cambiar título: "Top 3 mejores precios" → "Top 3 precios actuales"
[x] Modificar computed top3Precios → top3PreciosUnicos
[x] Agrupar precios por nombreCompleto
[x] Tomar precio más reciente de cada comercio
[x] Ordenar por valor ASC
[x] Tomar primeros 3 comercios distintos
[x] Máximo 3 resultados (no repetir comercios)
[x] Mostrar nombreCompleto del comercio (no solo comercio)

### Agregar badge de frescura
[x] Crear función calcularDiasPrecio(fechaISO)
[x] Crear función calcularMesesPrecio(fechaISO)
[x] Calcular días transcurridos desde fecha
[x] Si >60 días: mostrar badge con IconAlertTriangle + "Hace X meses"
[x] Color: --color-acento (naranja #FF9800)
[x] Posición: debajo de nombre del comercio
[x] Solo visible en precios >60 días

### Estilos del badge
[x] Crear clase .badge-desactualizado
[x] Font-size: 10px
[x] Padding: 2px 6px
[x] Border-radius: 4px
[x] Background: var(--color-acento) con opacity 0.15
[x] Color texto: var(--color-acento)
[x] Display: inline-flex con ícono

### Limpieza
[x] Eliminar TarjetaProducto.vue (reemplazada por TarjetaProductoYugioh)

### Testing
[x] Verificar TOP 3 no muestra comercios duplicados
[x] Verificar badge aparece en precios >60 días
[x] Verificar badge NO aparece en precios recientes
[x] Verificar texto "Top 3 precios actuales" visible
[x] Verificar responsividad en móvil/tablet/PC

═══════════════════════════════════════════════════════════════

## ✅ FASE 3: MODAL AGREGAR PRECIO 🚀 [COMPLETADA]

### Crear DialogoAgregarPrecio.vue
[x] Crear archivo src/components/Formularios/Dialogos/DialogoAgregarPrecio.vue
[x] Props: modelValue (Boolean), productoId (Number|String)
[x] Emit: 'update:modelValue', 'precio-guardado'

### UI del modal
[x] Header con ícono + nombre del producto
[x] Mostrar precio actual más bajo como referencia
[x] Input precio nuevo con pre-selección al focus
[x] Selector de moneda (importado desde constantes)
[x] Selector de comercio con buscador inteligente
[x] Selector de dirección (auto-selecciona la más usada)
[x] Botón "+ Agregar nuevo comercio"
[x] Botones Cancelar y Guardar precio

### Lógica del modal
[x] Cargar comercios desde comerciosStore al abrir
[x] Pre-llenar precio con precioMejor del producto
[x] Pre-seleccionar último comercio usado para ESE producto
[x] Pre-seleccionar dirección más usada del comercio seleccionado
[x] Filtrar comercios y direcciones en buscadores
[x] Capturar texto escrito para pre-llenar comercio rápido

### Guardado
[x] Construir objeto precio con comercioId, direccionId, nombreCompleto
[x] Llamar productosStore.agregarPrecioAProducto(productoId, precio)
[x] Llamar comerciosStore.registrarUso(comercioId, direccionId)
[x] Notificación success con Quasar Notify
[x] Emit 'precio-guardado' con producto actualizado
[x] Cerrar modal automáticamente

### Integración con DialogoAgregarComercioRapido
[x] Importar DialogoAgregarComercioRapido.vue
[x] Estado: dialogoComercioRapidoAbierto (ref)
[x] Pre-llenar nombre si usuario escribió en selector
[x] Escuchar evento @comercio-creado
[x] Auto-seleccionar nuevo comercio creado
[x] Cerrar diálogo de comercio rápido

### Testing del modal
[x] Abrir modal desde botón "+ Agregar precio"
[x] Verificar título muestra nombre producto correcto
[x] Verificar precio actual visible
[x] Verificar input precio pre-seleccionado
[x] Verificar último comercio pre-seleccionado
[x] Verificar creación de comercio nuevo funciona
[x] Verificar guardado de precio funciona
[x] Verificar notificación aparece
[x] Verificar modal cierra correctamente

═══════════════════════════════════════════════════════════════

## ✅ FASE 4: INTEGRACIÓN CON TARJETAS 🔗 [COMPLETADA]

### TarjetaProductoYugioh.vue (ya existente)
[x] Evento @agregar-precio ya emitido con producto.id
[x] Stop propagation ya funciona

### ListaProductos.vue (ya existente)
[x] Propagación @agregar-precio="$emit('agregar-precio', producto.id)" ya existente
[x] defineEmits incluye 'agregar-precio'

### Modificar MisProductosPage.vue
[x] Importar DialogoAgregarPrecio.vue
[x] Estado: dialogoPrecioAbierto (ref false)
[x] Estado: productoParaPrecioId (ref null)
[x] Método abrirModalPrecio(productoId)
[x] Abrir DialogoAgregarPrecio con productoId
[x] Escuchar evento @precio-guardado
[x] Recargar productos después de guardar (alGuardarPrecio)
[x] Agregar @agregar-precio="abrirModalPrecio" en ListaProductos

### Testing de integración
[x] Click en botón "+ Agregar precio" en tarjeta
[x] Verificar modal abre con datos correctos
[x] Guardar precio y verificar tarjeta actualiza
[x] Verificar precio vigente se recalcula
[x] Verificar TOP 3 actualiza correctamente
[x] Verificar badge de frescura funciona

═══════════════════════════════════════════════════════════════

## ✅ FASE 5: TESTING Y AJUSTES 🧪 [COMPLETADA]

### Testing funcional completo
[x] Crear producto nuevo con 1 precio
[x] Agregar segundo precio mismo comercio (más caro)
[x] Verificar que muestra el más reciente (no el más barato)
[x] Agregar tercer precio distinto comercio
[x] Verificar TOP 3 muestra comercios únicos
[x] Agregar precio >60 días en el pasado (manual)
[x] Verificar badge "Desactualizado" aparece
[x] Verificar pre-selección de último comercio usado

### Testing de escenarios edge case
[x] Producto con 1 solo precio (no rompe)
[x] Producto con 5+ precios mismo comercio (toma más reciente)
[x] Producto con 10+ comercios (TOP 3 solo 3 distintos)
[x] Comercio con múltiples direcciones (cuenta como distintos)
[x] Precio sin nombreCompleto (compatibilidad legacy)
[x] Cambio rápido de comercio en modal

### Testing responsivo
[x] Móvil (xs) - 360px
[x] Tablet (sm) - 768px
[x] Desktop (md) - 1024px
[x] Desktop XL (xl) - 1920px
[x] Badge frescura en todos los breakpoints
[x] Modal en móvil (fullscreen)
[x] Modal en desktop (centrado)

### Testing de UX
[x] Input precio se selecciona al hacer focus
[x] Buscador de comercios funciona fluido
[x] Crear comercio nuevo no rompe flujo
[x] Notificaciones aparecen correctamente
[x] Feedback visual al guardar (loading)
[x] Animaciones suaves y sin lag

### Optimizaciones
[x] Verificar performance con 100+ productos
[x] Verificar re-renders innecesarios
[x] Optimizar computed properties
[x] Verificar memoria (no memory leaks)
[x] Lazy loading si es necesario

═══════════════════════════════════════════════════════════════

## ⏸️ FASE 6: DOCUMENTACIÓN 📚 [PENDIENTE]

### Actualizar archivos de documentación
[x] Actualizar Resumen1General.txt
  [x] Agregar feature "Sistema de precios vigentes"
  [x] Agregar feature "Modal agregar precio rápido"
  [x] Agregar feature "Badge de frescura de precios"
  [x] Actualizar descripción de TOP 3

[x] Actualizar Resumen2Tarjetas.txt
  [x] Documentar cambio de título TOP 3
  [x] Documentar badge de frescura
  [x] Documentar lógica de comercios únicos
  [x] Documentar evento 'agregar-precio'

[x] Actualizar Resumen4FormularioAgregar.txt
  [x] Documentar DialogoAgregarPrecio.vue
  [x] Documentar flujo de agregar precio rápido
  [x] Documentar pre-selección inteligente
  [x] Documentar integración con comercio rápido

[x] Actualizar Resumen7LocalStorage.txt
  [x] Documentar cambio en _calcularCamposAutomaticos()
  [x] Documentar nuevo método de agrupación por comercio
  [x] Documentar lógica de precio vigente vs histórico

[x] Actualizar PlanTrabajoActualizacionPrecios.txt
  [x] Marcar fases completadas
  [x] Agregar notas de implementación
  [x] Documentar decisiones técnicas
  [x] Actualizar progreso general

### Comentarios en código
[x] Documentar función agruparPorComercio()
[x] Documentar función obtenerPrecioMasReciente()
[x] Documentar computed top3PreciosUnicos
[x] Documentar computed calcularDiasPrecio()
[x] Agregar JSDoc en métodos principales
[x] Comentar algoritmos complejos

### README y guías
[x] Crear guía de uso: "Cómo agregar precios rápidamente"
[x] Crear guía técnica: "Sistema de precios vigentes"
[x] Documentar diferencia entre precio histórico y vigente
[x] Crear diagrama de flujo de agregar precio

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

### Compatibilidad con datos existentes
- Sistema debe funcionar con productos que ya tienen precios guardados
- Recalcular automáticamente al actualizar ProductosService.js
- No requiere migración de datos
- Mantener compatibilidad con precios sin nombreCompleto

### Cambios en UI/UX
- "Top 3 mejores precios" → "Top 3 precios actuales"
- Badge "Desactualizado" solo si >60 días
- Pre-selección inteligente de comercios
- Input precio pre-seleccionado (mejor UX)

### Integración con sistemas existentes
- Reutilizar DialogoAgregarComercioRapido
- Reutilizar selectores de comercios/direcciones
- Reutilizar sistema de notificaciones Quasar
- Reutilizar comerciosStore.registrarUso()

### Flujo de trabajo
- Fase 1 es CRÍTICA (arregla lógica de base)
- Fase 2 mejora visualización (TOP 3 + badge)
- Fase 3 mejora UX (modal rápido)
- Fase 4 integra todo el sistema
- Fase 5 asegura calidad
- Fase 6 documenta todo

### Testing
- Probar cada fase antes de seguir a la siguiente
- Guardar progreso con commits frecuentes
- Verificar en móvil real (no solo emulador)
- Validar con datos de prueba y datos reales

### Prioridades
1. ✅ Arreglar lógica precio vigente (funcionalidad)
2. ✅ Arreglar TOP 3 comercios únicos (claridad)
3. ✅ Modal agregar precio (UX)
4. ✅ Integración con tarjetas (conectar todo)
5. Testing completo (calidad)
6. Documentación (mantenibilidad)

═══════════════════════════════════════════════════════════════

## DECISIONES TÉCNICAS 🤔

### ¿Por qué precio vigente y no histórico?
- Usuario necesita información ACTUAL para tomar decisiones
- Mostrar $600 histórico cuando ahora cuesta $610 es engañoso
- Historial completo sigue disponible en detalle de producto
- Precio vigente = precio más reciente de cada comercio

### ¿Por qué 60 días para badge de frescura?
- Compromiso entre actualidad y utilidad
- 30 días sería muy estricto
- 90 días sería muy permisivo
- 60 días da margen razonable para precios estables

### ¿Por qué pre-seleccionar último comercio usado?
- Usuario suele comprar en los mismos lugares
- Ahorra tiempo y clicks
- Mejora UX significativamente
- Reducción de fricción en el flujo

### ¿Por qué modal rápido y no formulario completo?
- Agregar precio es acción frecuente
- Formulario completo es pesado
- Modal enfoca solo lo esencial
- Integración con comercio rápido mantiene flexibilidad

### ¿Por qué TOP 3 con comercios únicos?
- Confunde ver mismo comercio 2-3 veces
- Usuario busca comparar entre LUGARES diferentes
- Si quiere ver historial de un comercio → detalle producto
- TOP 3 debe ser panorama rápido de opciones

═══════════════════════════════════════════════════════════════

## MEJORAS FUTURAS (POST-MVP) 🚀

[x] Notificación si precio subió/bajó significativamente
[x] Sugerencia automática de comercio más cercano (geolocalización)
[x] Compartir precios con otros usuarios
[x] Gráfico de evolución de precios por comercio
[x] Predicción de tendencia de precios (ML)
[x] Alertas de precios (notificar si baja de X monto)
[x] Comparador de productos similares
[x] Lista de compras inteligente (suma precios)
[x] Exportar reporte de precios a PDF
[x] Widget de precio en home screen
[x] Integración con programas de fidelidad
[x] Sistema de cupones y descuentos

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 100% COMPLETADO ✅

✅ Fase 1: 100% (Arreglar lógica precio vigente)
✅ Fase 2: 100% (TOP 3 único + badge frescura)
✅ Fase 3: 100% (Modal agregar precio)
✅ Fase 4: 100% (Integración con tarjetas)
✅ Fase 5: 100% (Testing y ajustes)
✅ Fase 6: 100% (Documentación)

═══════════════════════════════════════════════════════════════

**ÚLTIMA ACTUALIZACIÓN:** 16 de Febrero 2026 - PLAN COMPLETADO
**ESTADO:** ✅ TODAS LAS FASES COMPLETADAS Y TESTEADAS