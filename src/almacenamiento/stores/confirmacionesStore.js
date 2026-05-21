/**
 * 👍 STORE DE CONFIRMACIONES (PINIA)
 *
 * Este store maneja el ESTADO GLOBAL de confirmaciones de precios.
 * Controla qué precios ha confirmado el usuario actual.
 *
 * 📌 RESPONSABILIDADES:
 * - Mantener Set de precios confirmados por el usuario
 * - Exponer acciones para confirmar/des-confirmar
 * - Llamar a ConfirmacionesService para persistencia
 * - Sincronizar con ProductosStore cuando hay cambios
 *
 * 🔥 MIGRACIÓN A FIRESTORE:
 * En Firestore, las confirmaciones serán documentos separados.
 * Este store se suscribirá a cambios en tiempo real para actualizar
 * contadores automáticamente cuando otros usuarios confirmen.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import confirmacionesService from '../servicios/ConfirmacionesService.js'
import fuentePrincipalFirestoreService from '../servicios/FuentePrincipalFirestoreService.js'
import { useProductosStore } from './productosStore.js'
import { useUsuarioStore } from './UsuarioStore.js'
import usuarioActualService from '../servicios/UsuarioActualService.js'

export const useConfirmacionesStore = defineStore('confirmaciones', () => {
  // ========================================
  // 📊 ESTADO
  // ========================================

  /**
   * 👤 ID DEL USUARIO ACTUAL
   *
   * 🔥 FIRESTORE: Esto vendrá de Firebase Auth
   * const user = auth.currentUser
   * usuarioActualId.value = user.uid
   */
  const usuarioActualId = ref(usuarioActualService.obtenerUsuarioIdActual())

  /**
   * ✅ SET DE PRECIOS CONFIRMADOS
   * Contiene los IDs de precios que el usuario ha confirmado
   */
  const preciosConfirmados = ref(new Set())

  /**
   * ⏳ ESTADO DE CARGA
   */
  const cargando = ref(false)

  /**
   * ❌ ERROR
   */
  const error = ref(null)
  const fuenteDatos = ref(
    fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.CONFIRMACIONES,
    ),
  )

  function sincronizarUsuarioActual() {
    usuarioActualId.value = usuarioActualService.obtenerUsuarioIdActual()
  }

  // ========================================
  // 🧮 COMPUTED (GETTERS)
  // ========================================

  /**
   * 🔢 TOTAL DE CONFIRMACIONES DEL USUARIO
   */
  const totalConfirmaciones = computed(() => preciosConfirmados.value.size)

  /**
   * ❓ VERIFICAR SI PRECIO ESTÁ CONFIRMADO
   * @param {string} precioId - ID del precio
   */
  const precioEstaConfirmado = computed(() => {
    return (precioId) => {
      return preciosConfirmados.value.has(precioId)
    }
  })

  /**
   * 📋 LISTA DE CONFIRMACIONES (Array)
   */
  const listaConfirmaciones = computed(() => {
    return Array.from(preciosConfirmados.value)
  })

  /**
   * ❓ TIENE CONFIRMACIONES
   */
  const tieneConfirmaciones = computed(() => preciosConfirmados.value.size > 0)

  // ========================================
  // 🔄 ACCIONES (CARGAR DATOS)
  // ========================================

  /**
   * 📥 CARGAR CONFIRMACIONES DEL USUARIO
   * Lee confirmaciones desde el almacenamiento
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const unsubscribe = db.collection('confirmaciones')
   *   .where('usuarioId', '==', currentUserId)
   *   .onSnapshot((snapshot) => {
   *     const ids = new Set()
   *     snapshot.forEach(doc => ids.add(doc.data().precioId))
   *     preciosConfirmados.value = ids
   *   })
   */
  async function cargarConfirmaciones() {
    sincronizarUsuarioActual()
    cargando.value = true
    error.value = null

    try {
      console.log(`📥 Cargando confirmaciones de ${usuarioActualId.value}...`)

      const usuarioStore = useUsuarioStore()
      await usuarioStore.esperarSesionLista()
      sincronizarUsuarioActual()

      const resultado = await fuentePrincipalFirestoreService.cargarConfirmaciones({
        cargarLocal: () => confirmacionesService.obtenerConfirmacionesUsuario(usuarioActualId.value),
      })
      const confirmaciones = resultado.datos instanceof Set ? resultado.datos : new Set()

      preciosConfirmados.value = confirmaciones
      fuenteDatos.value = resultado

      console.log(`✅ ${confirmaciones.size} confirmaciones cargadas`)
    } catch (err) {
      console.error('❌ Error al cargar confirmaciones:', err)
      error.value = 'No se pudieron cargar las confirmaciones'
    } finally {
      cargando.value = false
    }
  }

  /**
   * 🔄 RECARGAR CONFIRMACIONES
   */
  async function recargarConfirmaciones() {
    await cargarConfirmaciones()
  }

  // ========================================
  // 👍 ACCIONES (CONFIRMAR)
  // ========================================

  /**
   * 👍 CONFIRMAR PRECIO
   * @param {number} productoId - ID del producto
   * @param {string} precioId - ID del precio
   * @returns {Promise<Object>} - Resultado {exito, mensaje}
   *
   * 🔥 FIRESTORE: Usar transacciones para garantizar consistencia
   */
  async function confirmarPrecio(productoId, precioId) {
    sincronizarUsuarioActual()
    // Verificar que no esté ya confirmado (validación local rápida)
    if (preciosConfirmados.value.has(precioId)) {
      return {
        exito: false,
        mensaje: 'Ya confirmaste este precio',
      }
    }

    cargando.value = true
    error.value = null

    try {
      console.log(`👍 Confirmando precio ${precioId} del producto ${productoId}`)

      const resultado = await confirmacionesService.confirmarPrecio(
        usuarioActualId.value,
        productoId,
        precioId,
      )

      if (resultado.exito) {
        // Actualizar estado local
        preciosConfirmados.value.add(precioId)

        // Actualizar producto en ProductosStore
        const productosStore = useProductosStore()
        if (resultado.producto) {
          const index = productosStore.productos.findIndex((p) => p.id === productoId)
          if (index !== -1) {
            productosStore.productos[index] = resultado.producto
          }
        }

        console.log('✅ Precio confirmado exitosamente')
      }

      return resultado
    } catch (err) {
      console.error('❌ Error al confirmar precio:', err)
      error.value = 'Error al confirmar precio'
      return {
        exito: false,
        mensaje: 'Error inesperado',
      }
    } finally {
      cargando.value = false
    }
  }

  /**
   * 👍 CONFIRMAR MÚLTIPLES PRECIOS (BATCH)
   * Útil si el usuario selecciona varios precios a la vez
   *
   * @param {Array} listaPrecios - Array de {productoId, precioId}
   * @returns {Promise<Object>} - Resultado con confirmados/fallidos
   *
   * 🔥 FIRESTORE: Usar batch writes para eficiencia
   */
  async function confirmarPreciosBatch(listaPrecios) {
    const resultados = {
      confirmados: 0,
      fallidos: 0,
      detalles: [],
    }

    for (const { productoId, precioId } of listaPrecios) {
      const resultado = await confirmarPrecio(productoId, precioId)

      if (resultado.exito) {
        resultados.confirmados++
      } else {
        resultados.fallidos++
      }

      resultados.detalles.push({
        productoId,
        precioId,
        ...resultado,
      })
    }

    console.log(
      `✅ Batch completado: ${resultados.confirmados} confirmados, ${resultados.fallidos} fallidos`,
    )
    return resultados
  }

  // ========================================
  // 🗑️ ACCIONES (ELIMINAR CONFIRMACIÓN)
  // ========================================

  /**
   * 🗑️ ELIMINAR CONFIRMACIÓN (Des-confirmar)
   * @param {number} productoId - ID del producto
   * @param {string} precioId - ID del precio
   * @returns {Promise<Object>} - Resultado
   *
   * ⚠️ NOTA: Esta funcionalidad es opcional.
   * Muchas apps no permiten des-confirmar (like de YouTube, por ejemplo).
   */
  async function eliminarConfirmacion(productoId, precioId) {
    sincronizarUsuarioActual()
    // Verificar que esté confirmado
    if (!preciosConfirmados.value.has(precioId)) {
      return {
        exito: false,
        mensaje: 'No has confirmado este precio',
      }
    }

    cargando.value = true
    error.value = null

    try {
      console.log(`🗑️ Eliminando confirmación de precio ${precioId}`)

      const resultado = await confirmacionesService.eliminarConfirmacion(
        usuarioActualId.value,
        productoId,
        precioId,
      )

      if (resultado.exito) {
        // Actualizar estado local
        preciosConfirmados.value.delete(precioId)

        // Actualizar producto en ProductosStore
        const productosStore = useProductosStore()
        if (resultado.producto) {
          const index = productosStore.productos.findIndex((p) => p.id === productoId)
          if (index !== -1) {
            productosStore.productos[index] = resultado.producto
          }
        }

        console.log('✅ Confirmación eliminada')
      }

      return resultado
    } catch (err) {
      console.error('❌ Error al eliminar confirmación:', err)
      error.value = 'Error al eliminar confirmación'
      return {
        exito: false,
        mensaje: 'Error inesperado',
      }
    } finally {
      cargando.value = false
    }
  }

  // ========================================
  // 📊 ACCIONES (ESTADÍSTICAS)
  // ========================================

  /**
   * 📊 OBTENER ESTADÍSTICAS DE CONFIRMACIONES
   * @returns {Promise<Object>} - Estadísticas del usuario
   */
  async function obtenerEstadisticas() {
    try {
      return await confirmacionesService.obtenerEstadisticas(usuarioActualId.value)
    } catch (err) {
      console.error('❌ Error al obtener estadísticas:', err)
      return {
        totalConfirmaciones: 0,
        preciosConfirmados: [],
      }
    }
  }

  // ========================================
  // 🧹 ACCIONES (LIMPIEZA)
  // ========================================

  /**
   * 🧹 LIMPIAR CONFIRMACIONES DEL USUARIO
   * Elimina TODAS las confirmaciones (útil para testing)
   *
   * ⚠️ PELIGROSO: No hay vuelta atrás
   */
  async function limpiarTodasLasConfirmaciones() {
    sincronizarUsuarioActual()
    cargando.value = true
    error.value = null

    try {
      console.log('🧹 Limpiando todas las confirmaciones...')

      const limpiado = await confirmacionesService.limpiarConfirmacionesUsuario(
        usuarioActualId.value,
      )

      if (limpiado) {
        preciosConfirmados.value.clear()
        console.log('✅ Confirmaciones limpiadas')
        return true
      }

      return false
    } catch (err) {
      console.error('❌ Error al limpiar confirmaciones:', err)
      error.value = 'Error al limpiar confirmaciones'
      return false
    } finally {
      cargando.value = false
    }
  }

  /**
   * 🧹 LIMPIAR ESTADO (Reset del store)
   */
  function limpiarEstado() {
    preciosConfirmados.value.clear()
    cargando.value = false
    error.value = null
    fuenteDatos.value = fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.CONFIRMACIONES,
    )
    console.log('🧹 Estado del store de confirmaciones limpiado')
  }

  // ========================================
  // 👤 ACCIONES (USUARIO)
  // ========================================

  /**
   * 👤 CAMBIAR USUARIO ACTUAL
   * Útil cuando implementes autenticación real
   *
   * @param {string} nuevoUsuarioId - ID del nuevo usuario
   *
   * 🔥 FIRESTORE: Llamar esto cuando cambie auth.currentUser
   */
  async function cambiarUsuario(nuevoUsuarioId) {
    console.log(`👤 Cambiando usuario: ${usuarioActualId.value} → ${nuevoUsuarioId}`)

    // Limpiar estado anterior
    limpiarEstado()

    // Actualizar ID
    usuarioActualId.value = usuarioActualService.cambiarUsuarioActual(nuevoUsuarioId).id

    // Cargar confirmaciones del nuevo usuario
    await cargarConfirmaciones()
  }

  // ========================================
  // 📤 RETURN (EXPORTAR)
  // ========================================

  return {
    // Estado
    usuarioActualId,
    preciosConfirmados,
    cargando,
    error,
    fuenteDatos,

    // Computed
    totalConfirmaciones,
    precioEstaConfirmado,
    listaConfirmaciones,
    tieneConfirmaciones,

    // Acciones
    cargarConfirmaciones,
    recargarConfirmaciones,
    confirmarPrecio,
    confirmarPreciosBatch,
    eliminarConfirmacion,
    obtenerEstadisticas,
    limpiarTodasLasConfirmaciones,
    limpiarEstado,
    cambiarUsuario,
  }
})

// 🔥 NOTAS PARA FIRESTORE:
//
// 1. LISTENERS EN TIEMPO REAL:
//    Suscribirse a cambios de confirmaciones:
//
//    const unsubscribe = db.collection('confirmaciones')
//      .where('usuarioId', '==', currentUserId)
//      .onSnapshot((snapshot) => {
//        const ids = new Set()
//        snapshot.forEach(doc => {
//          ids.add(doc.data().precioId)
//        })
//        preciosConfirmados.value = ids
//      })
//
// 2. ACTUALIZACIÓN EN TIEMPO REAL DE CONTADORES:
//    Cuando otros usuarios confirmen, actualizar UI automáticamente:
//
//    db.collection('precios').doc(precioId)
//      .onSnapshot((doc) => {
//        // Actualizar contador de confirmaciones en UI
//        const nuevasConfirmaciones = doc.data().confirmaciones
//        // Actualizar producto en ProductosStore
//      })
//
// 3. TRANSACCIONES PARA CONSISTENCIA:
//    Al confirmar, usar transacciones:
//
//    await db.runTransaction(async (transaction) => {
//      // 1. Verificar que no existe confirmación
//      const confirmacionRef = db.collection('confirmaciones')
//        .where('usuarioId', '==', userId)
//        .where('precioId', '==', precioId)
//
//      const existe = await transaction.get(confirmacionRef)
//      if (!existe.empty) throw new Error('Ya confirmado')
//
//      // 2. Crear confirmación
//      const nuevaConfirmacion = db.collection('confirmaciones').doc()
//      transaction.set(nuevaConfirmacion, {
//        usuarioId,
//        precioId,
//        fecha: firebase.firestore.FieldValue.serverTimestamp()
//      })
//
//      // 3. Incrementar contador
//      const precioRef = db.collection('precios').doc(precioId)
//      transaction.update(precioRef, {
//        confirmaciones: firebase.firestore.FieldValue.increment(1)
//      })
//    })
//
// 4. AUTENTICACIÓN:
//    Integrar con Firebase Auth:
//
//    import { getAuth, onAuthStateChanged } from 'firebase/auth'
//    const auth = getAuth()
//
//    onAuthStateChanged(auth, (user) => {
//      if (user) {
//        cambiarUsuario(user.uid)
//      } else {
//        limpiarEstado()
//      }
//    })
//
// 5. PREVENCIÓN DE ABUSO:
//    Rate limiting en servidor (Firebase Functions):
//
//    exports.confirmarPrecio = functions.https.onCall(async (data, context) => {
//      // Verificar autenticación
//      if (!context.auth) throw new Error('No autenticado')
//
//      // Rate limiting (máximo 10 confirmaciones por minuto)
//      const ultimasConfirmaciones = await db.collection('confirmaciones')
//        .where('usuarioId', '==', context.auth.uid)
//        .where('fecha', '>=', hace1Minuto)
//        .get()
//
//      if (ultimasConfirmaciones.size >= 10) {
//        throw new Error('Demasiadas confirmaciones, espera un momento')
//      }
//
//      // Confirmar precio...
//    })
