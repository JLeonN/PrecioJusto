# SISTEMA DE ALMACENAMIENTO - DOCUMENTACIÓN TÉCNICA

## PROPÓSITO
Sistema de almacenamiento modular basado en patrón Strategy que permite cambiar entre diferentes adaptadores sin modificar lógica de negocio. Diseñado para facilitar migración futura de almacenamiento local a Firestore.

## ARQUITECTURA DE 3 CAPAS

### CAPA 1: ADAPTADORES (Abstracción de Storage)
**Responsabilidad:** Interactuar con diferentes tipos de almacenamiento

**Archivos:**
- src/almacenamiento/adaptadores/LocalStorageAdapter.js
- src/almacenamiento/adaptadores/CapacitorAdapter.js
- src/almacenamiento/adaptadores/FirestoreAdapter.js (futuro)

### CAPA 2: SERVICIOS (Lógica de Negocio)
**Responsabilidad:** CRUD, validaciones, transformaciones, reglas de negocio

**Archivos:**
- src/almacenamiento/servicios/AlmacenamientoService.js (configuración central)
- src/almacenamiento/servicios/ProductosService.js
- src/almacenamiento/servicios/ComerciosService.js
- src/almacenamiento/servicios/ConfirmacionesService.js
- src/almacenamiento/servicios/PreferenciasService.js
- src/almacenamiento/servicios/OpenFoodFactsService.js

### CAPA 3: STORES (Estado Reactivo)
**Responsabilidad:** Estado global, sincronización con UI, Pinia

**Archivos:**
- src/almacenamiento/stores/productosStore.js
- src/almacenamiento/stores/comerciosStore.js
- src/almacenamiento/stores/confirmacionesStore.js
- src/almacenamiento/stores/preferenciasStore.js
- src/almacenamiento/stores/sesionEscaneoStore.js — Mesa de trabajo del flujo de escaneo; cada ítem tiene su propio `comercio: null`; persiste en Capacitor Storage via `adaptadorActual`

## ALMACENAMIENTO SERVICE (CEREBRO DEL SISTEMA)

### Archivo: AlmacenamientoService.js

**Propósito:** Configuración central que determina qué adaptador usar

**Variable clave:**
```javascript
const ADAPTADOR_ACTIVO = 'capacitor' // 'local' | 'capacitor' | 'firestore'
```

**Cambiar de adaptador:**
1. Modificar ADAPTADOR_ACTIVO en AlmacenamientoService.js
2. NO requiere cambios en servicios ni componentes
3. La app sigue funcionando igual con diferente almacenamiento

**Exportaciones:**
```javascript
export const adaptadorActual      // Instancia del adaptador activo
export const infoAdaptador        // Metadata del adaptador
export const logAdaptador()       // Función de debugging
```

**Mapa de adaptadores:**
```javascript
const adaptadores = {
  local: new LocalStorageAdapter(),
  capacitor: new CapacitorAdapter(),
  // firestore: new FirestoreAdapter(), // Futuro
}
```

**Info del adaptador:**
```javascript
{
  nombre: 'capacitor',
  tipo: 'CapacitorAdapter',
  soportaColaboracion: false,
  soportaTiempoReal: false
}
```

## ADAPTADOR: LOCAL STORAGE

### Archivo: LocalStorageAdapter.js

**Propósito:** Usar localStorage del navegador (testing/desarrollo web)

**Limitaciones:**
- Solo disponible en navegador (no SSR)
- Límite de ~5-10MB según navegador
- Datos se pierden al limpiar caché
- NO sincroniza entre dispositivos

**Métodos principales:**

#### guardar(clave, valor)
```javascript
await adaptador.guardar('producto_123', producto)
// Guarda en localStorage como JSON
// Retorna: boolean (true si éxito)
```

#### obtener(clave)
```javascript
const producto = await adaptador.obtener('producto_123')
// Retorna: Object | null
```

#### eliminar(clave)
```javascript
await adaptador.eliminar('producto_123')
// Retorna: boolean
```

#### listarTodo(prefijoBusqueda)
```javascript
const productos = await adaptador.listarTodo('producto_')
// Retorna: Array de {clave, valor}
```

#### buscarPorCampo(prefijo, campo, valorBuscado)
```javascript
const resultados = await adaptador.buscarPorCampo('producto_', 'nombre', 'Coca Cola')
// ⚠️ Ineficiente: carga TODO en memoria y filtra
// Retorna: Array de {clave, valor}
```

#### limpiarTodo()
```javascript
await adaptador.limpiarTodo()
// ⚠️ PELIGROSO: Elimina TODOS los datos de la app
// Solo para desarrollo/testing
```

#### obtenerEstadisticas()
```javascript
const stats = await adaptador.obtenerEstadisticas()
// Retorna: {totalRegistros, tamañoKB, espacioUsado}
```

**Manejo de errores:**
- QuotaExceededError: localStorage lleno
- JSON.parse error: datos corruptos
- Try/catch en todos los métodos

**Prefijo de claves:**
```javascript
this.prefijo = 'precio_justo_'
// Todas las claves: precio_justo_producto_123
```

## ADAPTADOR: CAPACITOR STORAGE

### Archivo: CapacitorAdapter.js

**Propósito:** Usar Capacitor Preferences (SQLite nativo en móvil)

**Dependencia:**
```javascript
import { Preferences } from '@capacitor/preferences'
```

**Características:**
- Almacena en SQLite nativo del dispositivo
- Datos persisten entre cierres de app
- Más rápido que localStorage en móvil
- Funciona offline por defecto
- Límite depende del espacio del dispositivo

**Limitaciones:**
- Solo almacenamiento local (no sincroniza)
- No soporta queries complejas (todo en memoria)
- Carga todo en memoria para filtrar/buscar

**Métodos principales:**

#### guardar(clave, valor)
```javascript
await Preferences.set({
  key: claveCompleta,
  value: valorSerializado
})
```

#### obtener(clave)
```javascript
const { value } = await Preferences.get({ key: claveCompleta })
// value puede ser null si no existe
```

#### eliminar(clave)
```javascript
await Preferences.remove({ key: claveCompleta })
```

#### listarTodo(prefijoBusqueda)
```javascript
const { keys } = await Preferences.keys()
// Filtra por prefijo
// Obtiene valor de cada clave con Preferences.get()
// Retorna array completo
```

**Estrategia híbrida (Futuro con Firestore):**
1. Guardar en Capacitor primero (instantáneo)
2. Sincronizar con Firestore en background
3. Marcar registros con timestamp de sincronización
4. Mostrar indicador "sincronizando..." si hay delay

## PRODUCTOS SERVICE

### Archivo: ProductosService.js

**Propósito:** CRUD y lógica de negocio de productos

**Constructor:**
```javascript
constructor() {
  this.adaptador = adaptadorActual
  this.prefijoProductos = 'producto_'
}
```

**Métodos principales:**

#### guardarProducto(producto)
- Valida datos básicos
- Genera ID si no existe (Date.now() + random)
- Agrega timestamps (fechaCreacion, fechaActualizacion)
- Calcula campos automáticos (precioMejor, tendencias, etc.)
- Retorna: producto guardado o null

#### obtenerProducto(id)
- Busca producto por ID
- Retorna: producto o null

#### obtenerTodos()
- Lista todos los productos
- Retorna: Array de productos

#### buscarPorNombre(termino)
- Busca productos que coincidan con término
- Búsqueda case-insensitive
- Retorna: Array de productos filtrados

#### buscarPorCodigoBarras(codigoBarras)
- Busca producto exacto por código de barras
- Usado para evitar duplicados
- Retorna: producto o null

#### agregarPrecio(productoId, precio)
- Agrega precio a producto existente
- Genera ID único para el precio
- Agrega timestamp
- Recalcula campos automáticos del producto
- Retorna: producto actualizado o null

#### actualizarProducto(id, datosNuevos)
- Actualiza campos del producto
- Merge de datos (mantiene lo no modificado)
- Actualiza fechaActualizacion
- Retorna: producto actualizado o null

#### eliminarProducto(id)
- Elimina producto por ID
- Retorna: boolean (true si éxito)

**Métodos privados (helpers):**

#### _generarId()
```javascript
return Date.now() + Math.random().toString(36).substring(2, 12)
// Ejemplo: "17688640000082zwcohe41y"
```

#### _validarProducto(producto)
- Valida que tenga nombre
- Valida que precios sean números positivos
- Retorna: array de errores (vacío si válido)

#### _calcularCamposAutomaticos(producto)
- Calcula precioMejor (precio más bajo)
- Calcula comercioMejor (comercio con precio más bajo)
- Calcula diferenciaPrecio (diferencia entre min y max)
- Calcula tendenciaGeneral
- Calcula estadísticas
- Retorna: producto con campos actualizados

## COMERCIOS SERVICE

### Archivo: ComerciosService.js

**Propósito:** CRUD y validación de duplicados de comercios

**Métodos principales:**

#### crear(comercio)
- Valida duplicados con buscarSimilares()
- Genera ID único
- Agrega timestamps
- Retorna: {exito, mensaje, comercio, similares}

#### buscarSimilares(nombre, direccion)
- Detecta nombres similares (Levenshtein distance < 3)
- Detecta direcciones cercanas (similitud > 80%)
- Retorna: Array de comercios similares

#### obtenerTodos()
- Lista todos los comercios
- Retorna: Array de comercios

#### obtenerPorId(id)
- Busca comercio por ID
- Retorna: comercio o null

#### actualizar(id, datos)
- Actualiza comercio existente
- Retorna: comercio actualizado o null

#### eliminar(id)
- Elimina comercio
- Retorna: boolean

**Algoritmo de similitud:**
- Levenshtein distance para nombres
- Comparación de tokens para direcciones
- Umbral configurable

## CONFIRMACIONES SERVICE

### Archivo: ConfirmacionesService.js

**Propósito:** Sistema de confirmaciones (upvotes) de precios

**Reglas:**
- Usuario solo puede confirmar 1 vez cada precio
- Solo se puede confirmar el precio MÁS RECIENTE de cada comercio
- Confirmaciones persisten en almacenamiento local

**Métodos principales:**

#### confirmarPrecio(usuarioId, productoId, precioId)
- Verifica que no haya confirmado antes
- Incrementa contador de confirmaciones del precio
- Registra confirmación del usuario
- Retorna: {exito, mensaje, producto, nuevasConfirmaciones}

#### usuarioConfirmoPrecio(usuarioId, precioId)
- Verifica si usuario ya confirmó este precio
- Retorna: boolean

#### registrarConfirmacionUsuario(usuarioId, precioId)
- Guarda confirmación en Set del usuario
- Persistencia: confirmaciones_{usuarioId}
- Estructura: {usuarioId, preciosConfirmados: [ids], fechaActualizacion}

#### cargarConfirmacionesUsuario(usuarioId)
- Carga Set de precios confirmados
- Retorna: Set<precioId>

#### eliminarConfirmacion(usuarioId, productoId, precioId)
- Decrementa contador de confirmaciones
- Elimina de Set del usuario
- Retorna: {exito, mensaje, producto}

#### obtenerEstadisticas(usuarioId)
- Total de confirmaciones del usuario
- Lista de precios confirmados
- Retorna: {totalConfirmaciones, preciosConfirmados}

#### limpiarConfirmacionesUsuario(usuarioId)
- Elimina TODAS las confirmaciones del usuario
- ⚠️ PELIGROSO: No hay vuelta atrás
- Retorna: boolean

**Usuario actual hardcodeado:**
```javascript
const usuarioActualId = 'user_actual_123' // Temporal
// 🔥 FIRESTORE: Vendrá de Firebase Auth
```

## PREFERENCIAS SERVICE

### Archivo: PreferenciasService.js

**Propósito:** Guardar configuraciones del usuario

**Clave única:**
```javascript
this.clavePreferencias = 'preferencias_usuario'
```

**Métodos principales:**

#### obtenerPreferencias()
- Retorna preferencias o valores por defecto
- Default: {moneda: 'UYU', unidad: 'unidad'}

#### guardarMoneda(moneda)
- Actualiza moneda preferida
- Opciones: 'UYU', 'USD', 'EUR', 'ARS', 'BRL'

#### guardarUnidad(unidad)
- Actualiza unidad preferida
- Opciones: 'unidad', 'litro', 'mililitro', 'kilo', 'gramo', 'metro', 'pack'

## PRODUCTOS STORE (PINIA)

### Archivo: productosStore.js

**Estado:**
```javascript
{
  productos: [],
  cargando: false,
  error: null
}
```

**Acciones:**

#### cargarProductos()
- Llama ProductosService.obtenerTodos()
- Actualiza estado con productos
- Maneja loading y errores

#### agregarProducto(producto)
- Llama ProductosService.guardarProducto()
- Agrega a array de productos
- Notificación Quasar

#### actualizarProducto(id, datos)
- Llama ProductosService.actualizarProducto()
- Actualiza en array local
- Notificación Quasar

#### eliminarProducto(id)
- Llama ProductosService.eliminarProducto()
- Elimina de array local
- Notificación Quasar

**Getters:**

#### productosOrdenados
- Productos ordenados alfabéticamente por nombre

#### obtenerProductoPorId(id)
- Busca producto en array por ID
- Retorna: producto o undefined

## COMERCIOS STORE (PINIA)

### Archivo: comerciosStore.js

**Estado:**
```javascript
{
  comercios: [],
  cargando: false,
  error: null
}
```

**Acciones:**
- cargarComercios()
- agregarComercio(comercio)
- actualizarComercio(id, datos)
- eliminarComercio(id)

**Getters:**
- comerciosPorUso: Ordenados por uso reciente
- totalComercios: Cantidad total
- totalDirecciones: Suma de direcciones
- comerciosPorTipo: Agrupados por tipo

## CONFIRMACIONES STORE (PINIA)

### Archivo: confirmacionesStore.js

**Estado:**
```javascript
{
  usuarioActualId: 'user_actual_123',
  preciosConfirmados: new Set(),
  cargando: false,
  error: null
}
```

**Acciones:**
- cargarConfirmaciones(): Carga Set de precios confirmados
- confirmarPrecio(productoId, precioId): Confirma un precio
- eliminarConfirmacion(productoId, precioId): Des-confirma
- obtenerEstadisticas(): Estadísticas del usuario
- limpiarTodasLasConfirmaciones(): Reset completo

**Getters:**
- totalConfirmaciones: Cantidad de precios confirmados
- precioEstaConfirmado(precioId): Verifica si precio está confirmado
- listaConfirmaciones: Array de IDs confirmados

## FLUJO COMPLETO DE GUARDADO

### Escenario: Guardar nuevo producto
```
1. Usuario completa DialogoAgregarProducto
2. Click en "Guardar"
3. DialogoAgregarProducto llama productosStore.agregarProducto()
4. Store llama ProductosService.guardarProducto()
5. Service valida datos
6. Service genera ID único
7. Service agrega timestamps
8. Service calcula campos automáticos
9. Service llama adaptadorActual.guardar()
10. Adaptador guarda en Capacitor Storage
11. Service retorna producto guardado
12. Store agrega a array local
13. Store emite notificación Quasar
14. UI se actualiza reactivamente
```

## MIGRACIÓN A FIRESTORE (FUTURO)

### Preparación actual
- ✅ Todos los servicios usan adaptadorActual (abstracción completa)
- ✅ Lógica de negocio NO depende de características específicas de storage
- ✅ Métodos tienen misma firma que tendrán en Firestore
- ✅ Datos estructurados para fácil migración

### Pasos para migrar:
1. Instalar Firebase SDK: `npm install firebase`
2. Crear FirestoreAdapter.js
3. Configurar Firebase en proyecto
4. Implementar autenticación (Firebase Auth)
5. Crear índices en Firestore Console
6. Configurar reglas de seguridad
7. Cambiar ADAPTADOR_ACTIVO a 'firestore'
8. ¡La app sigue funcionando!

### Estructura de colecciones recomendada:
```
/usuarios/{usuarioId}/productos/{productoId}
/productos_publicos/{productoId}
/comercios/{comercioId}
/precios/{precioId}
/confirmaciones/{confirmacionId}
```

### Índices necesarios:
- productos: (usuarioId, fechaCreacion)
- precios: (productoId, fecha DESC)
- precios: (comercio, fecha DESC)
- confirmaciones: (usuarioId, precioId)

### Ventajas de Firestore:
- Sincronización en tiempo real
- Queries eficientes con índices
- Escalabilidad ilimitada
- Colaboración entre usuarios
- Backup automático
- Reglas de seguridad granulares

### Estrategia híbrida (Firestore + Capacitor):
1. Guardar en Capacitor (caché local, instantáneo)
2. Sincronizar con Firestore (background)
3. App funciona 100% offline
4. Sincronización automática cuando hay internet
5. onSnapshot() para tiempo real

## LIMITACIONES ACTUALES

### LocalStorageAdapter:
- Límite de ~5-10MB
- Solo navegador web
- Datos se pierden al limpiar caché

### CapacitorAdapter:
- Solo almacenamiento local
- No sincroniza entre dispositivos
- No soporta queries complejas
- buscarPorCampo() ineficiente (carga todo en memoria)

### General:
- Usuario hardcodeado (no hay autenticación)
- Sin colaboración entre usuarios
- Sin tiempo real
- Sin backup automático

## DEBUGGING Y TESTING

### Logging del adaptador:
```javascript
import { logAdaptador, infoAdaptador } from './AlmacenamientoService'

logAdaptador()
// 🔧 Adaptador de almacenamiento activo: {nombre: 'capacitor', ...}

console.log(infoAdaptador)
// {nombre, tipo, soportaColaboracion, soportaTiempoReal}
```

### Obtener estadísticas:
```javascript
const stats = await adaptadorActual.obtenerEstadisticas()
// {totalRegistros, tamañoKB, espacioUsado}
```

### Limpiar todos los datos:
```javascript
await adaptadorActual.limpiarTodo()
// ⚠️ Solo para desarrollo/testing
```

## CONVENCIONES

### Prefijos de claves:
- Productos: `producto_`
- Comercios: `comercio_`
- Confirmaciones: `confirmaciones_`
- Preferencias: `preferencias_usuario`

### IDs generados:
```javascript
Date.now() + Math.random().toString(36).substring(2, 12)
// "17688640000082zwcohe41y" (string alfanumérico)
```

### Timestamps:
```javascript
new Date().toISOString()
// "2026-02-02T15:30:00.000Z" (ISO 8601)
```

### Estructura de precio:
```javascript
{
  id: string,
  comercio: string,
  nombreCompleto: "COMERCIO - Dirección",
  direccion: string,
  valor: number,
  moneda: string,
  fecha: string (ISO),
  confirmaciones: number,
  usuarioId: string
}
```

## NOTAS PARA IAS

### Este documento describe:
- Arquitectura completa del sistema de almacenamiento
- Patrón Strategy para cambiar adaptadores
- Todos los servicios y sus responsabilidades
- Todos los stores de Pinia
- Flujos completos de operaciones CRUD
- Preparación para migración a Firestore

### Orden de lectura recomendado:
1. Leer sección "Arquitectura de 3 Capas"
2. Entender AlmacenamientoService (cerebro del sistema)
3. Estudiar adaptadores (LocalStorage y Capacitor)
4. Revisar servicios (lógica de negocio)
5. Comprender stores (estado reactivo)
6. Analizar flujos completos

### Estado actual:
- Adaptador activo: Capacitor Storage
- Usuario hardcodeado: 'user_actual_123'
- Listo para migración a Firestore
- Sin autenticación implementada aún
