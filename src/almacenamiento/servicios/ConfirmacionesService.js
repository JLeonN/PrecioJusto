/**
 * 👍 SERVICIO DE CONFIRMACIONES
 *
 * Este servicio maneja la lógica de confirmaciones (upvotes) de precios.
 * Un usuario solo puede confirmar 1 vez cada precio.
 *
 * 📌 RESPONSABILIDADES:
 * - Registrar confirmaciones de usuarios
 * - Validar que no se confirme 2 veces el mismo precio
 * - Persistir confirmaciones del usuario actual
 * - Incrementar contador de confirmaciones en precios
 *
 * 🔥 MIGRACIÓN A FIRESTORE:
 * En Firestore, las confirmaciones serán documentos separados:
 * /confirmaciones/{confirmacionId} {
 *   usuarioId: string,
 *   precioId: string,
 *   fecha: timestamp
 * }
 *
 * Esto permite:
 * - Queries eficientes: "¿cuántos usuarios confirmaron este precio?"
 * - Validación: "¿este usuario ya confirmó este precio?"
 * - Escalabilidad: No guardar arrays enormes en un solo documento
 */

import { adaptadorActual } from './AlmacenamientoService.js'
import productosService from './ProductosService.js'
import { PREFIJO_CONFIRMACIONES } from '../constantes/ClavesAlmacenamiento.js'

class ConfirmacionesService {
  constructor() {
    this.adaptador = adaptadorActual
    this.prefijoConfirmaciones = PREFIJO_CONFIRMACIONES

    console.log('👍 ConfirmacionesService inicializado con', this.adaptador.constructor.name)
  }

  // ========================================
  // 👍 CONFIRMAR PRECIO
  // ========================================

  /**
   * 👍 CONFIRMAR UN PRECIO
   * @param {string} usuarioId - ID del usuario actual
   * @param {number} productoId - ID del producto
   * @param {string} precioId - ID del precio a confirmar
   * @returns {Promise<Object|null>} - Resultado {exito, mensaje, producto}
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * // 1. Verificar si ya confirmó
   * const existe = await db.collection('confirmaciones')
   *   .where('usuarioId', '==', usuarioId)
   *   .where('precioId', '==', precioId)
   *   .get()
   *
   * if (!existe.empty) return { exito: false, mensaje: 'Ya confirmaste' }
   *
   * // 2. Crear confirmación
   * await db.collection('confirmaciones').add({
   *   usuarioId,
   *   precioId,
   *   fecha: firebase.firestore.FieldValue.serverTimestamp()
   * })
   *
   * // 3. Incrementar contador
   * await db.collection('precios').doc(precioId).update({
   *   confirmaciones: firebase.firestore.FieldValue.increment(1)
   * })
   */
  async confirmarPrecio(usuarioId, productoId, precioId) {
    try {
      // Validar parámetros
      if (!usuarioId || !productoId || !precioId) {
        return {
          exito: false,
          mensaje: 'Parámetros inválidos',
        }
      }

      // Verificar si ya confirmó este precio
      const yaConfirmo = await this.usuarioConfirmoPrecio(usuarioId, precioId)
      if (yaConfirmo) {
        return {
          exito: false,
          mensaje: 'Ya confirmaste este precio anteriormente',
        }
      }

      // Obtener el producto
      const producto = await productosService.obtenerProducto(productoId)
      if (!producto) {
        return {
          exito: false,
          mensaje: 'Producto no encontrado',
        }
      }

      // Buscar el precio específico
      const precio = producto.precios?.find((p) => p.id === precioId)
      if (!precio) {
        return {
          exito: false,
          mensaje: 'Precio no encontrado',
        }
      }

      // Incrementar confirmaciones del precio
      precio.confirmaciones = (precio.confirmaciones || 0) + 1

      // Guardar producto actualizado
      const productoActualizado = await productosService.guardarProducto(producto)
      if (!productoActualizado) {
        return {
          exito: false,
          mensaje: 'Error al actualizar producto',
        }
      }

      // Registrar confirmación del usuario
      await this.registrarConfirmacionUsuario(usuarioId, precioId)

      console.log(`✅ Usuario ${usuarioId} confirmó precio ${precioId}`)

      return {
        exito: true,
        mensaje: 'Precio confirmado exitosamente',
        producto: productoActualizado,
        nuevasConfirmaciones: precio.confirmaciones,
      }
    } catch (error) {
      console.error('❌ Error al confirmar precio:', error)
      return {
        exito: false,
        mensaje: 'Error inesperado al confirmar',
      }
    }
  }

  // ========================================
  // 📋 CONFIRMACIONES DEL USUARIO
  // ========================================

  /**
   * 📋 OBTENER CONFIRMACIONES DEL USUARIO
   * @param {string} usuarioId - ID del usuario
   * @returns {Promise<Set>} - Set de IDs de precios confirmados
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const snapshot = await db.collection('confirmaciones')
   *   .where('usuarioId', '==', usuarioId)
   *   .get()
   *
   * const ids = new Set()
   * snapshot.forEach(doc => ids.add(doc.data().precioId))
   * return ids
   */
  async obtenerConfirmacionesUsuario(usuarioId) {
    try {
      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const confirmaciones = await this.adaptador.obtener(clave)

      // Si no existe, devolver Set vacío
      if (!confirmaciones) {
        return new Set()
      }

      // Si es un array, convertir a Set
      if (Array.isArray(confirmaciones)) {
        return new Set(confirmaciones)
      }

      // Si ya es un objeto con estructura Set (tiene los IDs)
      if (confirmaciones.preciosConfirmados) {
        return new Set(confirmaciones.preciosConfirmados)
      }

      return new Set()
    } catch (error) {
      console.error(`❌ Error al obtener confirmaciones de ${usuarioId}:`, error)
      return new Set()
    }
  }

  /**
   * 💾 REGISTRAR CONFIRMACIÓN DEL USUARIO
   * @param {string} usuarioId - ID del usuario
   * @param {string} precioId - ID del precio confirmado
   * @returns {Promise<boolean>} - true si guardó exitosamente
   * @private
   */
  async registrarConfirmacionUsuario(usuarioId, precioId) {
    try {
      // Obtener confirmaciones actuales
      const confirmacionesActuales = await this.obtenerConfirmacionesUsuario(usuarioId)

      // Agregar nueva confirmación
      confirmacionesActuales.add(precioId)

      // Convertir Set a Array para guardar
      const confirmacionesArray = Array.from(confirmacionesActuales)

      // Guardar
      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const datos = {
        usuarioId: usuarioId,
        preciosConfirmados: confirmacionesArray,
        fechaActualizacion: new Date().toISOString(),
      }

      const guardado = await this.adaptador.guardar(clave, datos)

      if (guardado) {
        console.log(`✅ Confirmación registrada: ${usuarioId} -> ${precioId}`)
      }

      return guardado
    } catch (error) {
      console.error('❌ Error al registrar confirmación:', error)
      return false
    }
  }

  /**
   * ❓ VERIFICAR SI USUARIO YA CONFIRMÓ UN PRECIO
   * @param {string} usuarioId - ID del usuario
   * @param {string} precioId - ID del precio
   * @returns {Promise<boolean>} - true si ya confirmó
   */
  async usuarioConfirmoPrecio(usuarioId, precioId) {
    try {
      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)
      return confirmaciones.has(precioId)
    } catch (error) {
      console.error('❌ Error al verificar confirmación:', error)
      return false
    }
  }

  // ========================================
  // 🗑️ ELIMINAR CONFIRMACIÓN (OPCIONAL)
  // ========================================

  /**
   * 🗑️ ELIMINAR CONFIRMACIÓN (Des-confirmar)
   * Útil si quieres permitir que el usuario cambie de opinión
   *
   * @param {string} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto
   * @param {string} precioId - ID del precio
   * @returns {Promise<Object>} - Resultado de la operación
   *
   * ⚠️ ADVERTENCIA: Esto es opcional. Muchas apps no permiten des-confirmar.
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * // 1. Eliminar confirmación
   * await db.collection('confirmaciones').doc(confirmacionId).delete()
   *
   * // 2. Decrementar contador
   * await db.collection('precios').doc(precioId).update({
   *   confirmaciones: firebase.firestore.FieldValue.increment(-1)
   * })
   */
  async eliminarConfirmacion(usuarioId, productoId, precioId) {
    try {
      // Verificar que haya confirmado
      const yaConfirmo = await this.usuarioConfirmoPrecio(usuarioId, precioId)
      if (!yaConfirmo) {
        return {
          exito: false,
          mensaje: 'No has confirmado este precio',
        }
      }

      // Obtener producto
      const producto = await productosService.obtenerProducto(productoId)
      if (!producto) {
        return {
          exito: false,
          mensaje: 'Producto no encontrado',
        }
      }

      // Buscar precio
      const precio = producto.precios?.find((p) => p.id === precioId)
      if (!precio) {
        return {
          exito: false,
          mensaje: 'Precio no encontrado',
        }
      }

      // Decrementar confirmaciones (mínimo 0)
      precio.confirmaciones = Math.max(0, (precio.confirmaciones || 0) - 1)

      // Guardar producto
      const productoActualizado = await productosService.guardarProducto(producto)

      // Eliminar de confirmaciones del usuario
      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)
      confirmaciones.delete(precioId)

      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const datos = {
        usuarioId: usuarioId,
        preciosConfirmados: Array.from(confirmaciones),
        fechaActualizacion: new Date().toISOString(),
      }

      await this.adaptador.guardar(clave, datos)

      console.log(`✅ Confirmación eliminada: ${usuarioId} -> ${precioId}`)

      return {
        exito: true,
        mensaje: 'Confirmación eliminada',
        producto: productoActualizado,
      }
    } catch (error) {
      console.error('❌ Error al eliminar confirmación:', error)
      return {
        exito: false,
        mensaje: 'Error inesperado',
      }
    }
  }

  // ========================================
  // 📊 ESTADÍSTICAS
  // ========================================

  /**
   * 📊 OBTENER ESTADÍSTICAS DE CONFIRMACIONES
   * @param {string} usuarioId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas
   */
  async obtenerEstadisticas(usuarioId) {
    try {
      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)

      return {
        totalConfirmaciones: confirmaciones.size,
        preciosConfirmados: Array.from(confirmaciones),
      }
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error)
      return {
        totalConfirmaciones: 0,
        preciosConfirmados: [],
      }
    }
  }

  /**
   * 🧹 LIMPIAR CONFIRMACIONES DEL USUARIO
   * Útil para testing o si el usuario quiere resetear
   *
   * @param {string} usuarioId - ID del usuario
   * @returns {Promise<boolean>} - true si limpió exitosamente
   */
  async limpiarConfirmacionesUsuario(usuarioId) {
    try {
      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const eliminado = await this.adaptador.eliminar(clave)

      if (eliminado) {
        console.log(`✅ Confirmaciones limpiadas para usuario ${usuarioId}`)
      }

      return eliminado
    } catch (error) {
      console.error('❌ Error al limpiar confirmaciones:', error)
      return false
    }
  }
}

// Exportar instancia única (Singleton)
export default new ConfirmacionesService()

// 🔥 CHECKLIST PARA FIRESTORE:
//
// [ ] Sistema de confirmaciones funciona correctamente
// [ ] Usuario no puede confirmar 2 veces el mismo precio
// [ ] Las confirmaciones persisten correctamente
// [ ] Los contadores de confirmaciones son precisos
//
// MEJORAS PARA FIRESTORE:
//
// 1. ESTRUCTURA DE DATOS RECOMENDADA:
//
//    Colección: confirmaciones/
//    Documento: {confirmacionId}
//    {
//      usuarioId: string,
//      precioId: string,
//      productoId: string,
//      fecha: timestamp,
//      ip: string (opcional, para prevenir abuso)
//    }
//
//    Índice compuesto: (usuarioId, precioId)
//
// 2. TRANSACCIONES:
//    Usar transacciones de Firestore para garantizar consistencia:
//
//    await db.runTransaction(async (transaction) => {
//      // 1. Verificar que no existe confirmación
//      // 2. Crear confirmación
//      // 3. Incrementar contador
//    })
//
// 3. PREVENCIÓN DE ABUSO:
//    - Rate limiting: máximo X confirmaciones por minuto
//    - Validar IP para detectar bots
//    - Reportar confirmaciones sospechosas
//
// 4. GAMIFICACIÓN (OPCIONAL):
//    - Badges por cantidad de confirmaciones
//    - Ranking de usuarios más activos
//    - Puntos por colaborar con la comunidad
//
// 5. NOTIFICACIONES:
//    - Notificar al usuario que agregó el precio cuando alguien lo confirma
//    - "¡Tu precio en TATA fue confirmado por 10 usuarios!"
