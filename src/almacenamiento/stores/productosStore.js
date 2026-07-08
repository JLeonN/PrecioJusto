/**
 * 🏪 STORE DE PRODUCTOS (PINIA)
 *
 * Este store maneja el ESTADO GLOBAL de productos en la aplicación.
 * Usa Pinia con Composition API para máxima flexibilidad.
 *
 * 📌 RESPONSABILIDADES:
 * - Mantener lista de productos en memoria (reactiva)
 * - Exponer acciones para componentes Vue
 * - Llamar a ProductosService para persistencia
 * - Gestionar estado de carga y errores
 *
 * 🔥 MIGRACIÓN A FIRESTORE:
 * Cuando migres a Firestore, este store puede:
 * - Suscribirse a cambios en tiempo real (onSnapshot)
 * - Mantener caché local mientras sincroniza
 * - Mostrar indicadores de "sincronizando..."
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ESTADOS_SINCRONIZACION } from '../constantes/PreparacionFirebase.js'
import fotosLegacyCacheService from '../servicios/FotosLegacyCacheService.js'
import firestoreImagenesProductosService from '../servicios/FirestoreImagenesProductosService.js'
import firestorePreciosService from '../servicios/FirestorePreciosService.js'
import fuentePrincipalFirestoreService from '../servicios/FuentePrincipalFirestoreService.js'
import productosService from '../servicios/ProductosService.js'
import reconciliacionFirestoreLocalService from '../servicios/ReconciliacionFirestoreLocalService.js'
import sincronizacionIncrementalFirestoreService from '../servicios/SincronizacionIncrementalFirestoreService.js'
import { useUsuarioStore } from './UsuarioStore.js'

const TIEMPO_MINIMO_REFRESCO_FIRESTORE_MS = 3 * 60 * 1000
const TIEMPO_REFRESCO_PRECIOS_LISTA_MS = 10 * 60 * 1000
let primeraSincronizacionFirestore = true

export const useProductosStore = defineStore('productos', () => {
  // ========================================
  // 📊 ESTADO
  // ========================================

  /**
   * 📦 LISTA DE PRODUCTOS
   * Array reactivo con todos los productos del usuario
   */
  const productos = ref([])

  /**
   * ⏳ ESTADO DE CARGA
   * true mientras se cargan datos del almacenamiento
   */
  const cargando = ref(false)

  /**
   * ❌ ERROR
   * Mensaje de error si algo falla
   */
  const error = ref(null)

  /**
   * 🔄 SINCRONIZANDO (para Firestore)
   * true cuando hay datos pendientes de sincronizar con la nube
   *
   * 🔥 FIRESTORE: Útil para mostrar badge "X pendientes"
   */
  const sincronizando = ref(false)
  const errorSincronizacion = ref(null)
  const fuenteDatos = ref(
    fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.PRODUCTOS,
    ),
  )

  // ========================================
  // 🧮 COMPUTED (GETTERS)
  // ========================================

  /**
   * 🔢 TOTAL DE PRODUCTOS
   */
  const totalProductos = computed(() => productos.value.length)

  /**
   * 📋 PRODUCTOS ORDENADOS POR NOMBRE
   */
  const productosOrdenadosPorNombre = computed(() => {
    return [...productos.value].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
    )
  })

  /**
   * 📋 PRODUCTOS ORDENADOS POR ACTUALIZACIÓN
   */
  const productosOrdenadosPorFecha = computed(() => {
    return [...productos.value].sort(
      (a, b) => new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion),
    )
  })

  /**
   * 🔍 OBTENER PRODUCTO POR ID
   * @param {number} productoId - ID del producto
   */
  const obtenerProductoPorId = computed(() => {
    return (productoId) => {
      return productos.value.find((producto) => String(producto.id) === String(productoId))
    }
  })

  /**
   * ❓ TIENE PRODUCTOS
   */
  const tieneProductos = computed(() => productos.value.length > 0)

  // Productos ordenados por última interacción (para sugerencias del buscador)
  const productosPorInteraccion = computed(() => {
    return [...productos.value].sort((a, b) => {
      const fechaA = a.ultimaInteraccion || a.fechaActualizacion || 0
      const fechaB = b.ultimaInteraccion || b.fechaActualizacion || 0
      return new Date(fechaB) - new Date(fechaA)
    })
  })

  // ========================================
  // 🔄 ACCIONES (CARGAR DATOS)
  // ========================================

  /**
   * 📥 CARGAR TODOS LOS PRODUCTOS
   * Lee productos desde el almacenamiento y actualiza el estado
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const unsubscribe = db.collection('productos')
   *   .where('usuarioId', '==', currentUserId)
   *   .onSnapshot((snapshot) => {
   *     productos.value = snapshot.docs.map(doc => ({
   *       id: doc.id,
   *       ...doc.data()
   *     }))
   *   })
   */
  async function cargarProductos(opciones = {}) {
    cargando.value = true
    error.value = null

    try {
      console.log('📥 Cargando productos...')

      const usuarioStore = useUsuarioStore()
      await usuarioStore.esperarSesionLista()
      const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
      const datosLocales = await productosService.obtenerTodos()
      const productosLocalesBase = fuentePrincipalFirestoreService.fusionarProductosLocalFirestore(
        datosLocales,
        [],
      )
      const productosLocalesVisibles =
        await fotosLegacyCacheService.recuperarFotosProductos(productosLocalesBase)

      productos.value = productosLocalesVisibles
      if (productosLocalesVisibles.length > 0) {
        await productosService.guardarProductosEnCacheLocal(productosLocalesVisibles)
      }
      fuenteDatos.value = {
        ...fuentePrincipalFirestoreService.crearEstadoInicial(
          fuentePrincipalFirestoreService.DOMINIOS.PRODUCTOS,
        ),
        datos: productosLocalesVisibles,
        fechaActualizacion: new Date().toISOString(),
      }

      if (!fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) {
        console.log(`Productos cargados: ${productos.value.length}`)
        return
      }

      if (productosLocalesVisibles.length > 0) {
        cargando.value = false
        if (opciones.sincronizarFondo !== false) {
          void sincronizarProductosDesdeFirestore({
            datosLocales,
            forzar: consumirPrimeraSincronizacionFirestore(),
          })
        }
      } else {
        consumirPrimeraSincronizacionFirestore()
        await sincronizarProductosDesdeFirestore({ datosLocales, forzar: true })
      }

      console.log(`Productos cargados: ${productos.value.length}`)
    } catch (err) {
      console.error('❌ Error al cargar productos:', err)
      error.value = 'No se pudieron cargar los productos'
    } finally {
      cargando.value = false
    }
  }

  /**
   * 🔄 RECARGAR PRODUCTOS
   * Fuerza una recarga completa (útil para pull-to-refresh)
   */
  async function recargarProductos() {
    await cargarProductos({ sincronizarFondo: false })
    await sincronizarProductosDesdeFirestore({
      datosLocales: productos.value,
      forzar: true,
    })
  }

  async function sincronizarProductosDesdeFirestore({ datosLocales = [], forzar = false } = {}) {
    const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
    if (!fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) return

    if (!forzar && (await cacheFirestoreReciente(usuarioActual.id))) return

    sincronizando.value = true
    errorSincronizacion.value = null

    try {
      const resultado = await fuentePrincipalFirestoreService.cargarProductosFirestoreCrudos({
        usuarioId: usuarioActual.id,
      })

      fuenteDatos.value = resultado

      if (resultado.error || !Array.isArray(resultado.datos)) {
        errorSincronizacion.value = resultado.mensaje || 'No se pudo actualizar desde la nube.'
        return
      }

      const lecturaCompleta =
        sincronizacionIncrementalFirestoreService.puedeReconciliarBorrados(resultado)

      await sincronizacionIncrementalFirestoreService.limpiarSobrantesSiCorresponde({
        locales: datosLocales,
        remotos: resultado.datos,
        reconciliacionService: reconciliacionFirestoreLocalService,
        lecturaCompleta,
        limpiarEntidad: (producto) =>
          productosService.eliminarProductoLocalPorSincronizacion(producto),
      })
      const datosLocalesVigentes =
        sincronizacionIncrementalFirestoreService.obtenerLocalesVigentes({
          locales: datosLocales,
          remotos: resultado.datos,
          reconciliacionService: reconciliacionFirestoreLocalService,
          lecturaCompleta,
        })
      const productosFusionadosBase = fuentePrincipalFirestoreService.fusionarProductosLocalFirestore(
        datosLocalesVigentes,
        resultado.datos,
      )
      const productosFusionadosConFotosLocales =
        await fotosLegacyCacheService.recuperarFotosProductos(productosFusionadosBase)
      const productosFusionados =
        await hidratarImagenesProductosFirestore(productosFusionadosConFotosLocales)
      const productosEliminados = resultado.datos.filter((producto) => producto?.eliminado)

      productos.value = productosFusionados
      for (const producto of productosEliminados) {
        await productosService.eliminarProductoDeCacheLocal(producto.id)
      }
      await productosService.guardarProductosEnCacheLocal(productosFusionados)
      await productosService.guardarMetaCacheFirestore({
        usuarioId: usuarioActual.id,
        fechaUltimaSincronizacion: new Date().toISOString(),
        fechaUltimoIntento: new Date().toISOString(),
        cantidadRemota: resultado.datos.length,
        lecturaCompleta,
        versionCache: 1,
      })
    } catch (err) {
      console.error('Error al sincronizar productos desde Firestore:', err)
      errorSincronizacion.value = 'No se pudo actualizar desde la nube.'
    } finally {
      sincronizando.value = false
    }
  }

  async function cacheFirestoreReciente(usuarioId) {
    const meta = await productosService.obtenerMetaCacheFirestore()
    if (!meta || meta.usuarioId !== usuarioId || !meta.fechaUltimaSincronizacion) return false

    const fecha = new Date(meta.fechaUltimaSincronizacion).getTime()
    if (!Number.isFinite(fecha)) return false

    return Date.now() - fecha < TIEMPO_MINIMO_REFRESCO_FIRESTORE_MS
  }

  async function hidratarImagenesProductosFirestore(productosBase = []) {
    const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
    if (!fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) return productosBase

    const productosConImagenFirestore = productosBase.filter((producto) =>
      producto?.imagenFirestoreId ||
      producto?.fechaImagenFirestore ||
      producto?.imagenFirestoreEstado === ESTADOS_SINCRONIZACION.SINCRONIZADO,
    )

    if (productosConImagenFirestore.length === 0) return productosBase

    try {
      const imagenesPorProducto = await firestoreImagenesProductosService.obtenerImagenesProductos(
        productosConImagenFirestore.map((producto) => producto.id),
        { usuarioId: usuarioActual.id },
      )

      return productosBase.map((producto) => {
        const imagenRemota = imagenesPorProducto.get(String(producto.id))
        if (!imagenRemota?.imagenBase64) return producto

        return {
          ...producto,
          imagen: imagenRemota.imagenBase64,
          imagenFirestoreId: imagenRemota.id || producto.id,
          imagenFirestoreEstado: ESTADOS_SINCRONIZACION.SINCRONIZADO,
          imagenFirestorePesoBytes: imagenRemota.pesoBytes || producto.imagenFirestorePesoBytes || null,
          fechaImagenFirestore: imagenRemota.fechaActualizacion || producto.fechaImagenFirestore || null,
          fotoFuente: producto.fotoFuente || 'usuario',
          sincronizacionFoto: {
            estado: ESTADOS_SINCRONIZACION.SINCRONIZADO,
            fecha: imagenRemota.fechaActualizacion || new Date().toISOString(),
            mensaje: 'Foto cargada desde Firestore.',
          },
        }
      })
    } catch (err) {
      console.warn('No se pudieron hidratar imágenes de productos desde Firestore:', err)
      return productosBase
    }
  }

  function consumirPrimeraSincronizacionFirestore() {
    const debeForzar = primeraSincronizacionFirestore
    primeraSincronizacionFirestore = false
    return debeForzar
  }

  // ========================================
  // ➕ ACCIONES (CREAR/AGREGAR)
  // ========================================

  /**
   * ➕ AGREGAR PRODUCTO
   * @param {Object} nuevoProducto - Datos del producto
   * @returns {Promise<Object|null>} - Producto creado o null
   *
   * 🔥 FIRESTORE: Marcar como "pendiente de sincronizar" si está offline
   */
  async function agregarProducto(nuevoProducto) {
    cargando.value = true
    sincronizando.value = true
    error.value = null
    errorSincronizacion.value = null

    try {
      console.log('➕ Agregando producto:', nuevoProducto.nombre)

      const productoGuardado = await productosService.guardarProducto(nuevoProducto)

      if (productoGuardado) {
        registrarResultadoSincronizacion(productoGuardado)
        // Agregar al estado local
        productos.value.push(productoGuardado)
        console.log('✅ Producto agregado al store')
        return productoGuardado
      }

      error.value = 'No se pudo guardar el producto'
      return null
    } catch (err) {
      console.error('❌ Error al agregar producto:', err)
      error.value = 'Error al agregar producto'
      return null
    } finally {
      cargando.value = false
      sincronizando.value = false
    }
  }

  /**
   * 💰 AGREGAR PRECIO A PRODUCTO
   * @param {number} productoId - ID del producto
   * @param {Object} precio - Datos del precio
   * @returns {Promise<boolean>} - true si agregó exitosamente
   */
  async function agregarPrecioAProducto(productoId, precio) {
    cargando.value = true
    sincronizando.value = true
    error.value = null
    errorSincronizacion.value = null

    try {
      console.log(`💰 Agregando precio a producto ${productoId}`)

      const productoActual = productos.value.find((producto) => String(producto.id) === String(productoId))
      if (productoActual?.preciosCargados === false) {
        await cargarPreciosProductoDesdeFirestore(productoId)
      }

      const productoActualizado = await productosService.agregarPrecio(productoId, precio)

      if (productoActualizado) {
        registrarResultadoSincronizacion(productoActualizado)
        // Actualizar en el estado local
        const index = productos.value.findIndex((p) => p.id === productoId)
        if (index !== -1) {
          productos.value[index] = productoActualizado
        }

        console.log('✅ Precio agregado al producto')
        return true
      }

      error.value = 'No se pudo agregar el precio'
      return false
    } catch (err) {
      console.error('❌ Error al agregar precio:', err)
      error.value = 'Error al agregar precio'
      return false
    } finally {
      cargando.value = false
      sincronizando.value = false
    }
  }

  // ========================================
  // ✏️ ACCIONES (ACTUALIZAR)
  // ========================================

  /**
   * ✏️ ACTUALIZAR PRODUCTO
   * @param {number} productoId - ID del producto
   * @param {Object} datosActualizados - Datos a actualizar
   * @returns {Promise<boolean>} - true si actualizó exitosamente
   */
  async function actualizarProducto(productoId, datosActualizados) {
    cargando.value = true
    sincronizando.value = true
    error.value = null
    errorSincronizacion.value = null

    try {
      console.log(`✏️ Actualizando producto ${productoId}`)

      // Obtener producto actual
      const productoActual = productos.value.find((p) => p.id === productoId)
      if (!productoActual) {
        error.value = 'Producto no encontrado'
        return false
      }

      // Combinar datos
      const actualizaImagen = Object.prototype.hasOwnProperty.call(datosActualizados, 'imagen')
      const productoActualizado = {
        ...productoActual,
        ...datosActualizados,
      }
      if (actualizaImagen) {
        productoActualizado.sincronizarImagenFirestore = true
      }
      if (actualizaImagen && !datosActualizados.imagen) {
        productoActualizado.limpiarImagenFirestore = true
        productoActualizado.imagenFirestoreId = productoActual.imagenFirestoreId
        productoActualizado.imagenFirestoreEstado = productoActual.imagenFirestoreEstado
        productoActualizado.imagenFirestorePesoBytes = productoActual.imagenFirestorePesoBytes
        productoActualizado.fechaImagenFirestore = productoActual.fechaImagenFirestore
      }

      // Guardar
      const guardado = await productosService.guardarProducto(productoActualizado)

      if (guardado) {
        registrarResultadoSincronizacion(guardado)
        // Actualizar en estado local
        const index = productos.value.findIndex((p) => p.id === productoId)
        if (index !== -1) {
          productos.value[index] = guardado
        }

        console.log('✅ Producto actualizado en el store')
        return true
      }

      error.value = 'No se pudo actualizar el producto'
      return false
    } catch (err) {
      console.error('❌ Error al actualizar producto:', err)
      error.value = 'Error al actualizar producto'
      return false
    } finally {
      cargando.value = false
      sincronizando.value = false
    }
  }

  // ========================================
  // 🗑️ ACCIONES (ELIMINAR)
  // ========================================

  /**
   * 🗑️ ELIMINAR PRODUCTO
   * @param {number} productoId - ID del producto
   * @returns {Promise<boolean>} - true si eliminó exitosamente
   *
   * FIRESTORE: Borrado real del producto y sus precios.
   */
  async function eliminarProducto(productoId) {
    cargando.value = true
    error.value = null

    try {
      console.log(`🗑️ Eliminando producto ${productoId}`)

      const eliminado = await productosService.eliminarProducto(productoId)

      if (eliminado) {
        // Eliminar del estado local
        productos.value = productos.value.filter((p) => p.id !== productoId)
        console.log('✅ Producto eliminado del store')
        return true
      }

      error.value = 'No se pudo eliminar el producto'
      return false
    } catch (err) {
      console.error('❌ Error al eliminar producto:', err)
      error.value = 'Error al eliminar producto'
      return false
    } finally {
      cargando.value = false
    }
  }

  // ========================================
  // 🕐 ACCIONES (INTERACCIÓN)
  // ========================================

  // Registra que el usuario interactuó con el producto (para ordenar búsquedas)
  async function registrarInteraccion(productoId) {
    try {
      const productoActual = productos.value.find((p) => p.id === productoId)
      if (!productoActual) return
      const productoActualizado = { ...productoActual, ultimaInteraccion: new Date().toISOString() }
      const guardado = await productosService.guardarProducto(productoActualizado)
      if (guardado) {
        const index = productos.value.findIndex((p) => p.id === productoId)
        if (index !== -1) productos.value[index] = guardado
      }
    } catch (err) {
      console.error('❌ Error al registrar interacción:', err)
    }
  }

  // ========================================
  // 🔍 ACCIONES (BUSCAR)
  // ========================================

  /**
   * 🔍 BUSCAR PRODUCTOS POR NOMBRE
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} - Productos encontrados
   */
  async function buscarProductos(termino) {
    if (!termino || termino.trim() === '') {
      return productos.value
    }

    error.value = null

    try {
      console.log(`🔍 Buscando productos: "${termino}"`)

      const resultados = await productosService.buscarPorNombre(termino)
      return resultados
    } catch (err) {
      console.error('❌ Error al buscar productos:', err)
      error.value = 'Error en la búsqueda'
      return []
    }
  }

  async function cargarPreciosProductoDesdeFirestore(productoId) {
    const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
    if (!productoId || !fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) return null

    try {
      const precios = await firestorePreciosService.obtenerPreciosProducto(productoId)
      const indice = productos.value.findIndex((producto) => String(producto.id) === String(productoId))
      if (indice === -1) return null

      const productoActualizado = {
        ...productos.value[indice],
        precios,
        preciosCargados: true,
        fechaPreciosFirestore: new Date().toISOString(),
      }

      productos.value[indice] = productoActualizado
      await productosService.guardarProductoEnCacheLocal(productoActualizado)
      return productoActualizado
    } catch (err) {
      console.warn('No se pudieron cargar precios desde Firestore:', err)
      return null
    }
  }

  function debeHidratarPreciosProducto(producto, forzar = false) {
    if (!producto?.id) return false
    if (forzar) return true
    if (producto.preciosCargados !== true) return true
    if (!Array.isArray(producto.precios) || producto.precios.length === 0) return true

    const fechaPrecios = new Date(producto.fechaPreciosFirestore || 0).getTime()
    if (!Number.isFinite(fechaPrecios)) return true

    return Date.now() - fechaPrecios > TIEMPO_REFRESCO_PRECIOS_LISTA_MS
  }

  async function hidratarPreciosProductos(productoIds = [], opciones = {}) {
    const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
    if (!fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) {
      return {
        hidratados: 0,
        omitidos: productoIds.length,
      }
    }

    const idsUnicos = [...new Set(productoIds.map((id) => String(id || '').trim()).filter(Boolean))]
    const idsNecesarios = idsUnicos.filter((productoId) => {
      const producto = obtenerProductoPorId.value(productoId)
      return debeHidratarPreciosProducto(producto, opciones.forzar)
    })

    if (idsNecesarios.length === 0) {
      return {
        hidratados: 0,
        omitidos: idsUnicos.length,
      }
    }

    const resultados = await Promise.all(
      idsNecesarios.map((productoId) => cargarPreciosProductoDesdeFirestore(productoId)),
    )
    const hidratados = resultados.filter(Boolean).length

    return {
      hidratados,
      omitidos: idsUnicos.length - hidratados,
    }
  }

  async function hidratarPreciosLista(lista, opciones = {}) {
    const productoIds = Array.isArray(lista?.items)
      ? lista.items.map((item) => item.productoId).filter(Boolean)
      : []
    return hidratarPreciosProductos(productoIds, opciones)
  }

  // ========================================
  // 📊 ACCIONES (ESTADÍSTICAS)
  // ========================================

  /**
   * 📊 OBTENER ESTADÍSTICAS
   * @returns {Promise<Object>} - Estadísticas generales
   */
  async function obtenerEstadisticas() {
    try {
      return await productosService.obtenerEstadisticas()
    } catch (err) {
      console.error('❌ Error al obtener estadísticas:', err)
      return {
        totalProductos: 0,
        totalPrecios: 0,
        promedioPrecios: 0,
      }
    }
  }

  // ========================================
  // 🧹 ACCIONES (LIMPIEZA)
  // ========================================

  /**
   * 🧹 LIMPIAR ESTADO
   * Resetea el store (útil para logout)
   */
  function limpiarEstado() {
    productos.value = []
    cargando.value = false
    error.value = null
    sincronizando.value = false
    errorSincronizacion.value = null
    fuenteDatos.value = fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.PRODUCTOS,
    )
    console.log('🧹 Estado del store limpiado')
  }

  // ========================================
  // 📤 RETURN (EXPORTAR)
  // ========================================

  function registrarResultadoSincronizacion(producto) {
    const estado = producto?.sincronizacionFirestore?.estado

    if (estado === ESTADOS_SINCRONIZACION.ERROR) {
      errorSincronizacion.value =
        producto.sincronizacionFirestore.mensaje ||
        'El producto quedó local, pero no se pudo sincronizar con Firestore.'
      return
    }

    errorSincronizacion.value = null
  }

  return {
    // Estado
    productos,
    cargando,
    error,
    sincronizando,
    errorSincronizacion,
    fuenteDatos,

    // Computed
    totalProductos,
    productosOrdenadosPorNombre,
    productosOrdenadosPorFecha,
    productosPorInteraccion,
    obtenerProductoPorId,
    tieneProductos,

    // Acciones
    cargarProductos,
    recargarProductos,
    agregarProducto,
    agregarPrecioAProducto,
    actualizarProducto,
    eliminarProducto,
    registrarInteraccion,
    buscarProductos,
    cargarPreciosProductoDesdeFirestore,
    hidratarPreciosProductos,
    hidratarPreciosLista,
    obtenerEstadisticas,
    limpiarEstado,
  }
})

// 🔥 NOTAS PARA FIRESTORE:
//
// 1. LISTENERS EN TIEMPO REAL:
//    En cargarProductos(), agregar:
//
//    const unsubscribe = db.collection('productos')
//      .where('usuarioId', '==', userId)
//      .onSnapshot((snapshot) => {
//        productos.value = snapshot.docs.map(doc => ({
//          id: doc.id,
//          ...doc.data()
//        }))
//      })
//
// 2. ESTADO DE SINCRONIZACIÓN:
//    Implementar lógica para detectar cuando hay cambios pendientes:
//
//    async function sincronizarPendientes() {
//      const pendientes = productos.value.filter(p => p.pendienteSincronizar)
//      for (const producto of pendientes) {
//        await subirAFirestore(producto)
//      }
//    }
//
// 3. MANEJO OFFLINE:
//    Firestore tiene persistencia offline automática, pero puedes:
//
//    import { enableIndexedDbPersistence } from 'firebase/firestore'
//    await enableIndexedDbPersistence(db)
//
// 4. OPTIMISTIC UPDATES:
//    Actualizar UI inmediatamente antes de confirmar con servidor:
//
//    productos.value.push(nuevoProducto) // Inmediato
//    await db.collection('productos').add(nuevoProducto) // Background
//
// 5. PAGINACIÓN:
//    Para apps con muchos productos:
//
//    async function cargarMasProductos(ultimoDocumento) {
//      const query = db.collection('productos')
//        .startAfter(ultimoDocumento)
//        .limit(20)
//      // ...
//    }
