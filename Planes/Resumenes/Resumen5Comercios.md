# SECCIÓN COMERCIOS - DOCUMENTACIÓN TÉCNICA

## PROPÓSITO
Sistema completo para gestión de comercios y sucursales que permite registrar tiendas con múltiples direcciones, validar duplicados, agrupar cadenas automáticamente, y seleccionar comercios al agregar precios a productos. Diseñado para evitar duplicados mediante validación inteligente de similitud y agrupación por nombre normalizado.

## COMPONENTES PRINCIPALES

### PÁGINAS
- ComerciosPage.vue (src/pages/)

### COMPONENTES DE UI
- ListaComercios.vue (src/components/Comercios/)
- TarjetaComercioYugioh.vue (src/components/Comercios/)

### FORMULARIOS
- FormularioComercio.vue (src/components/Formularios/)
- DialogoAgregarComercio.vue (src/components/Formularios/Dialogos/)
- DialogoCoincidencias.vue (src/components/Formularios/Dialogos/)
- DialogoDuplicadoExacto.vue (src/components/Formularios/Dialogos/) ← NUEVO
- DialogoMismaUbicacion.vue (src/components/Formularios/Dialogos/)
- DialogoMotivoEliminacion.vue (src/components/Formularios/Dialogos/)

### PÁGINA DE EDICIÓN
- EditarComercioPage.vue (src/pages/)
- SelectorSucursales.vue (src/components/EditarComercio/)
- CampoEditable.vue (src/components/EditarComercio/)
- EstadisticasComercio.vue (src/components/EditarComercio/)
- ListaProductosComercio.vue (src/components/EditarComercio/)
- DialogoAgregarSucursal.vue (src/components/Formularios/Dialogos/)

### COMPOSABLES
- useFechaRelativa.js (src/composables/) - formatearFechaRelativa, formatearUltimoUso, formatearFechaCorta

### COMPONENTES COMPARTIDOS
- BarraSeleccion.vue (src/components/Compartidos/)
- BarraAccionesSeleccion.vue (src/components/Compartidos/)

### SERVICIOS Y STORES
- ComerciosService.js (src/almacenamiento/servicios/)
- comerciosStore.js (src/almacenamiento/stores/)

## ESTRUCTURA DE DATOS DE COMERCIO

### Objeto Comercio Individual (Storage)
```javascript
{
  id: string,                    // ID único generado
  nombre: string,                // Nombre del comercio
  tipo: string,                  // Tipo de comercio (opcional)
  direcciones: [                 // Array de direcciones
    {
      id: string,
      calle: string,
      barrio: string,
      ciudad: string,
      nombreCompleto: string,    // "NOMBRE - Calle"
      fechaUltimoUso: string
    }
  ],
  foto: string | null,           // URL de la foto (futuro)
  fechaCreacion: string,         // ISO 8601
  fechaUltimoUso: string,        // ISO 8601
  cantidadUsos: number           // Contador de veces usado
}
```

### Objeto Comercio Agrupado (Computed en Store)
Generado por el getter `comerciosAgrupados`. Agrupa comercios con el mismo nombre normalizado en una sola entidad.
```javascript
{
  id: string,                    // ID del primer comercio del grupo
  nombre: string,                // Nombre del comercio/cadena
  tipo: string,                  // Tipo de comercio
  esCadena: boolean,             // true si tiene múltiples sucursales
  totalSucursales: number,       // Cantidad de sucursales
  direcciones: Array,            // Todas las direcciones de todas las sucursales
  direccionesTop3: Array,        // Top 3 direcciones más recientes
  direccionPrincipal: Object,    // Dirección más recientemente usada
  foto: string | null,           // Foto del comercio más reciente
  fechaUltimoUso: string,        // Fecha más reciente entre todas las sucursales
  cantidadUsos: number,          // Suma de usos de todas las sucursales
  comerciosOriginales: Array     // Referencias a comercios individuales originales
}
```

### Tipos de Comercio Disponibles
- Supermercado
- Almacén
- Mayorista
- Farmacia
- Kiosco
- Online
- Otro

## COMERCIOS PAGE (ComerciosPage.vue)

### Propósito
Página principal que muestra listado de comercios con funcionalidades de búsqueda, selección múltiple y eliminación.

### Estructura
```
┌─────────────────────────────────────┐
│  Barra de búsqueda                  │
├─────────────────────────────────────┤
│  BarraSeleccion (si modo activo)    │
├─────────────────────────────────────┤
│  ListaComercios                     │
│  - TarjetaComercio (múltiples)      │
├─────────────────────────────────────┤
│  FAB (Agregar comercio)             │
├─────────────────────────────────────┤
│  BarraAccionesSeleccion (bottom)    │
└─────────────────────────────────────┘
```

### Estados de la Página
- **Cargando:** Spinner mientras carga comercios
- **Vacío:** Mensaje "No hay comercios" + botón agregar
- **Con datos:** Lista de comercios visible
- **Error:** Banner rojo con mensaje de error

### Funcionalidades Implementadas
- ✅ Carga de comercios desde comerciosStore
- ✅ Búsqueda en tiempo real (nombre y tipo)
- ✅ Modo selección múltiple con long-press
- ✅ FAB para agregar nuevo comercio
- ✅ Integración con BarraSeleccion y BarraAccionesSeleccion
- ✅ Estados de carga, vacío y error

### Props y Computed
```javascript
// Computed
comerciosFiltrados: Filtra por término de búsqueda
totalComercios: Cantidad de comercios
```

### Eventos Manejados
- handleLongPress: Activa modo selección
- handleToggleSeleccion: Marca/desmarca comercio
- handleSeleccionarTodos: Selecciona todos visibles
- handleCancelarSeleccion: Sale del modo selección
- handleEliminarSeleccionados: Elimina comercios seleccionados

## LISTA COMERCIOS (ListaComercios.vue)

### Propósito
Componente contenedor que renderiza grid responsivo de TarjetaComercio

### Props
```javascript
{
  comercios: Array (required),
  modoSeleccion: Boolean,
  seleccionados: Set
}
```

### Eventos Emitidos
- 'long-press': Pasa evento de long-press al padre
- 'toggle-seleccion': Pasa toggle de selección al padre

### Sistema de Grilla Responsivo
- col-12: Móvil (1 tarjeta por fila)
- col-sm-6: Tablet pequeña (2 tarjetas por fila)
- col-md-4: Tablet/PC (3 tarjetas por fila)
- col-xl-3: PC grande (4 tarjetas por fila)
- Gutter: q-col-gutter-md (16px separación)

### Mensaje "No hay comercios"
- Muestra ícono IconBuilding grande
- Texto: "No hay comercios registrados"
- Solo visible si array está vacío

## TARJETA COMERCIO (TarjetaComercioYugioh.vue)

### Propósito
Tarjeta expandible que muestra información del comercio/cadena con lista de sucursales. Usa TarjetaBase.vue como componente base con sistema de slots genéricos.

### Props
```javascript
{
  comercio: Object (required),   // Acepta comercio individual o agrupado
  modoSeleccion: Boolean,
  seleccionado: Boolean
}
```

### Eventos Emitidos
- 'long-press': Long-press de 1 segundo
- 'toggle-seleccion': Toggle en modo selección
- 'editar': Botón editar presionado

### Estructura Visual

#### Estado Colapsado (default)
- Foto/placeholder (aspect ratio 16:9)
- Overlay con dirección principal (posicionada a la derecha, dentro de la imagen)
- Nombre del comercio (bold, 18px)
- Badge con tipo de comercio
- Estadísticas rápidas:
  - Cantidad de sucursales (no "direcciones")
  - Usos de sucursal actual + total si es cadena
  - Última vez usado (formato relativo)
- Ícono chevron-down (posicionado a la derecha)

#### Estado Expandido
- Todo lo del estado colapsado
- Sección "SUCURSALES" o "DIRECCIONES" (condicional según esCadena)
- Lista de top 3 direcciones más recientes
- Indicador "Y X sucursales más..." si hay más de 3
- Botón "Editar" (full width)
- Ícono chevron-up (posicionado al centro)

### Modo Selección
- Checkbox circular (esquina superior derecha)
- Overlay verde semi-transparente (15% opacity)
- Borde verde cuando está seleccionado
- Animación fade-in del checkbox (0.3s)

### Interacciones
- Click (modo normal): expande/colapsa
- Click (modo selección): marca/desmarca
- Long-press 1 segundo: activa modo selección + vibración
- Hover (PC): elevación con sombra
- Active: scale(0.98)

### Estilos Responsivos
- Móvil: Foto arriba, info abajo (vertical)
- Tablet/PC: Sin cambios significativos
- Foto: 100% ancho, aspect-ratio 16/9
- Padding: 16px consistente

### Formato de Fecha Relativa
```javascript
formatearFecha(fechaISO):
  - < 60 min: "Hace X minutos"
  - < 24 hrs: "Hace X horas"
  - < 7 días: "Hace X días"
  - < 4 semanas: "Hace X semanas"
  - > 4 semanas: "Hace X meses"
```

### Iconografía (Tabler Icons)
- IconBuilding: Placeholder foto (40px)
- IconMapPin: Ícono de dirección (16px)
- IconChevronDown/Up: Expandir/colapsar (20px)
- IconEdit: Botón editar (18px)
- IconCheck: Checkbox seleccionado

## FORMULARIO COMERCIO (FormularioComercio.vue)

### Propósito
Formulario para ingresar datos de nuevo comercio con validación en tiempo real

### Props
```javascript
{
  modelValue: Object // v-model con datos del comercio
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronización bidireccional

### Campos del Formulario

#### Nombre (obligatorio)
- Tipo: q-input
- Validación: requerido, mínimo 2 caracteres
- Placeholder: "Ej: Ta-Ta, Disco, Farmashop"

#### Tipo (opcional)
- Tipo: q-select
- Opciones: Supermercado, Almacén, Mayorista, Farmacia, Kiosco, Online, Otro
- Placeholder: "Tipo de comercio (opcional)"
- No tiene valor por defecto

#### Calle y número (obligatorio)
- Tipo: q-input
- Validación: requerido
- Placeholder: "Ej: Av. 18 de Julio 1234"
- @blur: emit('validar') para buscar direcciones similares

#### Barrio (opcional)
- Tipo: q-input
- Placeholder: "Ej: Centro, Pocitos"

#### Ciudad (opcional)
- Tipo: q-input
- Placeholder: "Ej: Montevideo"
- Default: "Montevideo"

#### Foto (placeholder - futuro)
- Botón deshabilitado con ícono cámara
- Tooltip: "Próximamente"
- Color: grey-5

### Validaciones en Tiempo Real
- Nombre: required, min 2 chars
- Calle: required
- Tipo: opcional (sin validación)
- Feedback visual con colores (rojo/verde)
- Mensajes de error debajo de inputs
- La validación de duplicados NO se dispara al escribir, solo al hacer click en "Guardar"

### Métodos Expuestos
- limpiarFormulario(): Reset todos los campos
- validarFormulario(): Verifica que campos requeridos estén completos

## DIÁLOGO AGREGAR COMERCIO (DialogoAgregarComercio.vue)

### Propósito
Modal que contiene FormularioComercio y maneja el flujo completo de guardado con validaciones

### Props
```javascript
{
  modelValue: Boolean // v-model para abrir/cerrar
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronizar estado del diálogo
- 'comercio-guardado': Emitido cuando se guarda exitosamente

### Flujo de Guardado Completo

#### 1. Usuario completa formulario
- Ingresa nombre, tipo (opcional), dirección
- Validaciones en tiempo real

#### 2. Al hacer click en "Guardar"
- DialogoAgregarComercio llama validarDuplicados()
- Usa `comerciosStore.comerciosAgrupados` como datos de referencia (evita duplicados en modal)

#### 3. Validación de Duplicados (3 niveles)
```javascript
async validarDuplicados() {
  const resultado = await ComerciosService.validarDuplicados(
    datosComercio.value,
    comerciosStore.comerciosAgrupados // Datos agrupados para evitar duplicados
  )

  if (resultado.esDuplicado) {
    if (resultado.nivel === 1) {
      // Duplicado exacto → DialogoDuplicadoExacto
    } else if (resultado.nivel === 2) {
      // Nombres similares → DialogoCoincidencias
    } else if (resultado.nivel === 3) {
      // Misma ubicación → DialogoMismaUbicacion
    }
  }
}
```

#### 4. Usuario decide
**Nivel 1 (Duplicado exacto):**
- DialogoDuplicadoExacto muestra confirmación
- Puede cancelar o forzar creación del duplicado

**Nivel 2 (Nombres similares):**
- DialogoCoincidencias muestra comercios similares
- Click en comercio: `agregarSucursal()` → crea nueva sucursal
- Click en "No, es nuevo": continúa con guardado normal

**Nivel 3 (Misma ubicación):**
- DialogoMismaUbicacion informa que hay comercios en la misma dirección
- Puede continuar o cancelar

#### 5. Guardar Comercio Nuevo
```javascript
async guardarComercio() {
  const comercio = {
    id: generarId(),
    nombre: datosComercio.nombre,
    tipo: datosComercio.tipo,
    direcciones: [
      {
        id: generarId(),
        calle: datosComercio.calle,
        barrio: datosComercio.barrio,
        ciudad: datosComercio.ciudad,
        nombreCompleto: `${nombre} - ${calle}`,
        fechaUltimoUso: new Date().toISOString()
      }
    ],
    foto: null,
    fechaCreacion: new Date().toISOString(),
    fechaUltimoUso: new Date().toISOString(),
    cantidadUsos: 0
  }
  
  comerciosStore.comercios.push(comercio)
  emit('comercio-guardado', comercio)
}
```

#### 6. Feedback Visual
- Notificación Quasar positiva
- Mensaje: "Comercio agregado como nuevo"
- Caption: nombre del comercio
- Duración: 2 segundos

#### 7. Cerrar y Limpiar
- Cerrar diálogo
- Limpiar formulario
- Reset validaciones

### Estados del Diálogo
- guardando: Boolean (loading spinner)
- formularioValido: Computed (habilita/deshabilita botón)
- dialogoCoincidenciasAbierto: Boolean
- dialogoMismaUbicacionAbierto: Boolean

### Responsive
- Móvil portrait: 350px-500px ancho
- Móvil landscape: 90vw ancho, 90vh alto
- Scroll automático si contenido > 60vh

## DIÁLOGO COINCIDENCIAS (DialogoCoincidencias.vue)

### Propósito
Mostrar comercios similares detectados y permitir al usuario agregar una nueva sucursal o crear un comercio nuevo

### Props
```javascript
{
  modelValue: Boolean,
  comerciosSimilares: Array,     // [{comercio, similitud}]
  nivelValidacion: String        // 'nombre' | 'direccion'
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronizar apertura
- 'agregar-sucursal': Usuario eligió comercio existente (crea nueva sucursal)
- 'continuar-nuevo': Usuario confirmó que es nuevo

### Estructura Visual

#### Header (fondo warning)
- Ícono warning grande
- Título: "Comercios similares encontrados"
- Botón cerrar (posición absoluta, top: 8px, right: 8px)

#### Texto informativo
- "¿Es una nueva sucursal de alguno de estos comercios?"

#### Lista de Comercios Similares
- Click en item: emit('agregar-sucursal', comercio) → crea nueva sucursal
- Ripple effect al tocar

#### Acciones
- Botón: "No, es nuevo" (primary, flat) → emit('continuar-nuevo')
- El diálogo NO es persistent (se puede cerrar con click afuera o botón X)

## DIÁLOGO DUPLICADO EXACTO (DialogoDuplicadoExacto.vue)

### Propósito
Confirmación cuando el usuario intenta agregar un comercio con nombre y dirección idénticos a uno existente

### Props
```javascript
{
  modelValue: Boolean,
  comercioExistente: Object,     // Comercio que ya existe
  datosNuevos: Object            // Datos que el usuario intenta agregar
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronizar apertura
- 'continuar': Usuario confirma crear duplicado
- 'cancelar': Usuario cancela

### Estructura Visual
- Header con ícono warning naranja + "Comercio Duplicado"
- Muestra nombre y dirección del comercio existente
- Pregunta de confirmación
- Botones: "Cancelar" (flat) y "Sí, crear duplicado" (naranja)

### Algoritmo de Similitud (desde ComerciosService)
- Levenshtein distance < 3: Similar
- Comparación de tokens en dirección > 80%: Misma ubicación
- Retorna array con comercio + porcentaje de similitud

## DIÁLOGO MISMA UBICACIÓN (DialogoMismaUbicacion.vue)

### Propósito
Informar al usuario que ya existen comercios en la misma dirección (puede ser mismo edificio)

### Props
```javascript
{
  modelValue: Boolean,
  comerciosUbicacion: Array      // Comercios en misma ubicación
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronizar apertura
- 'confirmar': Usuario confirmó agregar de todas formas
- 'cancelar': Usuario canceló

### Estructura Visual

#### Header (fondo info)
- Ícono location_on grande
- Título: "Comercios en esta ubicación"
- Subtítulo: "Ya hay comercios en esta dirección"

#### Explicación
- Texto: "Ya existen comercios registrados en esta dirección o muy cerca:"

#### Lista de Comercios
- Nombre, tipo
- Lista de direcciones con ícono location

#### Explicación Adicional
- Banner gris con ícono help_outline
- Pregunta: "¿Por qué veo esto?"
- Respuesta: Puede ser mismo edificio/galería
- Instrucción: Si estás seguro, puedes continuar

#### Acciones
- Botón: "Sí, agregar de todas formas" (primary)
- Botón: "Cancelar" (grey, flat)

## DIÁLOGO MOTIVO ELIMINACIÓN (DialogoMotivoEliminacion.vue)

### Propósito
Solicitar motivo de eliminación y advertir sobre productos afectados

### Props
```javascript
{
  modelValue: Boolean,
  cantidadProductosAfectados: Number
}
```

### Eventos Emitidos
- 'update:modelValue': Sincronizar apertura
- 'confirmar': Usuario confirmó eliminación con motivo
- 'cancelar': Usuario canceló

### Opciones de Motivo
1. **Cerró definitivamente**
   - Radio button
   - Acción: Marcar productos (mantener historial)

2. **Error / Duplicado**
   - Radio button
   - Acción: Reasignar a otro comercio

3. **Otro motivo**
   - Radio button
   - Campo de texto para especificar
   - Acción: Mantener precios con nombre original

### Advertencia de Productos
```
┌─────────────────────────────────────┐
│  ⚠️ ADVERTENCIA                     │
│                                     │
│  Este comercio tiene X productos    │
│  asociados. Al eliminarlo:          │
│                                     │
│  [según motivo seleccionado]        │
└─────────────────────────────────────┘
```

### Acciones
- Botón: "Confirmar eliminación" (negative)
- Botón: "Cancelar" (grey, flat)
- Botón eliminar deshabilitado si no seleccionó motivo

## COMERCIOS SERVICE (ComerciosService.js)

### Propósito
Lógica de negocio para CRUD de comercios, validación de duplicados y agrupación de cadenas

### Constructor
```javascript
constructor() {
  this.adaptador = adaptadorActual
  this.prefijoComercios = 'comercio_'
}
```

### Métodos Principales

#### crear(comercio)
```javascript
async crear(comercio) {
  // Validar duplicados
  const similares = await this.buscarSimilares(
    comercio.nombre,
    comercio.direcciones[0].calle
  )
  
  if (similares.length > 0) {
    return {
      exito: false,
      mensaje: 'Comercios similares encontrados',
      similares: similares
    }
  }
  
  // Generar ID
  comercio.id = generarId()
  
  // Guardar
  await this.adaptador.guardar(clave, comercio)
  
  return {
    exito: true,
    comercio: comercio
  }
}
```

#### buscarSimilares(nombre, direccion)
```javascript
async buscarSimilares(nombre, direccion) {
  const comercios = await this.obtenerTodos()
  const similares = []
  
  comercios.forEach(comercio => {
    // Similitud de nombre (Levenshtein)
    const distancia = levenshteinDistance(
      nombre.toLowerCase(),
      comercio.nombre.toLowerCase()
    )
    
    if (distancia < 3) {
      similares.push({
        comercio: comercio,
        similitud: calcularPorcentaje(distancia),
        razon: 'nombre'
      })
    }
    
    // Similitud de dirección
    comercio.direcciones.forEach(dir => {
      const similitudDir = compararDirecciones(
        direccion,
        dir.calle
      )
      
      if (similitudDir > 80) {
        similares.push({
          comercio: comercio,
          similitud: similitudDir,
          razon: 'direccion'
        })
      }
    })
  })
  
  return similares
}
```

#### obtenerTodos()
- Retorna array de todos los comercios
- Usa adaptador.listarTodo()

#### obtenerPorId(id)
- Busca comercio por ID
- Retorna comercio o null

#### actualizar(id, datos)
- Actualiza comercio existente
- Merge de datos
- Actualiza fechaUltimoUso

#### eliminar(id)
- Elimina comercio
- Retorna boolean

#### agregarDireccion(comercioId, direccion)
- Agrega nueva dirección a comercio
- Genera ID para dirección
- Construye nombreCompleto

#### eliminarDireccion(comercioId, direccionId)
- Elimina dirección específica
- Valida que no sea la última

#### editarDireccion(comercioId, direccionId, datosDireccion)
- Busca comercio y dirección
- Aplica cambios con Object.assign
- Recalcula nombreCompleto
- Persiste en storage

#### registrarUso(comercioId, direccionId)
- Incrementa cantidadUsos
- Actualiza fechaUltimoUso del comercio
- Actualiza fechaUltimoUso de la dirección

#### validarDuplicados(nuevoComercio, comerciosParaValidar?)
- Acepta segundo parámetro opcional con comercios para validar (evita queries innecesarias)
- Si no se pasa, usa `obtenerTodos()` internamente
- Retorna objeto con `esDuplicado`, `nivel`, `tipo`, `comercio/comercios`, `mensaje`
- 3 niveles de validación: exacto (1), similar (2), misma ubicación (3)

#### agruparPorCadena(comercios)
- Agrupa comercios por nombre normalizado
- Retorna array con comercios agrupados (`esCadena`, `sucursales`)

### Algoritmos de Validación

#### Levenshtein Distance
```javascript
function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i-1) == str1.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}
```

#### Comparar Direcciones
```javascript
function compararDirecciones(dir1, dir2) {
  // Normalizar
  const norm1 = normalizarTexto(dir1)
  const norm2 = normalizarTexto(dir2)
  
  // Tokenizar
  const tokens1 = norm1.split(' ')
  const tokens2 = norm2.split(' ')
  
  // Contar coincidencias
  let coincidencias = 0
  tokens1.forEach(token => {
    if (tokens2.includes(token)) {
      coincidencias++
    }
  })
  
  // Calcular porcentaje
  const total = Math.max(tokens1.length, tokens2.length)
  return (coincidencias / total) * 100
}
```

## COMERCIOS STORE (comerciosStore.js)

### Propósito
Estado global de comercios con Pinia

### Estado
```javascript
{
  comercios: [],
  cargando: false,
  error: null
}
```

### Acciones

#### cargarComercios()
```javascript
async cargarComercios() {
  this.cargando = true
  try {
    this.comercios = await ComerciosService.obtenerTodos()
  } catch (error) {
    this.error = error.message
  } finally {
    this.cargando = false
  }
}
```

#### agregarComercio(comercio)
- Llama ComerciosService.crear()
- Agrega a array local
- Notificación Quasar

#### actualizarComercio(id, datos)
- Llama ComerciosService.actualizar()
- Actualiza en array local
- Notificación Quasar

#### eliminarComercio(id)
- Llama ComerciosService.eliminar()
- Elimina de array local
- Notificación Quasar

#### agregarDireccion(comercioId, direccion)
- Llama ComerciosService.agregarDireccion()
- Actualiza comercio en array local

#### eliminarDireccion(comercioId, direccionId)
- Llama ComerciosService.eliminarDireccion()
- Actualiza comercio en array local

#### editarDireccion(comercioId, direccionId, datos)
- Llama ComerciosService.editarDireccion()
- Actualiza comercio en array local

#### registrarUso(comercioId, direccionId)
- Llama ComerciosService.registrarUso()
- Actualiza comercio en array local

### Getters

#### comerciosPorUso
```javascript
comerciosPorUso: (state) => {
  return [...state.comercios].sort((a, b) => {
    const fechaA = new Date(a.fechaUltimoUso || a.fechaCreacion)
    const fechaB = new Date(b.fechaUltimoUso || b.fechaCreacion)
    return fechaB - fechaA
  })
}
```

#### comerciosAgrupados (NUEVO - Sistema de Sucursales)
Agrupa comercios con el mismo nombre normalizado en una sola entidad. Usado por ComerciosPage para mostrar cadenas como una sola tarjeta y por la validación de duplicados.
```javascript
// Lógica resumida:
// 1. Agrupa por nombre normalizado (Map)
// 2. Marca esCadena: true si tiene múltiples comercios
// 3. Combina todas las direcciones
// 4. Calcula direccionesTop3 (las 3 más recientes)
// 5. Calcula direccionPrincipal (la más reciente)
// 6. Suma cantidadUsos de todas las sucursales
// 7. Ordena resultado por fechaUltimoUso descendente
```

#### totalComercios
- Retorna: state.comercios.length

#### totalDirecciones
```javascript
totalDirecciones: (state) => {
  return state.comercios.reduce((total, comercio) => {
    return total + (comercio.direcciones?.length || 0)
  }, 0)
}
```

#### comerciosPorTipo
```javascript
comerciosPorTipo: (state) => {
  const agrupados = {}
  state.comercios.forEach(comercio => {
    const tipo = comercio.tipo || 'Otro'
    if (!agrupados[tipo]) {
      agrupados[tipo] = []
    }
    agrupados[tipo].push(comercio)
  })
  return agrupados
}
```

## SELECCIÓN MÚLTIPLE

### Composable Reutilizado
- useSeleccionMultiple.js (src/composables/)
- Mismo composable usado en ProductosPage
- Lógica completa de selección múltiple

### Integración en ComerciosPage
```javascript
const {
  modoSeleccion,
  seleccionados,
  handleLongPress,
  handleToggleSeleccion,
  seleccionarTodos,
  cancelarSeleccion,
  limpiarSeleccion
} = useSeleccionMultiple()
```

### Barras de UI
- BarraSeleccion (sticky, debajo header)
- BarraAccionesSeleccion (fixed, bottom)
- Mismas usadas en ProductosPage

## INTEGRACIONES FUTURAS

### Fase 5: Integración con Precios (Pendiente)
**Modificar FormularioPrecio.vue:**
- Reemplazar q-input comercio por q-select
- Cargar comercios desde comerciosStore
- Ordenar por últimos usados
- Opción "➕ Agregar nuevo comercio"
- Autocompletado de dirección según comercio
- Registrar uso al guardar precio

### Fase 6: Eliminación Múltiple (Pendiente)
- Validar productos asociados
- DialogoMotivoEliminacion
- Opciones según motivo:
  - Cerró: Marcar productos
  - Duplicado: Reasignar
  - Otro: Mantener con nombre original

### Fase 7: Router y Navegación (En Progreso)
- Ruta /comercios configurada
- Link en MainLayout drawer

## FEATURES IMPLEMENTADAS

### ✅ Completadas
- CRUD completo de comercios
- Validación de duplicados (nombre + dirección) con 3 niveles
- Sistema de sucursales: agrupación automática de cadenas por nombre
- Getter `comerciosAgrupados` con dirección principal, top 3, contadores
- Diálogo de duplicado exacto con confirmación
- Diálogo de coincidencias con opción "agregar sucursal"
- Overlay de dirección principal dentro de la imagen (posición derecha)
- Tarjetas expandibles con sucursales (top 3 + indicador "más...")
- Botón expandir: derecha cuando cerrado, centro cuando abierto
- TarjetaBase con sistema de slots genéricos (#overlay-info)
- Tipo de comercio como campo opcional
- Formulario sin auto-validación (solo al guardar)
- Búsqueda en tiempo real con datos agrupados
- Modo selección múltiple
- Grid responsivo
- Formato de fechas relativo (composable reutilizable)
- Vibración háptica
- Componentes compartidos (barras)
- Página de edición de comercio (`/comercios/:nombre`)
- Edición inline de campos (nombre, categoría, dirección, barrio, ciudad)
- Selector de sucursales como mini-tarjetas (calle, barrio/ciudad, artículos por sucursal)
- Filtro de productos por sucursal seleccionada (precio.direccionId)
- Conteo de artículos por sucursal (articulosPorDireccion computed)
- Agregar sucursal desde página de edición
- Eliminar sucursal individual con confirmación
- Fusionar sucursales (transferir precios entre sucursales)
- Lista de productos asociados con último precio (filtrada por sucursal)
- Estadísticas del comercio (registro, último uso, último precio, productos, sucursales)
- Conteo de usos reales calculado desde productos (comerciosConUsosReales computed en ComerciosPage)

### ⏳ Pendientes
- Subir foto de comercio (cámara)
- Eliminación con motivo
- Geolocalización
- Mapa de comercios cercanos
- Compartir entre usuarios
- Sistema de reportes (cerrado)
- Verificación con badges

## PALETA DE COLORES

### Específicos de Comercios
- Warning (#FF9800): Alerta de duplicados
- Info (#31CCEC): Misma ubicación
- Primary (#1976D2): Acciones principales
- Negative (#C10015): Eliminación

## LIMITACIONES ACTUALES
- Foto es placeholder (botón deshabilitado)
- Sin geolocalización
- Sin validación de direcciones con API
- Levenshtein distance puede dar falsos positivos
- No hay base de datos precargada de comercios

## ROADMAP POST-MVP
1. Implementar plugin de cámara y fotos
2. Eliminación con validación de productos (motivo)
3. Geolocalización y mapa interactivo
4. Compartir comercios entre usuarios
5. Sistema de reportes y verificación comunitaria

## NOTAS PARA IAS

### Orden de lectura recomendado:
1. Estructura de datos de comercio
2. ComerciosPage y flujo principal
3. TarjetaComercio (UI base)
4. FormularioComercio (entrada de datos)
5. DialogoAgregarComercio (flujo completo)
6. DialogoCoincidencias (validación)
7. ComerciosService (lógica de negocio)
8. comerciosStore (estado global)

### Estado actual:
- Sistema de sucursales: 100% completado (mini-tarjetas, filtro por sucursal, artículos por sucursal)
- Página de edición de comercio: 100% completada (edición inline, fusión, estadísticas, filtro sucursal)
- Agrupación de cadenas: Implementado y testeado
- Integración con precios: Completada (FormularioPrecio Y DialogoAgregarPrecio usan comerciosAgrupados)
- Usos reales: ComerciosPage calcula cantidadUsos desde productos, no desde cantidadUsos del store
- Progreso general: ~95% completado

### Diferencias con Productos:
- Comercios tienen múltiples direcciones (sucursales)
- Validación de duplicados más compleja (3 niveles)
- Diálogos adicionales (coincidencias, duplicado exacto, ubicación)
- Agrupación automática por nombre normalizado (cadenas)
- No tiene "precios" asociados directamente
- Usado como referencia en productos
